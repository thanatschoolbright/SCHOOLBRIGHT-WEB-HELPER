import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ลำดับ Gemini Models (fallback อัตโนมัติ)
const AVAILABLE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

const requestSchema = z.object({
  draft: z.string().min(1, "กรุณาระบุข้อความ draft"),
  project_name: z.string().optional(),
  feature_name: z.string().optional(),
});

// ✨ Prompt เฉพาะสำหรับช่วยขยาย/สรุปรายละเอียด Timesheet
const buildPrompt = (
  draft: string,
  projectName?: string,
  featureName?: string,
): string => `
คุณคือผู้ช่วย AI สำหรับระบบ Timesheet ของบริษัท SchoolBright
หน้าที่ของคุณคือช่วยพนักงาน **ขยายความ** และ **เติมเต็ม** รายละเอียดการทำงานให้ครบถ้วนและชัดเจนขึ้น
จากข้อความ draft สั้นๆ ที่พนักงานพิมพ์มา

## กฎสำคัญ
- ตอบเป็น **ภาษาไทย** เท่านั้น
- ห้ามแต่งเรื่องหรือใส่ข้อมูลเกินจริง — ขยายความจาก draft ที่มีให้เท่านั้น
- ผลลัพธ์ต้องเป็น **ข้อความเดียว** (ไม่ใช่ bullet, ไม่ใช่ markdown) สั้นกระชับ ความยาว 1-3 ประโยค
- เขียนในลักษณะรายงานการทำงานอาชีพ เช่น "พัฒนา...", "แก้ไข...", "ทดสอบ...", "ปรับปรุง..."
- ถ้า draft ระบุชื่อ ticket หรือ ID ให้คงไว้ในผลลัพธ์ด้วย

## บริบทงาน${projectName ? `\n- โครงการ: ${projectName}` : ""}${featureName ? `\n- ฟีเจอร์/งานย่อย: ${featureName}` : ""}

## Draft จากพนักงาน
"${draft}"

## ผลลัพธ์ (ข้อความ Timesheet ที่สมบูรณ์):
`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "Gemini API Key ไม่ถูกตั้งค่า" }),
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "ข้อมูลไม่ถูกต้อง" }),
      { status: 400 },
    );
  }

  const { draft, project_name, feature_name } = parsed.data;
  const prompt = buildPrompt(draft, project_name, feature_name);

  let lastError: unknown = null;

  for (const modelName of AVAILABLE_MODELS) {
    try {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

      const response = await axios.post(
        `${GEMINI_URL}?key=${apiKey}`,
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 256,
          },
        },
        { timeout: 15000 },
      );

      const text: string | undefined =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        return NextResponse.json(
          successResponse({
            data: { description: text.trim(), model_used: modelName },
            message_th: "AI ช่วยสรุปสำเร็จ",
          }),
        );
      }
    } catch (error: unknown) {
      lastError = error;
      const statusCode =
        (error as { response?: { status?: number } })?.response?.status;
      if (statusCode === 429 || statusCode === 500 || statusCode === 503) {
        continue;
      }
      break;
    }
  }

  const errStatus =
    (lastError as { response?: { status?: number } })?.response?.status ?? 500;

  return NextResponse.json(
    errorResponse({
      status: errStatus,
      message_th: "AI ไม่พร้อมใช้งานในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    }),
    { status: errStatus },
  );
}
