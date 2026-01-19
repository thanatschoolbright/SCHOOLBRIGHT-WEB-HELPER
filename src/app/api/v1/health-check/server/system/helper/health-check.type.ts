export interface HealthCheckResult {
  module: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: any;
  response: any;
  group: any;
}
