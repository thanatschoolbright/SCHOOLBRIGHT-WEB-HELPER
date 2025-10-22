import { NextRequest, NextResponse } from "next/server";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { API_URL } from "@/services/api-url";

export async function GET() {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const timestamp = Date.now();

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
        url: API_URL.PROD_SB_API_URL,
        endpoint: "/api/SeverStatus",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB APP ที่พี่โจ้เป็นคนทำ เช่นระบบแจ้งเตือน,เช็คชื่อหน้าเสาธง,รายงาน เป็นต้น",
        timestamp,
      },
      {
        server: "SERVER_DEV_SBAPI",
        url: API_URL.DEV_SB_API_URL,
        endpoint: "/api/SeverStatus",
        description:
          "เซิฟเวอร์ Dev ระบบหลังบ้าน SB APP ที่พี่โจ้เป็นคนทำ เช่นระบบแจ้งเตือน,เช็คชื่อหน้าเสาธง,รายงาน เป็นต้น",
        timestamp,
      },
      {
        server: "SERVER_PROD_PAYSB",
        url: API_URL.PROD_PAYMENT_API_URL,
        endpoint: "/api/device/status/registeronlinelogin",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB PAYMENT API ที่ Vimal เป็นคนทำ เช่น ระบบจ่ายเงินผ่านเครื่อง Canteen,ตัดยอดเงินออนไลน์,ตัดยอดเงินออฟไลน์ เป็นต้น",
        timestamp,
      },
      {
        server: "SERVER_DEV_HARDWARE",
        url: API_URL.DEV_HARDWARE_API_URL,
        endpoint: "/api/application",
        description:
          "เซิฟเวอร์ Dev ระบบหลังบ้าน SB HARDWARE API ที่พี่โจ้ เป็นคนทำ เช่น ระบบแสกนหน้าออนไลน์ , ออฟไลน์ เป็นต้น",
        timestamp,
      },
      {
        server: "SERVER_PROD_HARDWARE",
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
          StatusCode: httpCode,
          Status: httpCode === 200 ? "Online" : "Offline",
        };
      } else {
        // ในกรณี error
        const err = result.reason;
        return {
          ...cfg,
          Status: "Offline",
          StatusCode: err.response?.status || 500,
          Message: err.message || "",
        };
      }
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
