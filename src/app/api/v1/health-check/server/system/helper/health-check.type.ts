export interface HealthCheckRequest {
  url: string;
  method: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
}

export interface HealthCheckResult {
  module: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: HealthCheckRequest;
  response: Record<string, unknown> | null;
  group: string;
  response_time_ms: number;
}
