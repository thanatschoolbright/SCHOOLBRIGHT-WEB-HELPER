import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { API_URL } from "@/services/api-url";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";



export async function GET() {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const timestamp = convertToThaiDateDDMMYYY(new Date().toISOString());

    const SERVER_PROD_SBAPI = `${API_URL.PROD_SB_API_URL}/api/SeverStatus`;
    const SERVER_DEV_SBAPI = `${API_URL.DEV_SB_API_URL}/api/SeverStatus`;
    const SERVER_PROD_PAYSB = `${API_URL.PROD_PAYMENT_API_URL}/api/device/status/registeronlinelogin`;
    const SERVER_DEV_HARDWARE = `${API_URL.DEV_HARDWARE_API_URL}/api/application`;
    const SERVER_PROD_HARDWARE = `${API_URL.PROD_HARDWARE_API_URL}/api/application`;

    // perform both requests and handle failures individually
    const results = await Promise.allSettled([
      axios.get(SERVER_PROD_SBAPI, { headers }),
      axios.get(SERVER_DEV_SBAPI, { headers }),
      axios.post(SERVER_PROD_PAYSB, { headers }),
      axios.get(SERVER_DEV_HARDWARE, { headers }),
      axios.get(SERVER_PROD_HARDWARE, { headers }),
    ]);

    const servers = [
      {
        server: "SERVER_PROD_SBAPI",
        server_name: "SCHOOL BRIGHT MOBILE APPLICATION API",
        server_name_th: "ระบบบริการหลังบ้านสำหรับแอป School Bright",
        server_name_en: "Backend Service for School Bright App",
        environment: "Production",
        url: API_URL.PROD_SB_API_URL,
        endpoint: "/api/SeverStatus",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB APP ที่พี่โจ้เป็นคนทำ เช่นระบบแจ้งเตือน,เช็คชื่อหน้าเสาธง,รายงาน เป็นต้น",
        timestamp,
      },
     
      {
        server: "SERVER_PROD_PAYSB",
        server_name: "SCHOOL BRIGHT PAYMENT API",
        server_name_th: "ระบบบริการหลังบ้านสำหรับระบบจ่ายเงินโรงอาหาร",
        server_name_en: "Backend Service for Canteen Payment System",
        environment: "Production",
        url: API_URL.PROD_PAYMENT_API_URL,
        endpoint: "/api/device/status/registeronlinelogin",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB PAYMENT API ที่ Vimal เป็นคนทำ เช่น ระบบจ่ายเงินผ่านเครื่อง Canteen,ตัดยอดเงินออนไลน์,ตัดยอดเงินออฟไลน์ เป็นต้น",
        timestamp,
      },
      
      {
        server: "SERVER_PROD_HARDWARE",
        server_name: "SCHOOL BRIGHT HARDWARE API",
        server_name_th: "ระบบบริการหลังบ้านสำหรับระบบแสกนหน้าออนไลน์",
        server_name_en: "Backend Service for Online Scan System",
        environment: "Production",
        url: API_URL.PROD_HARDWARE_API_URL,
        endpoint: "/api/application",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB HARDWARE API ที่พี่โจ้ เป็นคนทำ เช่น ระบบแสกนหน้าออนไลน์ , ออฟไลน์ เป็นต้น",
        timestamp,
      },
    ];

    const data = servers.map((cfg, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        // result.value.status คือ HTTP status code ของการตอบกลับ
        const httpCode = result.value.status; // เช่น 200
        return {
          ...cfg,
          ...result.value.data,
          status_code: httpCode,
          status: httpCode === 200 ? "Online" : "Offline",
        };
      } else {
        // ในกรณี error
        const err = result.reason;
        return {
          ...cfg,
          status: "Offline",
          status_code: err.response?.status || 500,
          message: err.message || "",
        };
      }
    });

    return new NextResponse(JSON.stringify({ data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({
        message: err.message || "Internal Server Error",
        status: err.response?.status || 500,
      }),
      {
        status: err.response?.status || 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}
