import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import { ErrorCode } from '../enums/error-code.enum';
import { CustomError } from '../classes/custom-error';
import { META_UNPROTECTED } from 'nest-keycloak-connect';
import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
   private readonly excludedRoutes = [
      '/docs',
      '/docs-json',
      '/favicon.ico',
      '/api/healthz',
      '/api/v1/healthz',
      '/docs/swagger-ui.css',
      '/docs/swagger-ui-bundle.js',
      '/docs/swagger-ui-standalone-preset.js',
      '/docs/favicon-32x32.png',
      '/docs/favicon-16x16.png',
   ];

   constructor(private readonly reflector: Reflector) {}

   canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      const path = this.normalizePath(request.path || '');

      if (this.isExcludedRoute(path)) {
         return true;
      }

      if (this.isPublicRoute(context)) {
         return true;
      }

      const configuredApiKey = process.env.API_KEY;
      if (!configuredApiKey) {
         throw new CustomError('API key not configured', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const providedHeader = request.headers['x-api-key'];
      const providedApiKey = Array.isArray(providedHeader) ? providedHeader[0] : providedHeader;

      if (!providedApiKey || !this.isMatchingApiKey(providedApiKey, configuredApiKey)) {
         throw new CustomError('Invalid or missing API key', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      return true;
   }

   private normalizePath(path: string): string {
      return path.replace(/\/+$/, '');
   }

   private isExcludedRoute(path: string): boolean {
      return this.excludedRoutes.some(route => path === route || path.startsWith(`${route}/`));
   }

   private isPublicRoute(context: ExecutionContext): boolean {
      return this.reflector.getAllAndOverride<boolean>(
         META_UNPROTECTED,
         [context.getHandler(), context.getClass()],
      ) === true;
   }

   private isMatchingApiKey(providedApiKey: string, configuredApiKey: string): boolean {
      const providedBuffer = Buffer.from(providedApiKey, 'utf8');
      const configuredBuffer = Buffer.from(configuredApiKey, 'utf8');

      if (providedBuffer.length !== configuredBuffer.length) {
         return false;
      }

      return timingSafeEqual(providedBuffer, configuredBuffer);
   }
}
