import axios from 'axios';
import {getUserByLocalStorage} from "@helpers/local_storage/user.storage";

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
        const userId = localStorage.getItem("AUTH_USER");
        const extractedUser = userId ? JSON.parse(userId) : null;
        const id = extractedUser?.user_data?.admin_id;

        if (id) {
            console.log(`✅ [Axios] Using user ID: "${id}"`);
            return String(id);
        } else {
            console.log(`⚠️ [Axios] No user ID found, returning "axios-unknown"`);
            return "axios-unknown";
        }
    } catch (error) {
        console.log(`❌ [Axios] Error getting user ID: ${error}, returning "axios-error"`);
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

    console.log("\n" + "═".repeat(100));
    console.log(`${boldRed}📡  API Request Log (Axios)${reset}`);
    console.log(`${boldRed}URL${reset}: ${config.url}`);
    console.log(`${boldRed}Method${reset}: ${config.method?.toUpperCase()}`);
    console.log(`${boldRed}Status${reset}: ${statusColor}${status}${reset}`);
    console.log(`${boldRed}Response Time${reset}: ${duration}ms`);
    console.log(`${boldRed}Headers${reset}: ${pretty(config.headers)}`);
    console.log(`${boldRed}Body${reset}: ${pretty(config.data)}`);
    console.log(`${boldRed}Response${reset}: ${pretty(responseData)}`);
    console.log(`${boldRed}Called By${reset}: ${calledBy}`);

    if (error) {
        console.log(`${boldRed}Error${reset}: ${pretty(error.message)}`);
    }

    console.log("═".repeat(100));
}

async function saveApiLog(config: any, response: any, duration: number, calledBy: string, error?: any) {
    try {
        const url = new URL(config.url);

        // Skip เฉพาะ logger API เพื่อป้องกัน infinite loop
        if (url.pathname.startsWith('/api/v1/logger/')) {
            console.log(`🔍 [Axios] Logger API detected, calledBy: "${calledBy}" - Skip database logging`);
            return;
        }

        // Dynamic import เพื่อหลีกเลี่ยง circular dependency
        const {ApiLogUtils} = await import("@/helpers/api-log.utils");
        const {ApiLogService} = await import("@/services/backend/api-log/api-log.service");

        // สร้าง mock NextRequest object
        const mockRequest = {
            url: config.url,
            method: config.method?.toUpperCase() || 'GET',
            headers: new Map(Object.entries(config.headers || {})),
            clone: () => ({
                json: async () => config.data || null,
                formData: async () => new FormData()
            })
        } as any;

        const logData = await ApiLogUtils.createLogData(mockRequest, {
            serviceName: extractServiceName(config.url),
            calledBy: calledBy,
        });

        const finalLogData = ApiLogUtils.updateLogDataWithResponse(
            logData,
            response?.status || (error ? 500 : 200),
            response?.data || (error ? {error: error.message} : undefined),
            error?.message
        );

        // บันทึกลงฐานข้อมูลแบบ async
        ApiLogService.createApiLog(finalLogData).catch((logError) => {
            console.error("❌ API Log creation failed in axios:", logError);
        });

    } catch (logError) {
        console.error("❌ Error in saveApiLog:", logError);
    }
}

export const callApiService = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SB_HELPER_URL || 'http://localhost:3000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
callApiService.interceptors.request.use(
    async (config) => {
        try {
            const userId = await getUserByLocalStorage();
            const calledBy = getCalledByFromHeader();

            // เพิ่ม metadata สำหรับ logging
            config.metadata = {
                startTime: Date.now(),
                calledBy: calledBy
            };

            // ตรวจสอบว่า userId มีค่าและไม่ใช่ null/undefined
            if (userId && userId !== null && userId !== undefined) {
                config.headers["x-request-user"] = String(userId);
                console.log("🔍 [Axios Interceptor] Adding header x-request-user:", config.headers["x-request-user"]);
            } else {
                // ไม่เพิ่ม header ถ้าไม่มี userId
                console.log("⚠️ [Axios Interceptor] No valid userId found, skipping x-request-user header");
                delete config.headers["x-request-user"];
            }
        } catch (error) {
            console.error("❌ [Axios Interceptor] Error getting user from localStorage:", error);
            delete config.headers["x-request-user"];

            config.metadata = {
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
        const duration = Date.now() - (config.metadata?.startTime || Date.now());
        const calledBy = config.metadata?.calledBy || "axios-unknown";

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
        const duration = Date.now() - (config.metadata?.startTime || Date.now());
        const calledBy = config.metadata?.calledBy || "axios-unknown";
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


