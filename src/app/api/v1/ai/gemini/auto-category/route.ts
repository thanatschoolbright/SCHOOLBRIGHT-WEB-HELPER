import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

const MODEL_FALLBACKS: string[] = [
  process.env.GOOGLE_GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
].filter(Boolean) as string[];

type CategoryOption = {
  id: number;
  name: string;
};

type IssuePayload = {
  issueKey: string;
  summary?: string;
  description?: string;
};

type AutoCategoryRequest = {
  issues?: IssuePayload[];
  categories?: CategoryOption[];
};

type AutoCategorySuggestion = {
  issueKey: string;
  categoryIds: number[];
  reason?: string;
};

const extractJson = (text: string) => {
  const fenced = text.match(/```json([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1];
  const fencedAny = text.match(/```([\s\S]*?)```/);
  if (fencedAny?.[1]) return fencedAny[1];
  return text;
};

//** สรุป Category ต่อ Issue ด้วย Gemini ให้ตอบเป็น JSON
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

    const body = (await request.json().catch(() => ({}))) as AutoCategoryRequest;
    const issues = body.issues || [];
    const categories = body.categories || [];

    if (!issues.length || !categories.length) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing issues or categories",
          message_th: "กรุณาระบุรายการงานและหมวดหมู่",
        }),
        { status: 400 }
      );
    }

    const prompt = `คุณเป็นผู้ช่วย Product Owner โปรดเลือกหมวดหมู่ที่เหมาะสมที่สุดต่อ Issue แต่ละรายการโดยอิงจากรายการหมวดหมู่ที่ให้ไว้เท่านั้น\n\nรูปแบบคำตอบ: ให้ตอบเป็น JSON Array โดยไม่มีคำบรรยายอื่น เช่น\n[\n  {\n    "issueKey": "ABC-1",\n    "categoryIds": [123],\n    "reason": "เหตุผลสั้น ๆ"\n  }\n]\nหากไม่มั่นใจ ให้คืน categoryIds เป็น []\n\nรายการ Category: ${JSON.stringify(categories)}\n\nIssue ที่ต้องจัดหมวดหมู่: ${JSON.stringify(issues)}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    let suggestions: AutoCategorySuggestion[] = [];
    let lastErrorMessage = "";

    for (const modelName of MODEL_FALLBACKS) {
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
          const rawText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!rawText) continue;
          try {
            const jsonPayload = extractJson(rawText);
            const parsed = JSON.parse(jsonPayload) as AutoCategorySuggestion[];
            if (Array.isArray(parsed)) {
              suggestions = parsed.filter((record) => record.issueKey);
              if (suggestions.length) break;
            }
          } catch (parseError: any) {
            lastErrorMessage = parseError?.message || String(parseError);
          }
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

    if (!suggestions.length) {
      return NextResponse.json(
        errorResponse({
          status: 422,
          message_en: lastErrorMessage || "Gemini could not determine categories",
          message_th: "ไม่สามารถสรุปหมวดหมู่ด้วย Gemini ได้",
        }),
        { status: 422 }
      );
    }

    // Map suggestions to ensure categoryIds เป็นตัวเลขเสมอ
    const normalized = suggestions.map((item) => ({
      issueKey: item.issueKey,
      categoryIds: (item.categoryIds || [])
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value)),
      reason: item.reason,
    }));

    return NextResponse.json(
      successResponse({
        data: { suggestions: normalized },
        message_en: "Gemini auto category success",
        message_th: "สรุปหมวดหมู่ด้วย Gemini สำเร็จ",
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_en: error?.message || "Gemini auto category failed",
        message_th: "สรุปหมวดหมู่ด้วย Gemini ไม่สำเร็จ",
        error,
      }),
      { status: 500 }
    );
  }
}
