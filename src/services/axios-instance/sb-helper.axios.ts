import axios from 'axios';
import {getUserByLocalStorage} from "@helpers/local_storage/user.storage";
import { logger } from '@/helpers/logger';

/* ============================================================
   🎨 Color Setup สำหรับ Console
   ============================================================ */
const COLORS = {
    red: "\x1b[31m",
    boldRed: "\x1b[1m\x1b[31m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    reset: "\x1b[0m",
};

/* ============================================================
   🧩 Helper Functions
   ============================================================ */
const truncate = (text: string, max = 500) =>
    text.length > max ? text.slice(0, max) + "...see more" : text;

function pretty(value: any): string {
    try {
        return truncate(JSON.stringify(value, null, 2));
    } catch {
        return String(value);
    }
}

function getColorByStatus(status: number): string {
    if (status >= 500) return COLORS.boldRed;
    if (status >= 400) return COLORS.yellow;
    if (status >= 200) return COLORS.green;
    return COLORS.reset;
}

function getCalledByFromHeader(): string {
    try {
        // ตรวจสอบว่าเป็น client side หรือไม่
        if (typeof window === 'undefined') {
            logger.info(`⚠️ [Axios] Server side - returning "axios-server"`);
            return "axios-server";
        }

        const userId = localStorage.getItem("AUTH_USER");
        const extractedUser = userId ? JSON.parse(userId) : null;
        const id = extractedUser?.user_data?.admin_id;

        if (id) {
            logger.info(`✅ [Axios] Using user ID: "${id}"`);
            return String(id);
        } else {
            logger.warn(`⚠️ [Axios] No user ID found, returning "axios-unknown"`);
            return "axios-unknown";
        }
    } catch (error) {
        logger.error(`❌ [Axios] Error getting user ID: ${error}, returning "axios-error"`);
        return "axios-error";
    }
}

function extractServiceName(url: string): string {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 3 && parts[0] === 'api') {
            return parts[2] || 'unknown';
        }
        if (parts.length >= 2 && parts[0] === 'api') {
            return parts[1] || 'unknown';
        }
        return 'external';
    } catch {
        return 'unknown';
    }
}

function logRequest({
                        config,
                        responseData,
                        duration,
                        status,
                        calledBy,
                        error
                    }: {
    config: any;
    responseData?: any;
    duration: number;
    status: number;
    calledBy: string;
    error?: any;
}) {
    const statusColor = getColorByStatus(status);
    const {boldRed, reset} = COLORS;

    logger.info("\n" + "═".repeat(100));
    logger.info(`${boldRed}📡  API Request Log (Axios)${reset}`);
    logger.info(`${boldRed}URL${reset}: ${config.url}`);
    logger.info(`${boldRed}Method${reset}: ${config.method?.toUpperCase()}`);
    logger.info(`${boldRed}Status${reset}: ${statusColor}${status}${reset}`);
    logger.info(`${boldRed}Response Time${reset}: ${duration}ms`);
    logger.info(`${boldRed}Headers${reset}: ${pretty(config.headers)}`);
    logger.info(`${boldRed}Body${reset}: ${pretty(config.data)}`);
    logger.info(`${boldRed}Response${reset}: ${pretty(responseData)}`);
    logger.info(`${boldRed}Called By${reset}: ${calledBy}`);

    if (error) {
        logger.error(`${boldRed}Error${reset}: ${pretty(error.message)}`);
    }

    logger.info("═".repeat(100));
}

async function saveApiLog(config: any, response: any, duration: number, calledBy: string, error?: any) {
    try {
        // สร้าง URL object อย่างปลอดภัย
        let url: URL;
        let pathname: string;

        try {
            // ลองสร้าง URL ตรงๆ ก่อน (กรณี absolute URL)
            url = new URL(config.url);
            pathname = url.pathname;
        } catch {
            // ถ้าไม่ได้ แสดงว่าเป็น relative URL
            const baseURL = config.baseURL || 'http://localhost:3000';
            url = new URL(config.url, baseURL);
            pathname = url.pathname;
        }

    logger.info(`🔍 [Axios] Processing URL: ${url.href}, pathname: ${pathname}`);

        // Skip เฉพาะ logger API เพื่อป้องกัน infinite loop
        if (pathname.startsWith('/api/v1/logger/')) {
            logger.info(`🔍 [Axios] Logger API detected, calledBy: "${calledBy}" - Skip database logging`);
            return;
        }

        logger.info(`🚀 [Axios] Starting saveApiLog for: ${url.href}, calledBy: ${calledBy}`);

        // Dynamic import เพื่อหลีกเลี่ยง circular dependency
        const {ApiLogUtils} = await import("@/helpers/api-log.utils");
        const {ApiLogService} = await import("@/services/backend/api-log/api-log.service");

    logger.info(`✅ [Axios] Dynamic imports successful`);

        // สร้าง mock NextRequest object ที่สมบูรณ์
        const headers = new Headers();
        Object.entries(config.headers || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                headers.set(key, String(value));
            }
        });

        const mockRequest = {
            url: url.href,
            method: config.method?.toUpperCase() || 'GET',
            headers: headers,
            nextUrl: {
                pathname: pathname,
                search: url.search,
                searchParams: url.searchParams
            },
            clone: () => ({
                json: async () => config.data || null,
                formData: async () => new FormData(),
                text: async () => JSON.stringify(config.data || {})
            })
        } as any;

    logger.info(`✅ [Axios] Mock request created for: ${mockRequest.method} ${pathname}`);

        const logData = await ApiLogUtils.createLogData(mockRequest, {
            serviceName: extractServiceName(url.href),
            calledBy: calledBy,
        });

        logger.info(`✅ [Axios] Log data created: ${JSON.stringify({ endpoint: logData.endpoint, serviceName: logData.serviceName, calledBy: logData.calledBy })}`);

        const finalLogData = ApiLogUtils.updateLogDataWithResponse(
            logData,
            response?.status || (error ? 500 : 200),
            response?.data || (error ? {error: error.message} : undefined),
            error?.message
        );

        logger.info(`✅ [Axios] Final log data prepared: ${JSON.stringify({ statusCode: finalLogData.statusCode, isSuccess: finalLogData.isSuccess, durationMs: finalLogData.durationMs })}`);

        // บันทึกลงฐานข้อมูลผ่าน API endpoint (เพื่อหลีกเลี่ยง Prisma browser issue)
    logger.info(`🔄 [Axios] Saving to database via API...`);

        // ใช้ fetch แทน axios เพื่อหลีกเลี่ยง circular call
        fetch('/api/v1/logger/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalLogData)
        })
            .then(async (response) => {
                if (response.ok) {
                    logger.info(`✅ [Axios] API Log saved successfully for: ${config.url}`);
                } else {
                    const errorData = await response.text();
                    logger.error("❌ API Log creation failed - HTTP error:", response.status, errorData);
                }
            })
            .catch((logError) => {
                logger.error("❌ API Log creation failed in axios:", logError);
            });

    } catch (logError) {
        logger.error("❌ Error in saveApiLog:", logError);
        logger.error("❌ Stack trace:", logError instanceof Error ? logError.stack : 'No stack trace');
    }
}

export const callApiService = axios.create({
    // baseURL: API_URL.SB_HELPER_URL,
    timeout: 60000,
    // headers: {
    //     'Content-Type': 'application/json',
    // },
});

// Request Interceptor
callApiService.interceptors.request.use(
    async (config) => {
        try {
            const userId = await getUserByLocalStorage();
            const calledBy = getCalledByFromHeader();

            // เพิ่ม metadata สำหรับ logging
            (config as any).metadata = {
                startTime: Date.now(),
                calledBy: calledBy
            };

            // ตรวจสอบว่า userId มีค่าและไม่ใช่ null/undefined
            if (userId && userId !== null && userId !== undefined) {
                config.headers["x-request-user"] = String(userId);
                    logger.info("🔍 [Axios Interceptor] Adding header x-request-user:", config.headers["x-request-user"]);
            } else {
                // ไม่เพิ่ม header ถ้าไม่มี userId
                    logger.warn("⚠️ [Axios Interceptor] No valid userId found, skipping x-request-user header");
                delete config.headers["x-request-user"];
            }
        } catch (error) {
                logger.error("❌ [Axios Interceptor] Error getting user from localStorage:", error);
            delete config.headers["x-request-user"];

            (config as any).metadata = {
                startTime: Date.now(),
                calledBy: "axios-error"
            };
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
callApiService.interceptors.response.use(
    async (response) => {
        const config = response.config;
        const duration = Date.now() - ((config as any).metadata?.startTime || Date.now());
        const calledBy = (config as any).metadata?.calledBy || "axios-unknown";

        // Log สำเร็จ
        logRequest({
            config,
            responseData: response.data,
            duration,
            status: response.status,
            calledBy
        });

        // บันทึกลงฐานข้อมูล
        await saveApiLog(config, response, duration, calledBy);

        return response;
    },
    async (error) => {
        const config = error.config || {};
        const duration = Date.now() - ((config as any).metadata?.startTime || Date.now());
        const calledBy = (config as any).metadata?.calledBy || "axios-unknown";
        const status = error.response?.status || 500;

        // Log ผิดพลาด
        logRequest({
            config,
            responseData: error.response?.data,
            duration,
            status,
            calledBy,
            error
        });

        // บันทึกลงฐานข้อมูล
        await saveApiLog(config, error.response, duration, calledBy, error);

        return Promise.reject(error);
    }
)


