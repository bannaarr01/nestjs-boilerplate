export interface ProxyEndpointConfig {
  targetEndpoint: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ProxyServiceConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  endpoints: Record<string, ProxyEndpointConfig>;
}
