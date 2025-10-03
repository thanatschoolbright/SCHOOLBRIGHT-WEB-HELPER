import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { BACKLOGS_CHAT_PROMPT } from "@/constants/prompts";
import { errorResponse, successResponse } from "@/helpers/api/response";

//** สร้าง URL เรียกใช้งาน Gemini รุ่น REST API v1 สำหรับฟีเจอร์สนทนา
const buildGeminiChatUrl = (modelName: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent`;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string().min(1),
      })
    )
    .min(1),
});

//** เรียก Gemini สนทนา AI เพื่อตอบกลับผู้ใช้ LINE Chatbot
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

    const requestBody = await request.json().catch(() => ({}));
    const parsedRequest = chatRequestSchema.safeParse(requestBody);

    if (!parsedRequest.success) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Invalid request payload",
          message_th: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          error: parsedRequest.error.format(),
        }),
        { status: 400 }
      );
    }

    const chatMessages = parsedRequest.data.messages;

    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];
    const environmentModel = process.env.GOOGLE_GEMINI_MODEL?.trim();
    const modelCandidates = environmentModel
      ? [
          environmentModel,
          ...fallbackModels.filter(
            (modelName) => modelName !== environmentModel
          ),
        ]
      : fallbackModels;

    const contents = [
      {
        role: "user",
        parts: [{ text: BACKLOGS_CHAT_PROMPT }],
      },
      ...chatMessages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    ];

    let replyText = "";
    let lastErrorMessage = "";

    for (const modelName of modelCandidates) {
      try {
        const requestUrl = `${buildGeminiChatUrl(modelName)}?key=${apiKey}`;
        const geminiResponse = await axios.post(
          requestUrl,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10_000,
            validateStatus: () => true,
          }
        );

        if (geminiResponse.status >= 200 && geminiResponse.status < 300) {
          const candidates = geminiResponse.data?.candidates;
          const firstCandidateText =
            Array.isArray(candidates) &&
            candidates[0]?.content?.parts?.[0]?.text;

          if (
            typeof firstCandidateText === "string" &&
            firstCandidateText.trim()
          ) {
            replyText = firstCandidateText.trim();
            break;
          }

          lastErrorMessage = "Gemini responded without content";
          console.error("Gemini Empty Chat Response", {
            model: modelName,
            data: geminiResponse.data,
          });
        } else {
          lastErrorMessage =
            typeof geminiResponse.data === "string"
              ? geminiResponse.data
              : JSON.stringify(geminiResponse.data);
          console.error("Gemini Chat Error Response", {
            model: modelName,
            status: geminiResponse.status,
            data: geminiResponse.data,
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String((error as Error).message)
            : String(error);
        lastErrorMessage = errorMessage;
        console.error("Gemini Chat Request Failed", {
          model: modelName,
          error,
        });
      }
    }

    if (!replyText) {
      return NextResponse.json(
        errorResponse({
          status: 502,
          message_en:
            lastErrorMessage || "All Gemini chat model candidates failed",
          message_th: "ไม่สามารถรับคำตอบจาก Gemini ได้",
        }),
        { status: 502 }
      );
    }

    return NextResponse.json(
      successResponse({
        data: { reply: replyText },
        message_en: "Gemini chat replied",
        message_th: "สนทนากับ AI สำเร็จ",
      })
    );
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String((error as Error).message)
        : String(error);

    return NextResponse.json(
      errorResponse({
        status: 500,
        message_en: errorMessage || "AI chat failed",
        message_th: "สนทนากับ AI ไม่สำเร็จ",
        error,
      }),
      { status: 500 }
    );
  }
}
