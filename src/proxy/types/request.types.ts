export type RequestOptions = {
  params?: Record<string, string | number>;
  data?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
};
