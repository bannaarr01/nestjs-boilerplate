import { Injectable } from '@nestjs/common';
import { ProxyServiceConfig } from './interfaces/proxy-config.interface';

const DEFAULT_PROXY_SERVICES: Record<string, ProxyServiceConfig> = {};

@Injectable()
export class ProxyConfigService {
  private readonly configs: Record<string, ProxyServiceConfig>;

  constructor() {
    this.configs = this.loadConfigsFromEnv();
  }

  getProxyConfigurations(): Record<string, ProxyServiceConfig> {
    return this.configs;
  }

  getServiceConfig(serviceName: string): ProxyServiceConfig | undefined {
    return this.configs[serviceName];
  }

  setServiceConfig(serviceName: string, config: ProxyServiceConfig): void {
    this.configs[serviceName] = config;
  }

  removeServiceConfig(serviceName: string): void {
    delete this.configs[serviceName];
  }

  private loadConfigsFromEnv(): Record<string, ProxyServiceConfig> {
    const raw = process.env.PROXY_SERVICES_JSON;
    if (!raw) {
      return { ...DEFAULT_PROXY_SERVICES };
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, ProxyServiceConfig>;
      return { ...DEFAULT_PROXY_SERVICES, ...parsed };
    } catch {
      return { ...DEFAULT_PROXY_SERVICES };
    }
  }
}

