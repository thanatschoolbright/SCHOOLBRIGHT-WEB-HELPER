import { NextResponse } from "next/server";

/**
 * ✨ API สำหรับดึงรายละเอียดงานที่ต้องเสร็จในเดือนที่เลือก (Mock-up)
 * {feature}/read/route.ts -> GET Request
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // ชื่อเดือนภาษาไทย เช่น "มกราคม"
  const year = searchParams.get("year");

  // Mock Data: ในสถานการณ์จริงจะมีการ Query จาก Database ตามกำหนดวันเสร็จ (end_date)
  const mockDataMap: Record<string, any[]> = {
    มกราคม: [
      {
        id: 101,
        name: "พัฒนาระบบ Login",
        project_name: "School Portal",
        end_date: `${year}-01-15`,
        status: "completed",
      },
    ],
    กุมภาพันธ์: [
      {
        id: 102,
        name: "ออกแบบ UI ใหม่",
        project_name: "Mobile App",
        end_date: `${year}-02-10`,
        status: "in-progress",
      },
      {
        id: 103,
        name: "ปรับปรุงฐานข้อมูล",
        project_name: "School Portal",
        end_date: `${year}-02-28`,
        status: "pending",
      },
    ],
    มีนาคม: [
      {
        id: 104,
        name: "เพิ่มระบบแจ้งเตือน",
        project_name: "Mobile App",
        end_date: `${year}-03-20`,
        status: "pending",
      },
    ],
    // ... สามารถเพิ่มเดือนอื่นๆ ได้
  };

  const data = mockDataMap[month as string] || [];

  return NextResponse.json({
    status_code: 200,
    message_th: "ดึงข้อมูลสำเร็จ",
    message_en: "Success",
    data: data,
  });
}
