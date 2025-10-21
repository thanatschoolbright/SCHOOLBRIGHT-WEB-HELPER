// middleware.ts
import {NextRequest, NextResponse} from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiLogUtils } from "@/helpers/api-log.utils";

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
   🧩 Helper: จำกัดความยาวข้อความ (เช่น Body ยาว)
   ============================================================ */
const truncate = (text: string, max = 500) =>
    text.length > max ? text.slice(0, max) + "...see more" : text;

/* ============================================================
   🧩 Helper: แปลงข้อมูลให้แสดงสวยใน Log
   ============================================================ */
function pretty(value: any): string {
    try {
        return truncate(JSON.stringify(value, null, 2));
    } catch {
        return String(value);
    }
}

/* ============================================================
   🧩 Helper: คืนสีตาม Status Code
   ============================================================ */
function getColorByStatus(status: number): string {
    if (status >= 500) return COLORS.boldRed;
    if (status >= 400) return COLORS.yellow;
    if (status >= 200) return COLORS.green;
    return COLORS.reset;
}

/* ============================================================
   🧩 Helper: อ่านข้อมูล Body ของ Request
   ============================================================ */
async function parseRequestBody(req: NextRequest) {
    if (req.method === "GET") return null;
    try {
        return await req.clone().json();
    } catch {
        try {
            const formData = await req.clone().formData();
            return Object.fromEntries(formData.entries());
        } catch {
            return null;
        }
    }
}

/* ============================================================
   🧩 Helper: สร้าง Log ที่อ่านง่าย
   ============================================================ */
function logRequest({
                        req,
                        requestBody,
                        responseBody,
                        duration,
                        status,
                    }: {
    req: NextRequest;
    requestBody: any;
    responseBody: any;
    duration: number;
    status: number;
}) {
    const statusColor = getColorByStatus(status);
    const {boldRed, reset} = COLORS;

    console.log("\n" + "═".repeat(100));
    console.log(`${boldRed}📡  API Request Log${reset}`);
    console.log(`${boldRed}URL${reset}: ${req.url}`);
    console.log(`${boldRed}Method${reset}: ${req.method}`);
    console.log(`${boldRed}Status${reset}: ${statusColor}${status}${reset}`);
    console.log(`${boldRed}Response Time${reset}: ${duration}ms`);
    console.log(`${boldRed}Headers${reset}: ${pretty(Object.fromEntries(req.headers.entries()))}`);
    console.log(`${boldRed}Body${reset}: ${pretty(requestBody)}`);
    console.log(`${boldRed}Response${reset}: ${pretty(responseBody)}`);

    if (req.url.includes("adminsystem.schoolbright.co")) {
        console.log(`${boldRed}External API${reset}: Detected external API call`);
    }

    console.log("═".repeat(100));
}

/* ============================================================
   🚦 Main Middleware Function
   ============================================================ */
export async function middleware(req: NextRequest) {
    const url = new URL(req.url);

    // ✅ เฉพาะ API route เท่านั้น
    if (!url.pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    const startTime = new Date();
    const start = Date.now();
    const requestBody = await parseRequestBody(req);
    let logData;

    try {
        // 🔄 สร้าง API Log Data (skip เฉพาะ logger API เองเพื่อไม่ให้เกิด infinite loop)
        if (!url.pathname.startsWith('/api/v1/logger/')) {
            logData = await ApiLogUtils.createLogData(req, {
                serviceName: extractServiceName(url.pathname),
                calledBy: "middleware",
            });
        }

        // ⚙️ รัน request ปกติ
        const res = NextResponse.next();
        const duration = Date.now() - start;

        // ✅ Log ข้อมูลแบบอ่านง่าย (Console)
        logRequest({
            req,
            requestBody,
            responseBody: "Response will be logged by API Logger",
            duration,
            status: res.status,
        });

        // 📊 บันทึก API Log ลงฐานข้อมูล (Async - ไม่บล็อค response)
        if (logData) {
            const finalLogData = ApiLogUtils.updateLogDataWithResponse(
                logData,
                res.status,
                undefined, // ไม่บันทึก response body ใน middleware เพื่อความเร็ว
                undefined  // ไม่มี error message
            );

            // บันทึก log โดยไม่รอ (ไม่บล็อค API response)
            ApiLogService.createApiLog(finalLogData).catch((error) => {
                console.error("❌ API Log creation failed in middleware:", error);
            });
        }

        return res;

    } catch (error) {
        const duration = Date.now() - start;
        
        // ✅ Log error ใน console
        console.error("❌ Middleware error:", error);

        // 📊 บันทึก error log ถ้าสร้าง logData ได้
        if (logData) {
            const errorLogData = ApiLogUtils.updateLogDataWithResponse(
                logData,
                500,
                undefined,
                error instanceof Error ? error.message : "Unknown middleware error"
            );

            ApiLogService.createApiLog(errorLogData).catch((logError) => {
                console.error("❌ Error API Log creation failed:", logError);
            });
        }

        // ส่งต่อ request ปกติแม้จะเกิด error ใน logging
        return NextResponse.next();
    }
}

/* ============================================================
   🧩 Helper: Extract Service Name จาก pathname
   ============================================================ */
function extractServiceName(pathname: string): string {
    // /api/v1/logger/search -> logger
    // /api/v1/timesheet/entry -> timesheet
    // /api/v1/admin/user -> admin
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 'api') {
        return parts[2] || 'unknown';
    }
    return 'middleware';
}

/* ============================================================
   ⚙️ Middleware Configuration
   ============================================================ */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
    runtime: 'nodejs', // ใช้ Node.js runtime แทน Edge เพื่อให้ Prisma ทำงาน
}
