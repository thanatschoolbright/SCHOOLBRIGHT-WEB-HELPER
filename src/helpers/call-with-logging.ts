import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {apiLog} from "@services/api-log";

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
        message: `[CALL] ${method} ${logMeta?.requestPath || url}`,
        url,
        ...(logMeta?.curl && {curl: logMeta.curl}),
    });

    try {
        const response = await axios(config);

        apiLog.info({
            emoji: "📦",
            message: `[RESPONSE] ${method} ${logMeta?.requestPath || url}`,
            status: response.status,
            data: response.data,
        });

        return response;
    } catch (error: any) {
        const statusCode = error.response?.status || 500;
        const raw = error.response?.data;

        apiLog.error({
            emoji: "🔥",
            message: `[ERROR] ${method} ${logMeta?.requestPath || url}`,
            status: statusCode,
            raw,
            curl: logMeta?.curl,
        });

        throw error;
    }
}