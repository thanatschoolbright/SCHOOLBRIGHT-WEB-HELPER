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

    const start = Date.now();
    const requestBody = await parseRequestBody(req);

    // ⚙️ รัน request ปกติ
    const res = NextResponse.next();
    const duration = Date.now() - start;

    // ✅ Log ข้อมูลแบบอ่านง่าย
    logRequest({
        req,
        requestBody,
        responseBody: "Response logging skipped (NextResponse.next placeholder)",
        duration,
        status: res.status,
    });

    return res;
}
