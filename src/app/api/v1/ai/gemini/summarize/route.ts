import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { QA_TASK_SUMMARY_TASK_PROMPT } from "@/constants/prompts";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";

const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-001",
  "gemini-flash-latest",
];

const requestSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  try {
    if (!apiKey) {
      logger.error(
        "Server configuration error: GOOGLE_GEMINI_API_KEY is missing"
      );
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "Server configuration error: API Key missing.",
          message_th: "การตั้งค่าเซิร์ฟเวอร์ผิดพลาด: ไม่มี API Key",
        }),
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.warn("Invalid request payload", { error: parsedBody.error });
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
    const attempts: any[] = [];

    for (const modelName of modelCandidates) {
      const endpointForLog = `${buildGeminiUrl(modelName)}?key=[REDACTED]`;
      const url = `${buildGeminiUrl(modelName)}?key=${apiKey}`;

      try {
        const response = await axios.post(
          url,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 45_000,
            validateStatus: () => true,
          }
        );

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

            logger.info(`Gemini Success`, { model: modelName });
            break;
          } else {
            throw new Error(
              "Gemini responded 200 but content is empty/blocked."
            );
          }
        } else {
          const apiError = response.data?.error || {};
          const apiMessage = apiError.message || response.statusText;

          logger.warn(`Model Failed`, {
            model: modelName,
            status: response.status,
            message: apiMessage,
          });

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

          if (response.status === 429) {
            logger.info(`Rate limit hit, waiting 1s`, { model: modelName });
            await delay(1000);
          }
        }
      } catch (error: any) {
        const errorMessage = error.message || "Unknown Network Error";
        logger.error(`Network/Client Error`, {
          model: modelName,
          error: errorMessage,
        });

        attempts.push({
          model: modelName,
          status: 0,
          message: errorMessage,
          endpoint: endpointForLog,
        });
        lastErrorDetails = { model: modelName, message: errorMessage };
      }
    }

    if (!markdown) {
      const statusCode =
        typeof lastErrorDetails?.status === "number"
          ? lastErrorDetails.status
          : 502;

      const lastErrorMessage = lastErrorDetails?.message || "Unknown Error";

      logger.error("All AI models failed", {
        attempts: attempts.length,
        lastError: lastErrorDetails,
      });

      return NextResponse.json(
        errorResponse({
          status: statusCode,
          message_en: `All AI models failed. Reason: ${lastErrorMessage}`,
          message_th: `ไม่สามารถสร้างสรุปได้ (AI ทั้งหมดไม่ตอบสนอง) สาเหตุ: ${lastErrorMessage}`,
          error: {
            attempts,
            lastError: lastErrorDetails,
            triedModels: modelCandidates,
          },
        }),
        { status: statusCode }
      );
    }

    return NextResponse.json(
      successResponse({
        data: { markdown },
        message_en: "Gemini summarized successfully",
        message_th: "สรุปข้อมูลสำเร็จ",
      })
    );
  } catch (error: any) {
    logger.error("Internal Server Error in Gemini API", {
      error: error?.message || error,
    });
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
