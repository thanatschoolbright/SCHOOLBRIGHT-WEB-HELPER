import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios"; // นำเข้า AxiosError
import { z } from "zod";
import { QA_TASK_SUMMARY_TASK_PROMPT } from "@/constants/prompts";
import { successResponse, errorResponse } from "@/helpers/api/response";

//** สร้าง URL เรียกใช้งาน Gemini รุ่น REST API v1
const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

//** กำหนด Schema สำหรับตรวจสอบ Input
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

//** ลำดับ Fallback Models: (Flash -> Pro, ล่าสุด -> เก่า) เพื่อความเร็วและประหยัด
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

//** เรียก Gemini สร้าง Markdown สรุป Task
export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  try {
    // 1. ตรวจสอบ API Key
    if (!apiKey) {
      console.error("Configuration Error: GOOGLE_GEMINI_API_KEY is not set.");
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

    // 3. กำหนดลำดับ Model ที่จะลองใช้
    const envModel = process.env.GOOGLE_GEMINI_MODEL?.trim();
    const modelCandidates = envModel
      ? [envModel, ...FALLBACK_MODELS.filter((model) => model !== envModel)]
      : FALLBACK_MODELS;

    const contents = [
      {
        role: "user",
        parts: [
          { text: QA_TASK_SUMMARY_TASK_PROMPT },
          {
            text: `\n\nข้อมูลปัจจุบันของงาน (สำหรับสรุป):\n- Summary: ${
              summary || "-"
            }\n- Description (raw):\n${description || "-"}`,
          },
        ],
      },
    ];

    let markdown = "";
    let lastErrorDetails: any = null;
    const attempts: ModelAttempt[] = [];

    // 4. วนลูปเพื่อลองเรียกใช้โมเดลแต่ละตัว
    for (const modelName of modelCandidates) {
      const endpointForLog = `${buildGeminiUrl(modelName)}?key=[REDACTED]`;
      const url = `${buildGeminiUrl(modelName)}?key=${apiKey}`;

      try {
        // 5. ใช้ axios.post และให้ axios จัดการ Error Status เอง (ดีฟอลต์คือสถานะ 4xx/5xx จะโยน Error)
        const response = await axios.post(
          url,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 30_000,
            // ลบ validateStatus ออกไป เพื่อให้ Try-Catch block ด้านนอกทำงาน
          }
        );

        // ตรวจสอบว่ามีเนื้อหาใน Response หรือไม่ (Response 200 OK แต่ไม่มี Text)
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
          console.log(`Gemini success with model: ${modelName}`);
          break; // สำเร็จแล้ว ออกจาก Loop
        }

        // กรณีได้ 200 แต่ไม่มีเนื้อหา
        lastErrorDetails = {
          message: "Gemini responded without content.",
          model: modelName,
          data: response.data,
        };
        attempts.push({
          model: modelName,
          status: response.status,
          message: lastErrorDetails.message,
          endpoint: endpointForLog,
          responseBody: response.data,
        });
        console.error("Gemini Empty Response", lastErrorDetails);
      } catch (error:any) {
        // 6. จัดการข้อผิดพลาดที่โยนมาจาก Axios (เช่น 400, 404, Timeout)
        if (axios.isAxiosError(error)) {
          const axiosError = error as any;

          // ข้อมูล Error จาก API
          const apiErrorData = axiosError.response?.data;
          const status = axiosError.response?.status;
          const apiMessage =
            apiErrorData?.error?.message ||
            apiErrorData?.message ||
            axiosError.message;

          // บันทึกรายละเอียด Error ล่าสุด
          lastErrorDetails = {
            model: modelName,
            status: status,
            message: apiMessage,
          };
          attempts.push({
            model: modelName,
            status,
            message: apiMessage,
            endpoint: endpointForLog,
            responseBody: apiErrorData,
          });

          // หากเป็น Error ที่เกี่ยวกับ Model Not Found/Denied ให้ข้ามไปลอง Model ถัดไป
          if (status === 404 || status === 403) {
            console.warn(
              `Model ${modelName} failed with ${status}. Trying next model...`,
              apiErrorData
            );
            continue; // ลอง Model ถัดไป
          }

          console.error(
            "Gemini Request Failed (Axios Error)",
            lastErrorDetails
          );
        } else {
          // Error อื่นๆ (เช่น JSON parsing error หรือ unknown error)
          lastErrorDetails = {
            model: modelName,
            message: (error as Error).message || String(error),
          };
          attempts.push({
            model: modelName,
            message: lastErrorDetails.message,
            endpoint: endpointForLog,
          });
          console.error(
            "Unknown Error during Gemini Request",
            lastErrorDetails
          );
        }
      }
    }

    // 7. คืนค่า Error 404 หากลองทุกโมเดลแล้วไม่สำเร็จ
    if (!markdown) {
      const lastAttempt = attempts[attempts.length - 1] || lastErrorDetails;
      const statusCode =
        typeof lastAttempt?.status === "number" ? lastAttempt.status : 502;
      return NextResponse.json(
        errorResponse({
          status: statusCode,
          message_en: `All Gemini model candidates failed. Last error from ${lastAttempt?.model || "unknown model"}: ${
            lastAttempt?.message || "Unknown error."
          }`,
          message_th: `เรียก Gemini ไม่สำเร็จ (สถานะ ${statusCode}) ลองทุกรุ่นแล้วแต่ไม่สำเร็จ`,
          error: {
            attempts,
            lastError: lastErrorDetails,
            triedModels: modelCandidates,
          },
        }),
        { status: statusCode }
      );
    }

    // 8. คืนค่าสำเร็จ
    return NextResponse.json(
      successResponse({
        data: { markdown },
        message_en: "Gemini summarized successfully",
        message_th: "สรุปด้วย AI สำเร็จ",
      })
    );
  } catch (error: any) {
    // 9. จัดการข้อผิดพลาดที่ไม่เกี่ยวกับ API call (เช่น JSON parsing error ตอนรับ request)
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_en: error?.message || "Internal server error.",
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        error,
      }),
      { status: 500 }
    );
  }
}
