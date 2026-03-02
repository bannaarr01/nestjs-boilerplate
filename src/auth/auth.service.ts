import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { timingSafeEqual } from 'node:crypto';
import { parseBooleanEnv } from '../utils/env.util';
import { ErrorCode } from '../common/enums/error-code.enum';
import { AuthUser } from './interfaces/auth-user.interface';
import { CustomError } from '../common/classes/custom-error';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class AuthService {
   constructor(
    private readonly jwtService: JwtService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

   async login(loginDto: LoginDto): Promise<AuthResponseDto> {
      try {
         const demoModeEnabled = parseBooleanEnv(process.env.AUTH_DEMO_MODE, false);
         if (!demoModeEnabled) {
            throw new CustomError('Demo login is disabled', 403, ErrorCode.FORBIDDEN);
         }

         const expectedEmail = process.env.AUTH_DEMO_EMAIL;
         const expectedPassword = process.env.AUTH_DEMO_PASSWORD;

         if (!expectedEmail || !expectedPassword) {
            throw new CustomError(
               'AUTH_DEMO_EMAIL and AUTH_DEMO_PASSWORD must be configured when AUTH_DEMO_MODE=true',
               500,
               ErrorCode.INTERNAL_SERVER_ERROR
            );
         }

         if (
            !this.isTimingSafeMatch(loginDto.email, expectedEmail) ||
        !this.isTimingSafeMatch(loginDto.password, expectedPassword)
         ) {
            throw new UnauthorizedException('Invalid credentials');
         }

         const roles = this.parseCsvEnv(process.env.AUTH_DEMO_ROLES, ['admin']);
         const permissions = this.parseCsvEnv(process.env.AUTH_DEMO_PERMISSIONS, ['app:read', 'app:manage']);

         const payload: JwtPayload = {
            sub: 'demo-user',
            email: loginDto.email,
            roles,
            permissions
         };

         const expiresIn = Number(process.env.JWT_EXPIRES_IN || 3600);
         const accessToken = this.jwtService.sign(payload, { expiresIn });

         return {
            accessToken,
            expiresIn,
            user: {
               sub: payload.sub,
               email: payload.email,
               roles: payload.roles,
               permissions: payload.permissions
            }
         };
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AuthService, '.login');
      }
   }

   getAuthenticatedUser(user: AuthUser): AuthUserDto {
      try {
         return {
            sub: user.sub,
            email: user.email,
            roles: user.roles || [],
            permissions: user.permissions || []
         };
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AuthService, '.getAuthenticatedUser');
      }
   }

   private parseCsvEnv(value: string | undefined, fallback: string[]): string[] {
      if (!value) {
         return fallback;
      }

      const parsed = value
         .split(',')
         .map(item => item.trim())
         .filter(Boolean);

      return parsed.length > 0 ? parsed : fallback;
   }

   private isTimingSafeMatch(input: string, expected: string): boolean {
      const inputBuffer = Buffer.from(input, 'utf8');
      const expectedBuffer = Buffer.from(expected, 'utf8');

      if (inputBuffer.length !== expectedBuffer.length) {
         return false;
      }

      return timingSafeEqual(inputBuffer, expectedBuffer);
   }
}

