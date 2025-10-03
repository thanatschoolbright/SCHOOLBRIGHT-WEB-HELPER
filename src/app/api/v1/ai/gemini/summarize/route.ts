import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { QA_TASK_SUMMARY_PROMPT } from "@/constants/prompts";
import { successResponse, errorResponse } from "@/helpers/api/response";

//** สร้าง URL เรียกใช้งาน Gemini รุ่น REST API v1
const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

const requestSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
});

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

    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];
    const envModel = process.env.GOOGLE_GEMINI_MODEL?.trim();
    const modelCandidates = envModel
      ? [envModel, ...fallbackModels.filter((model) => model !== envModel)]
      : fallbackModels;

    const contents = [
      {
        role: "user",
        parts: [
          { text: QA_TASK_SUMMARY_PROMPT },
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
            timeout: 10_000,
            validateStatus: () => true,
          }
        );
        if (response.status >= 200 && response.status < 300) {
          const candidates = response.data?.candidates;
          const firstText =
            Array.isArray(candidates) &&
            candidates[0]?.content?.parts?.[0]?.text;

          if (typeof firstText === "string" && firstText.trim()) {
            markdown = firstText;
            break;
          }

          lastErrorMessage = "Gemini responded without content";
          console.error("Gemini Empty Response", {
            model: modelName,
            data: response.data,
          });
        } else {
          lastErrorMessage =
            typeof response.data === "string"
              ? response.data
              : JSON.stringify(response.data);
          console.error("Gemini Error Response", {
            model: modelName,
            status: response.status,
            data: response.data,
          });
        }
      } catch (modelError: any) {
        lastErrorMessage = modelError?.message || String(modelError);
        console.error("Gemini Request Failed", {
          model: modelName,
          error: modelError,
        });
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
