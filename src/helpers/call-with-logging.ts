import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiLog } from "@services/api-log";

// ANSI color codes for enhanced log readability
const colors = {
  info: "\x1b[36m", // cyan
  success: "\x1b[32m", // green
  error: "\x1b[31m", // red
};
const resetColor = "\x1b[0m";

export async function callWithLogging<T = any>(
  config: AxiosRequestConfig,
  logMeta?: {
    requestPath?: string;
    method?: string;
    curl?: string;
  }
): Promise<AxiosResponse<T>> {
  const method = config.method?.toUpperCase() || "GET";
  const url = config.url || "Unknown URL";

  apiLog.info({
    emoji: "📡",
    message: `${colors.info}[CALL] ${method} ${
      logMeta?.requestPath || url
    }${resetColor}`,
    url,
    ...(logMeta?.curl && { curl: logMeta.curl }),
  });

  try {
    const response = await axios(config);

    return response;
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const raw = error.response?.data;

    throw error;
  }
}
