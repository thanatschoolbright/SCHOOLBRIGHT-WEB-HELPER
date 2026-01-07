import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { QA_TASK_SUMMARY_TASK_PROMPT } from "@/constants/prompts";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger"; // ** ตรวจสอบว่าในไฟล์นี้ใช้ winston.createLogger

// ** Configuration: ล็อคเป้าหมายไปที่รุ่นประหยัดและเร็วที่สุดของปี 2026
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ** Schema สำหรับตรวจสอบข้อมูลขาเข้า
const requestSchema = z.object({
  summary: z.string().min(1, "Summary is required").optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const requestId = Math.random().toString(36).substring(7); // ** สำหรับ Debug Trace

  try {
    // ! 1. Check API Key
    if (!apiKey) {
      logger.error(`[${requestId}] Configuration Error: Missing API Key`);
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "Server configuration error",
          message_th: "การตั้งค่าเซิร์ฟเวอร์ผิดพลาด",
        }),
        { status: 500 }
      );
    }

    // ! 2. Validation
    const body = await request.json().catch(() => ({}));
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      logger.warn(`[${requestId}] Validation Failed`, {
        errors: result.error.format(),
      });
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_th: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          error: result.error.format(),
        }),
        { status: 400 }
      );
    }

    const { summary, description } = result.data;

    // * Prepare Prompt & Content
    const contents = [
      {
        role: "user",
        parts: [
          { text: QA_TASK_SUMMARY_TASK_PROMPT },
          {
            text: `\n\n--- INPUT ---\nSummary: ${
              summary || "-"
            }\nDescription: ${description || "-"}`,
          },
        ],
      },
    ];

    // ? 3. AI Generation (Focus: Gemini 2.5 Flash Lite)
    logger.info(`[${requestId}] AI Start: ${GEMINI_MODEL}`, {
      payload: { summary },
    });

    const response = await axios.post(
      `${GEMINI_URL}?key=${apiKey}`,
      {
        contents,
        generationConfig: {
          temperature: 0.4, // ** ต่ำเพื่อให้คำตอบนิ่งและเร็ว
          maxOutputTokens: 1024,
        },
      },
      {
        timeout: 20000, // ** Flash Lite ควรตอบกลับภายใน 20 วิ
        validateStatus: (status) => status < 500, // ** ยอมรับ 4xx เพื่อมาจัดการต่อเอง
      }
    );

    // * 4. Handle Success
    if (response.status === 200) {
      const markdown =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!markdown) {
        logger.error(`[${requestId}] API 200 but No Content`, {
          res: response.data,
        });
        throw new Error("Empty content from Gemini");
      }

      logger.info(`[${requestId}] AI Success`, {
        usage: response.data?.usageMetadata, // ** Debug ดู Token ที่ใช้จริง
        model: GEMINI_MODEL,
      });

      return NextResponse.json(
        successResponse({
          data: { markdown },
          message_th: "สรุปข้อมูลสำเร็จ",
        })
      );
    }

    // ! 5. Handle API Error (429, 400, 403)
    logger.error(`[${requestId}] Gemini API Error`, {
      status: response.status,
      data: response.data,
    });

    return NextResponse.json(
      errorResponse({
        status: response.status,
        message_en: response.data?.error?.message || "AI Provider Error",
        message_th: "โมเดล AI เกิดข้อผิดพลาด กรุณาลองใหม่",
      }),
      { status: response.status }
    );
  } catch (error: any) {
    // ! 6. Critical/Network Error
    logger.error(`[${requestId}] Internal Server Error`, {
      message: error.message,
      stack: error.stack, // ** สำคัญมากสำหรับการ Debug
    });

    return NextResponse.json(
      errorResponse({
        status: 500,
        message_en: "Internal system error",
        message_th: "ระบบขัดข้อง กรุณาติดต่อผู้ดูแล",
      }),
      { status: 500 }
    );
  }
}
