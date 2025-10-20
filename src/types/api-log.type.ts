/**
 * TypeScript types สำหรับ API Log Management
 */

export interface ApiLogItem {
  id: string;
  requestTime: string;
  responseTime?: string;
  durationMs?: number;
  method?: string;
  statusCode?: number;
  url?: string;
  endpoint?: string;
  serviceName?: string;
  requestHeader?: Record<string, any>;
  requestBody?: Record<string, any>;
  responseBody?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  calledBy?: string;
  traceId?: string;
  errorMessage?: string;
  isSuccess: boolean;
  createdAt: string;
  isArchived: boolean;
}

export interface ApiLogFilters {
  page?: number;
  limit?: number;
  serviceName?: string;
  isSuccess?: boolean;
  method?: string;
  statusCode?: number;
  endpoint?: string;
  calledBy?: string;
  traceId?: string;
  dateFrom?: string;
  dateTo?: string;
  isArchived?: boolean;
  sortBy?: 'request_time' | 'response_time' | 'duration_ms' | 'status_code';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiLogFormData {
  requestTime: string;
  responseTime?: string;
  durationMs?: number;
  method?: string;
  statusCode?: number;
  url?: string;
  endpoint?: string;
  serviceName?: string;
  requestHeader?: string;
  requestBody?: string;
  responseBody?: string;
  ipAddress?: string;
  userAgent?: string;
  calledBy?: string;
  traceId?: string;
  errorMessage?: string;
  isSuccess?: boolean;
  isArchived?: boolean;
}

export interface ApiLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiLogResponse {
  data: {
    logs: ApiLogItem[];
    pagination: ApiLogPagination;
    filters?: ApiLogFilters;
  };
  message: string;
  success: boolean;
  statusCode: number;
  timestamp: string;
}