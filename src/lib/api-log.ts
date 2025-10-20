/**
 * Central export file สำหรับ API Logging System
 * ใช้สำหรับ import ที่สะดวกและจัดระเบียบ
 */

import type { CreateApiLogRequest, GetApiLogsRequest } from "@/types/api-log.types";

// Types
export type {
  CreateApiLogRequest,
  ApiLogResponse,
  ApiResponse,
  ApiErrorResponse,
  GetApiLogsRequest,
} from "@/types/api-log.types";

// Services
export { ApiLogService } from "@/services/backend/api-log/api-log.service";

// Utilities
export { ApiLogUtils } from "@/helpers/api-log.utils";

// Middleware
export {
  ApiLogMiddleware,
  withLogging,
  logApiCall,
  logError,
  createCustomLog,
} from "@/helpers/api-log.middleware";

/**
 * Quick start functions สำหรับใช้งานง่าย
 */

// สำหรับสร้าง log อย่างง่าย
export const quickLog = {
  /**
   * บันทึก successful API call
   */
  success: async (data: {
    method: string;
    url: string;
    statusCode: number;
    serviceName?: string;
    calledBy?: string;
    durationMs?: number;
  }) => {
    const { createCustomLog } = await import("@/helpers/api-log.middleware");
    return createCustomLog({
      ...data,
      statusCode: data.statusCode || 200,
    });
  },

  /**
   * บันทึก error API call
   */
  error: async (data: {
    method: string;
    url: string;
    statusCode: number;
    errorMessage: string;
    serviceName?: string;
    calledBy?: string;
  }) => {
    const { createCustomLog } = await import("@/helpers/api-log.middleware");
    return createCustomLog({
      ...data,
      statusCode: data.statusCode || 500,
      errorMessage: data.errorMessage,
    });
  },

  /**
   * บันทึก external API call
   */
  external: async (data: {
    method: string;
    url: string;
    statusCode: number;
    serviceName: string;
    requestBody?: any;
    responseBody?: any;
    durationMs?: number;
  }) => {
    const { createCustomLog } = await import("@/helpers/api-log.middleware");
    return createCustomLog({
      ...data,
      calledBy: "external-api",
    });
  },
};

/**
 * Helper functions สำหรับการเรียก API Logging endpoints
 */
export const apiLogClient = {
  /**
   * สร้าง API Log ใหม่
   */
  create: async (logData: CreateApiLogRequest) => {
    const axios = (await import("axios")).default;
    return axios.post("/api/v1/logger/create", logData);
  },

  /**
   * ค้นหา API Logs ด้วย filters
   */
  search: async (filters: GetApiLogsRequest = {}) => {
    const axios = (await import("axios")).default;
    return axios.post("/api/v1/logger/search", filters);
  },

  /**
   * ดึง API Log ตาม ID
   */
  getById: async (id: string) => {
    const axios = (await import("axios")).default;
    return axios.get(`/api/v1/logger/${id}`);
  },

  /**
   * ลบ API Log
   */
  delete: async (id: string) => {
    const axios = (await import("axios")).default;
    return axios.delete(`/api/v1/logger/${id}`);
  },

  /**
   * อัปเดตสถานะ archive
   */
  updateArchive: async (id: string, isArchived: boolean) => {
    const axios = (await import("axios")).default;
    return axios.patch(`/api/v1/logger/${id}/archive`, { isArchived });
  },
};

/**
 * Constants สำหรับ API Logging
 */
export const API_LOG_CONSTANTS = {
  // HTTP Methods
  METHODS: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
  } as const,

  // Service Names
  SERVICES: {
    TIMESHEET: "timesheet",
    USER: "user",
    AUTH: "auth",
    LOGGER: "logger",
    EXTERNAL: "external",
  } as const,

  // Status Codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  } as const,

  // Default Values
  DEFAULTS: {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
  } as const,
} as const;