import {NextRequest, NextResponse} from "next/server";
import {API_URL} from "@/services/api-url";
import axios from "axios"
import FormData from "form-data";

/**
 * ฟังก์ชัน POST สำหรับจัดการการเข้าสู่ระบบ
 * อ่าน username และ password จาก form data
 * ส่งคำขอไปยัง API ภายนอก และตอบกลับผลลัพธ์พร้อมเวลาการตอบสนอง
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const startTime = performance.now();

    try {
        // อ่านข้อมูลจาก form data
        const formData = await request.formData();
        const username = formData.get("username") as string | null;
        const password = formData.get("password") as string | null;

        // ตรวจสอบข้อมูลเบื้องต้น
        if (!username || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Username และ Password ต้องไม่เป็นค่าว่าง",
                },
                {status: 400}
            );
        }

        // เตรียมข้อมูลสำหรับส่งไปยัง API ภายนอก
        const apiUrl = `${API_URL.PROD_ADMIN_JABJAI_API_URL}/api/v2/auth/login`;
        const externalFormData = new FormData();
        externalFormData.append("username", username);
        externalFormData.append("password", password);

        console.info("Sending login request to external API:", apiUrl);

        // เรียก API ภายนอกด้วย axios พร้อมตั้งค่า timeout และ headers
        const response = await axios.post(apiUrl, externalFormData, {
            headers: externalFormData.getHeaders(),
            timeout: 5000, // กำหนด timeout 5 วินาที
        });

        console.info("Received response from external API:", response.data);

        const endTime = performance.now();
        const responseTime = Number((endTime - startTime).toFixed(2)); // เวลาในการตอบสนอง (ms)

        // ส่งผลลัพธ์กลับ client พร้อมข้อมูล token และ user_data
        return NextResponse.json({
            success: response.data.success,
            token: response.data.token,
            user_data: response.data.user_data,
            response_time: responseTime,
        });
    } catch (error: any) {
        const endTime = performance.now();
        const responseTime = Number((endTime - startTime).toFixed(2));

        // กรณีเกิดข้อผิดพลาดจาก API ภายนอก
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.response?.data?.message || "เกิดข้อผิดพลาดจาก API ภายนอก",
                    status: error.response?.status || 502,
                    response_time: responseTime,
                },
                {status: error.response?.status || 502}
            );
        }

        // กรณีข้อผิดพลาดภายใน server
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Internal Server Error",
                status: 500,
                response_time: responseTime,
            },
            {status: 500}
        );
    }
}
