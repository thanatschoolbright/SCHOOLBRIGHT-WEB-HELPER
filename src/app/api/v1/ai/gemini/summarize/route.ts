import { QA_TASK_SUMMARY_TASK_PROMPT } from "@/constants/prompts";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ** 1. ลำดับ Model ที่ต้องการให้ระบบลองเรียก (จากรุ่นใหม่/แรง ไปรุ่นสำรอง)
const AVAILABLE_MODELS = [
  "gemini-3-flash", // รุ่นใหม่ล่าสุดในลิสต์ของคุณ
  "gemini-2.5-flash-lite", // รุ่นประหยัด
  "gemini-2.5-flash", // รุ่นมาตรฐาน
  "gemini-2.5-flash-tts", // รุ่นรองรับ Multi-modal (ใช้ text-out ได้เหมือนกัน)
  "gemini-1.5-flash", // สำรองสุดท้าย
];

const requestSchema = z.object({
  summary: z.string().min(1, "Summary is required").optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const requestId = Math.random().toString(36).substring(7);

  if (!apiKey) {
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "API Key missing" }),
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const result = requestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "ข้อมูลไม่ถูกต้อง" }),
      { status: 400 },
    );
  }

  const { summary, description } = result.data;
  const contents = [
    {
      role: "user",
      parts: [
        { text: QA_TASK_SUMMARY_TASK_PROMPT },
        {
          text: `\n\n--- INPUT ---\nSummary: ${summary || "-"}\nDescription: ${
            description || "-"
          }`,
        },
      ],
    },
  ];

  let lastError: any = null;

  // ** 2. Loop สลับ Model อัตโนมัติ
  for (const modelName of AVAILABLE_MODELS) {
    try {
      logger.info(`[${requestId}] Attempting AI Model: ${modelName}`);

      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

      const response = await axios.post(
        `${GEMINI_URL}?key=${apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        },
        {
          timeout: 20000,
          // ให้ axios ไม่โยน Error ถ้าเจอ 429 เพื่อให้เราเช็ค status เองได้นิ่งขึ้น
          // หรือจะใช้ catch แบบเดิมก็ได้ครับ
        },
      );

      if (response.status === 200) {
        const aiMarkdown =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiMarkdown) {
          // ** Post-process to fix incorrect image syntax ![text](url) -> ![text][url] for Backlog **
          const fixedMarkdown = aiMarkdown.replace(
            /!\[(.*?)\]\((.*?)\)/g,
            "![$1][$2]",
          );

          // ** Append original description to protect data as requested by user **
          const markdown = `${fixedMarkdown}\n\n---\n### ข้อความต้นฉบับ (Original Description)\n\`\`\`\n${
            description || "_No original description provided_"
          }\n\`\`\``;

          logger.info(`[${requestId}] Success with ${modelName}`);
          return NextResponse.json(
            successResponse({
              data: { markdown, model_used: modelName },
              message_th: "สรุปสำเร็จ",
            }),
          );
        }
      }
    } catch (error: any) {
      lastError = error;
      const statusCode = error.response?.status;

      // ** 3. เงื่อนไขการสลับ Model:
      // 429 = Quota หมด / 500, 503 = Server มีปัญหาหรือคิวแน่น
      if (statusCode === 429 || statusCode === 500 || statusCode === 503) {
        logger.warn(
          `[${requestId}] Model ${modelName} failed (${statusCode}). Trying next model...`,
        );
        continue;
      }

      // ถ้าเป็น Error อื่นๆ เช่น 400 (Bad Request) แสดงว่า Prompt มีปัญหา
      // สลับไปตัวอื่นก็อาจจะพังเหมือนเดิม ให้หยุด Loop แล้วแจ้ง Error เลย
      break;
    }
  }

  // ** 4. ถ้าหลุดออกมาจาก Loop แสดงว่าลองทุกตัวแล้วไม่สำเร็จ
  logger.error(
    `[${requestId}] All models exhausted or critical error occurred`,
  );

  return NextResponse.json(
    errorResponse({
      status: lastError?.response?.status || 500,
      message_en:
        lastError?.response?.data?.error?.message || "All AI providers failed",
      message_th:
        "ขณะนี้ AI ทุกรุ่นไม่พร้อมใช้งาน (Quota เต็ม) กรุณารอสักครู่แล้วลองใหม่",
    }),
    { status: lastError?.response?.status || 500 },
  );
}
