import {NextRequest, NextResponse} from "next/server";
import {ApiLogService} from "@/services/backend/api-log/api-log.service";
import {ApiLogUtils} from "@/helpers/api-log.utils";
import {ApiErrorResponse, ApiResponse} from "@/types/api-log.types";
import dayjs from "dayjs";

/**
 * API Route สำหรับดึงรายชื่อ Service ทั้งหมดที่มีใน API Logs
 * GET /api/v1/logger/find-service
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const startTime = new Date();
    let logData;

    try {
        //** การทำงาน: ดึงข้อมูลจาก request และสร้าง log data พื้นฐาน */
        logData = await ApiLogUtils.createLogData(request);

        //** การทำงาน: ดึงรายชื่อ service ทั้งหมดจาก database */
        const servicesFromDb = await ApiLogService.findAllServices();

        //** การทำงาน: แปลงข้อมูลให้เป็น format ที่ frontend ต้องการ */
        const services = servicesFromDb.map(service => ({
            service_name: service.service_name,
            name: service.service_name // เพิ่ม field name สำหรับ compatibility
        }));

        //** การทำงาน: สร้าง response data */
        const responseData: ApiResponse<any> = {
            data: services,
            message: "ดึงรายชื่อ service สำเร็จ",
            success: true,
            statusCode: 200,
            timestamp: dayjs().format('DD/MM/YYYY HH:mm:ss'),
        };

        //** การทำงาน: อัพเดท log data ด้วย response */
        const updatedLogData = ApiLogUtils.updateLogDataWithResponse(
            logData,
            200,
            startTime
        );

        //** การทำงาน: บันทึก log */
        await ApiLogService.createApiLog(updatedLogData);

        //** การทำงาน: ส่ง response กลับ */
        return NextResponse.json(responseData, {status: 200});

    } catch (error: any) {
        console.error("Find Services Error:", error);

        //** การทำงาน: สร้าง error response */
        const errorResponse: ApiErrorResponse = {
            message: error?.message || "เกิดข้อผิดพลาดในการดึงรายชื่อ service",
            error: "Internal Server Error",
            statusCode: 500,
            timestamp: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            success: false,
        };

        //** การทำงาน: อัพเดท log data ด้วย error response */
        if (logData) {
            const errorLogData = ApiLogUtils.updateLogDataWithResponse(
                logData,
                500,
                startTime
            );

            //** การทำงาน: บันทึก error log */
            try {
                await ApiLogService.createApiLog(errorLogData);
            } catch (logError) {
                console.error("Failed to log error:", logError);
            }
        }

        //** การทำงาน: ส่ง error response กลับ */
        return NextResponse.json(errorResponse, {status: 500});
    }
}
