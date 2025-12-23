import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { QA_TASK_SUMMARY_TASK_PROMPT } from "@/constants/prompts";
import { successResponse, errorResponse } from "@/helpers/api/response";

// ----------------------------------------------------------------------
// 🛠️ CONFIGURATION
// ----------------------------------------------------------------------

// ใช้ v1beta เพื่อรองรับ Model ใหม่ๆ ได้ดีกว่า v1
const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// ลำดับ Model ที่จะใช้ (เรียงจาก ใหม่/เร็ว -> เสถียร -> ฉลาด)
// อัปเดตชื่อ Model ให้เป็นปัจจุบัน (ณ ปี 2025)
const FALLBACK_MODELS = [
  "gemini-2.0-flash-exp", // รุ่นใหม่ล่าสุด (เร็วและเก่ง)
  "gemini-1.5-flash", // รุ่นมาตรฐาน (เร็วและถูก)
  "gemini-1.5-pro", // รุ่นฉลาด (แต่อาจจะช้ากว่า)
  "gemini-1.5-flash-8b", // รุ่นเล็กสุด (สำรองสุดท้าย)
];

const requestSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
});

type ModelAttempt = {
  model: string;
  status?: number;
  message: string;
  endpoint: string;
  responseBody?: any;
};

// ฟังก์ชันหน่วงเวลา (Sleep) เพื่อรอให้ Quota รีเซ็ตเล็กน้อยก่อนลองรุ่นถัดไป
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ----------------------------------------------------------------------
// 🚀 API HANDLER
// ----------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  try {
    // 1. ตรวจสอบ API Key
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "Server configuration error: API Key missing.",
          message_th: "การตั้งค่าเซิร์ฟเวอร์ผิดพลาด: ไม่มี API Key",
        }),
        { status: 500 }
      );
    }

    // 2. ตรวจสอบ Payload
    const body = await request.json().catch(() => ({}));
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Invalid request payload",
          message_th: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          error: parsedBody.error.format(),
        }),
        { status: 400 }
      );
    }

    const { summary, description } = parsedBody.data;

    // 3. เตรียม Candidate Models
    const envModel = process.env.GOOGLE_GEMINI_MODEL?.trim();
    const modelCandidates = envModel
      ? [envModel, ...FALLBACK_MODELS.filter((m) => m !== envModel)]
      : FALLBACK_MODELS;

    const contents = [
      {
        role: "user",
        parts: [
          { text: QA_TASK_SUMMARY_TASK_PROMPT },
          {
            text: `\n\n--- INPUT DATA ---\nSummary: ${
              summary || "-"
            }\nDescription:\n${description || "-"}`,
          },
        ],
      },
    ];

    let markdown = "";
    let lastErrorDetails: any = null;
    const attempts: ModelAttempt[] = [];

    // 4. วนลูป Fallback Models
    for (const modelName of modelCandidates) {
      const endpointForLog = `${buildGeminiUrl(modelName)}?key=[REDACTED]`;
      const url = `${buildGeminiUrl(modelName)}?key=${apiKey}`;

      try {
        console.log(`🤖 Trying Gemini Model: ${modelName}...`);

        const response = await axios.post(
          url,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 30_000,
            validateStatus: () => true, // ให้ axios ไม่ throw error เพื่อจัดการ status เอง
          }
        );

        // ตรวจสอบความสำเร็จ (Status 200)
        if (response.status === 200) {
          const firstText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (typeof firstText === "string" && firstText.trim()) {
            attempts.push({
              model: modelName,
              status: response.status,
              message: "Success",
              endpoint: endpointForLog,
            });
            markdown = firstText;
            console.log(`✅ Gemini Success with: ${modelName}`);
            break; // จบลูปทันทีเมื่อสำเร็จ
          } else {
            // 200 แต่ไม่มีเนื้อหา (Empty Response)
            throw new Error("Gemini responded 200 but content is empty.");
          }
        }

        // กรณี Error จาก API (4xx, 5xx)
        else {
          const apiMessage =
            response.data?.error?.message || response.statusText;

          // Log ปัญหา
          console.warn(
            `❌ Model ${modelName} Failed (${response.status}): ${apiMessage}`
          );

          attempts.push({
            model: modelName,
            status: response.status,
            message: apiMessage,
            endpoint: endpointForLog,
            responseBody: response.data,
          });

          lastErrorDetails = {
            model: modelName,
            status: response.status,
            message: apiMessage,
          };

          // ⚠️ สำคัญ: ถ้าเจอ 429 (Rate Limit) ให้รอสักนิดก่อนลองรุ่นถัดไป
          if (response.status === 429) {
            console.log(
              "⏳ Rate limit hit. Waiting 2s before trying next model..."
            );
            await delay(2000); // หยุดรอ 2 วินาที
          }
        }
      } catch (error: any) {
        // กรณี Error ระดับ Network / Timeout
        const errorMessage = error.message || "Unknown Network Error";
        console.error(`💥 Network Error on ${modelName}:`, errorMessage);

        attempts.push({
          model: modelName,
          status: 0,
          message: errorMessage,
          endpoint: endpointForLog,
        });
        lastErrorDetails = { model: modelName, message: errorMessage };
      }
    }

    // 5. สรุปผลลัพธ์
    if (!markdown) {
      // ถ้าลองทุกรุ่นแล้วยังไม่ได้คำตอบ
      const statusCode =
        typeof lastErrorDetails?.status === "number"
          ? lastErrorDetails.status
          : 502;

      return NextResponse.json(
        errorResponse({
          status: statusCode,
          message_en: "All AI models failed to generate summary.",
          message_th: "ไม่สามารถสร้างสรุปได้ (AI ทั้งหมดไม่ตอบสนอง)",
          error: {
            attempts,
            lastError: lastErrorDetails,
            triedModels: modelCandidates,
          },
        }),
        { status: statusCode }
      );
    }

    // 6. ส่งคืนผลลัพธ์ที่สำเร็จ
    return NextResponse.json(
      successResponse({
        data: { markdown },
        message_en: "Gemini summarized successfully",
        message_th: "สรุปข้อมูลสำเร็จ",
      })
    );
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_en: "Internal server error.",
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        error: error?.message || error,
      }),
      { status: 500 }
    );
  }
}
