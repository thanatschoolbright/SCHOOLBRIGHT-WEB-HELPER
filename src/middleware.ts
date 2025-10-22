// middleware.ts
import {NextRequest, NextResponse} from "next/server";

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
   🧩 Helper: ดึงค่า User จาก Header
   ============================================================ */

/* ============================================================
   🧩 Helper: ดึงค่า User จาก Header
   ============================================================ */
function getCalledByFromHeader(req: NextRequest): string {
    const xRequestUser = req.headers.get('x-request-user');

    console.log(`🔍 [Middleware Debug] Raw x-request-user header: "${xRequestUser}" (type: ${typeof xRequestUser})`);

    // ตรวจสอบว่าไม่มี header หรือเป็น "null" string
    if (!xRequestUser || xRequestUser === 'null' || xRequestUser === 'undefined') {
        console.log(`⚠️ [Middleware Debug] Invalid header value, returning "middleware-unknown"`);
        return "middleware-unknown";
    }

    // ถ้าเป็น plain text (ตัวเลข, ตัวอักษร, underscore, dash) ให้ใช้เลย
    if (/^[\w-]+$/.test(xRequestUser)) {
        console.log(`✅ [Middleware Debug] Using plain text user: "${xRequestUser}"`);
        return xRequestUser;
    }

    // ถ้าไม่ใช่ plain text ให้ลอง decode
    try {
        // ตรวจสอบว่าเป็น Base64 หรือไม่
        if (/^[A-Za-z0-9+/]+={0,2}$/.test(xRequestUser)) {
            const decoded = decodeURIComponent(atob(xRequestUser));
            console.log(`✅ [Middleware Debug] Decoded Base64 user: "${decoded}"`);
            return decoded;
        }

        // ถ้าไม่ใช่ Base64 ลอง URI decode
        const decoded = decodeURIComponent(xRequestUser);
        console.log(`✅ [Middleware Debug] URI decoded user: "${decoded}"`);
        return decoded;
    } catch (e) {
        // ถ้า decode ไม่ได้ ใช้ค่าเดิม
        console.log(`⚠️ [Middleware Debug] Failed to decode, using raw: "${xRequestUser}"`);
        return xRequestUser;
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
    console.log(`${boldRed}Called By${reset}: ${getCalledByFromHeader(req)}`); // แสดง calledBy

    if (req.url.includes("adminsystem.schoolbright.co")) {
        console.log(`${boldRed}External API${reset}: Detected external API call`);
    }

    console.log("═".repeat(100));
}

/* ============================================================
   🚦 Main Middleware Function - DISABLED
   API Logging ถูกย้ายไปใช้ใน ApiLogUtils.logApiRequest() แทน
   ============================================================ */
export async function middleware(req: NextRequest) {
    // ✅ ปิดการใช้งาน middleware - ให้ request ผ่านไปตรงๆ
    // API Logging จะทำงานใน individual API routes แทน
    console.log("🔄 [Middleware] DISABLED - API Logging handled by ApiLogUtils");
    return NextResponse.next();
}


/* ============================================================
   📝 วิธีใช้งาน ApiLogUtils.logApiRequest() แทน middleware

   ตัวอย่างการใช้งานใน API route:

   import { ApiLogUtils } from "@/helpers/api-log.utils";

   export async function POST(request: NextRequest) {
       const startTime = new Date();

       try {
           // ... ประมวลผล API logic ...
           const result = await someApiLogic();

           // บันทึก API Log
           await ApiLogUtils.logApiRequest(
               request,
               {
                   status: 200,
                   body: result
               },
               startTime
           );

           return NextResponse.json(result);
       } catch (error) {
           // บันทึก Error Log
           await ApiLogUtils.logApiRequest(
               request,
               {
                   status: 500,
                   errorMessage: error.message
               },
               startTime
           );

           return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
       }
   }
   ============================================================ */

/* ============================================================
   ⚙️ Middleware Configuration - DISABLED
   ============================================================ */
export const config = {
    matcher: [], // ปิดการใช้งาน middleware ทั้งหมด
    runtime: 'nodejs',
}
