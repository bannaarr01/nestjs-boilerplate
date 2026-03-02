import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { parseBooleanEnv } from '../utils/env.util';
import { RequestOptions } from './types/request.types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoggingService } from '../logging/logging.service';
import { ProxyConfigService } from './proxy-config.service';
import { CustomError } from '../common/classes/custom-error';
import { ProxyServiceConfig } from './interfaces/proxy-config.interface';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly proxyConfigService: ProxyConfigService,
    private readonly logger: LoggingService,
    private readonly errorHandler: ErrorHandlerService
  ) {}

  async executeRequest<T = unknown>(
    serviceName: string,
    endpointName: string,
    method: string,
    options: RequestOptions = {},
    overrideBaseUrl?: string
  ): Promise<T> {
    try {
      const serviceConfig = this.proxyConfigService.getServiceConfig(serviceName);
      if (!serviceConfig) {
        throw new CustomError(`Service '${serviceName}' not configured`, HttpStatus.SERVICE_UNAVAILABLE);
      }

      const endpointConfig = serviceConfig.endpoints[endpointName];
      if (!endpointConfig) {
        throw new CustomError(
          `Endpoint '${endpointName}' not configured for service '${serviceName}'`,
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      if (overrideBaseUrl && !parseBooleanEnv(process.env.PROXY_ALLOW_BASE_URL_OVERRIDE, false)) {
        throw new CustomError(
          'Proxy base URL override is disabled. Set PROXY_ALLOW_BASE_URL_OVERRIDE=true to enable.',
          HttpStatus.FORBIDDEN
        );
      }

      const resolvedBaseUrl = overrideBaseUrl || serviceConfig.baseUrl;
      const url = this.buildUrl(resolvedBaseUrl, endpointConfig.targetEndpoint, options.params || {});
      const timeoutMs = endpointConfig.timeoutMs || serviceConfig.timeoutMs || 30000;
      const headers = {
        ...(serviceConfig.headers || {}),
        ...(endpointConfig.headers || {}),
        ...(options.headers || {})
      };

      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as AxiosRequestConfig['method'],
        url,
        timeout: timeoutMs,
        params: options.query || {},
        headers,
        maxRedirects: Number(process.env.PROXY_MAX_REDIRECTS || 0)
      };

      const methodUpper = method.toUpperCase();
      if (!['GET', 'DELETE'].includes(methodUpper) && options.data !== undefined) {
        config.data = options.data;
      }

      const response = (await firstValueFrom(this.httpService.request<T>(config))) as AxiosResponse<T>;
      return response.data;
    } catch (error) {
      this.logger.getLogger().error((error as Error)?.message || 'Proxy request failed', {
        label: 'ProxyService.executeRequest'
      });
      throw this.errorHandler.handleServiceError(error, ProxyService, '.executeRequest');
    }
  }

  async executeDynamicRequest<T = unknown>(
    config: ProxyServiceConfig,
    endpointName: string,
    method: string,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!parseBooleanEnv(process.env.PROXY_ALLOW_DYNAMIC_CONFIG, false)) {
      throw new CustomError(
        'Dynamic proxy configuration is disabled. Set PROXY_ALLOW_DYNAMIC_CONFIG=true to enable.',
        HttpStatus.FORBIDDEN
      );
    }

    const tempName = `__dynamic_service__${randomUUID()}`;
    this.proxyConfigService.setServiceConfig(tempName, config);

    try {
      return await this.executeRequest<T>(tempName, endpointName, method, options);
    } finally {
      this.proxyConfigService.removeServiceConfig(tempName);
    }
  }

  private buildUrl(
    baseUrl: string,
    endpoint: string,
    params: Record<string, string | number>
  ): string {
    const validatedBaseUrl = this.validateBaseUrl(baseUrl);
    let url = `${validatedBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    return url;
  }

  private validateBaseUrl(baseUrl: string): string {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(baseUrl);
    } catch {
      throw new CustomError(`Invalid proxy base URL: ${baseUrl}`, HttpStatus.BAD_REQUEST);
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new CustomError('Proxy base URL must use http or https', HttpStatus.BAD_REQUEST);
    }

    if (parsedUrl.username || parsedUrl.password) {
      throw new CustomError('Proxy base URL must not contain credentials', HttpStatus.BAD_REQUEST);
    }

    if (!parseBooleanEnv(process.env.PROXY_ALLOW_PRIVATE_IPS, false) && this.isPrivateOrLocalHost(parsedUrl.hostname)) {
      throw new CustomError(
        `Proxy target host is blocked by default policy: ${parsedUrl.hostname}`,
        HttpStatus.FORBIDDEN
      );
    }

    return parsedUrl.toString().replace(/\/$/, '');
  }

  private isPrivateOrLocalHost(hostname: string): boolean {
    const normalized = hostname.toLowerCase();

    if (normalized === 'localhost' || normalized === '::1') {
      return true;
    }

    if (normalized === '::') {
      return true;
    }

    if (normalized.startsWith('127.') || normalized.startsWith('169.254.')) {
      return true;
    }

    if (normalized === '0.0.0.0') {
      return true;
    }

    if (normalized.startsWith('10.') || normalized.startsWith('192.168.')) {
      return true;
    }

    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }

    if (/^fe[89ab][0-9a-f]*:/.test(normalized)) {
      return true;
    }

    const match = normalized.match(/^172\.(\d{1,3})\./);
    if (match) {
      const secondOctet = Number(match[1]);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }

    return false;
  }
}

