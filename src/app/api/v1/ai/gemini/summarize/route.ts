import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";

//** สร้าง URL เรียกใช้งาน Gemini รุ่น REST API v1
const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

const PROMPT_HEADER = `ภาษา : เขียนในรูปแบบ .MD\nฉันคือ Quality Assurance ที่ต้องการลง Task ให้กับ Developer เข้าใจ\n- เน้นอธิบายในรูปแบบตาราง\n- อย่าอธิบาย ยาวเยอะจนเกินไป\n- มีการจัดวางแต่ละหัวข้ออย่างเป็นระเบียบ\n\nตัวอย่าง .MD\nรหัสโรงเรียน : 849\nยูเซอร์ที่พบปัญหา : ….\nตำแหน่ง : คุณครู / นักเรียน\n\n⸻\n\nเนื้อหา และ รูปภาพประกอบ\n\n…\n(ตัวอย่างการแนบรูปภาพ ![image][7413.jpg])\n\nความต้องการให้แก้ไข\n\n…\n\nข้อแนะนำอื่น ๆ\n\n…\n\n⸻ ช่วยตัดข้อความ "นี่คือตัวอย่างการเขียน Task ให้ Developer ในรูปแบบ Markdown (.MD) ตามที่คุณต้องการครับ

" ออกไปด้วย แล้วเขียนว่า "สรุป Task อัจฉริยะด้วย Gemini AI พัฒนาโดย Tech Lead ไลท์"`;

//** เรียก Gemini สร้าง Markdown สรุป Task (เรียบง่าย ใช้ axios และลองหลายรุ่นเผื่อรุ่นแรกไม่รองรับ)
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "GOOGLE_GEMINI_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า GOOGLE_GEMINI_API_KEY",
        }),
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { summary, description } = body as {
      summary?: string;
      description?: string;
    };
    // รุ่นที่ใช้กับ REST API v1 (เรียงจากเร็ว → ละเอียด)
    const modelCandidates: string[] = [
      process.env.GOOGLE_GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ].filter(Boolean) as string[];

    const contents = [
      {
        role: "user",
        parts: [
          { text: PROMPT_HEADER },
          {
            text: `\n\nข้อมูลปัจจุบันของงาน (สำหรับสรุป):\n- Summary: ${
              summary || "-"
            }\n- Description (raw):\n${description || "-"}`,
          },
        ],
      },
    ];
    let markdown = "";
    let lastErrorMessage = "";
    for (const modelName of modelCandidates) {
      try {
        const url = `${buildGeminiUrl(modelName)}?key=${apiKey}`;
        const response = await axios.post(
          url,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            validateStatus: () => true,
          }
        );
        if (response.status >= 200 && response.status < 300) {
          markdown =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (markdown) break;
        } else {
          lastErrorMessage =
            typeof response.data === "string"
              ? response.data
              : JSON.stringify(response.data);
        }
      } catch (modelError: any) {
        lastErrorMessage = modelError?.message || String(modelError);
      }
    }

    if (!markdown) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_en: lastErrorMessage || "All Gemini model candidates failed",
          message_th: "เรียก Gemini ไม่สำเร็จ",
        }),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        data: { markdown },
        message_en: "Gemini summarized",
        message_th: "สรุปด้วย AI สำเร็จ",
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_en: error?.message || "AI failed",
        message_th: "สรุปด้วย AI ไม่สำเร็จ",
        error,
      }),
      { status: 500 }
    );
  }
}
