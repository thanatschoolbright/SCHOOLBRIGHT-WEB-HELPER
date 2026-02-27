import { QA_TASK_SUMMARY_TASK_PROMPT } from "@/constants/prompts";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  summary: z.string().min(1, "Summary is required").optional(),
  description: z.string().optional(),
  issueKey: z.string().optional(),
  details: z.any().optional(), // Receive full issue object
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.CHATGPT_API_KEY;
  const requestId = Math.random().toString(36).substring(7);

  if (!apiKey) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "ChatGPT API Key missing (CHATGPT_API_KEY)",
      }),
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

  const { summary, description, details, issueKey } = result.data;

  try {
    logger.info(
      `[${requestId}] Attempting ChatGPT Summarization for ${
        issueKey || "Unknown Issue"
      }`,
    );

    // Extract valid metadata from details if available
    const assigneeName = details?.assignee?.name || "Unassigned";
    const priorityName = details?.priority?.name || "-";
    const statusName = details?.status?.name || "-";
    const creatorName = details?.createdUser?.name || "-";
    const attachmentNames =
      details?.attachments?.map((a: any) => a.name).join(", ") || "None";
    const projectId = details?.projectId || "-";

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Use a cost-effective model as default
        messages: [
          {
            role: "system",
            content: QA_TASK_SUMMARY_TASK_PROMPT,
          },
          {
            role: "user",
            content: `--- KEY METADATA ---
Project ID: ${projectId}
Assignee: ${assigneeName}
Priority: ${priorityName}
Status: ${statusName}
Creator: ${creatorName}
Attachments: ${attachmentNames}

--- INPUT ISSUE DATA ---
Issue Key: ${issueKey || "-"}
Summary: ${summary || "-"}
Description: ${description || "-"}

Full Context (JSON):
\`\`\`json
${JSON.stringify(details || {}, null, 2)}
\`\`\`
`,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const aiMarkdown = response.data?.choices?.[0]?.message?.content;

    if (aiMarkdown) {
      // ** Post-process to fix incorrect image syntax ![text](url) -> ![text][url] for Backlog **
      const fixedMarkdown = aiMarkdown.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        "![$1][$2]",
      );

      // ** Append original description to protect data as requested by user **
      const markdown = `${fixedMarkdown}\n\n---\n### ข้อความต้นฉบับ (Original Description)\n\`\`\`\n${
        description || "_No original description provided_"
      }\n\`\`\`\n\n[INFO] ข้อความถูกปรับโดยอัตโนมัติ โดย Light AI *เวอร์ชัน 1.0.2*`;

      /**
       * Reformat Summary if it matches the "Grade (X) ID School : Content" pattern
       * From: "Grade (C+) 961 โรงเรียนพระวิสุทธิวงส์ : แอปพลิเคชันมีการแจ้งเตือนไม่ตรงตามเวลา"
       * To: "[C+] แอปพลิเคชันมีการแจ้งเตือนไม่ตรงตามเวลา (โรงเรียนพระวิสุทธิวงส์) (961) [สรุปด้วย Light AI]"
       */
      const reformatAndTagSummary = (
        val: string | null | undefined,
      ): string => {
        if (!val) return "";

        let finalVal = val.trim();

        // Pattern explanation: Grade (Grade) ID SchoolName : OriginalContent
        // Match example: Grade (C+) 961 โรงเรียนพระวิสุทธิวงส์ : แอปพลิเคชัน...
        const pattern =
          /^Grade\s*\((.*?)\)\s*(\d+)\s*(โรงเรียน.*?)\s*:\s*(.*)$/i;
        const match = finalVal.match(pattern);

        if (match) {
          const [, grade, schoolId, schoolName, content] = match;
          finalVal = `[${grade}] ${content.trim()} (${schoolName.trim()}) (${schoolId})`;
        }

        // Ensure AI Tag for Backlog tracking (Consistent with Backlog Service)
        const hasAiPrefix = finalVal.includes("AI");

        return hasAiPrefix ? finalVal : `${finalVal} [สรุปด้วย Light AI]`;
      };

      const taggedSummary = reformatAndTagSummary(summary);

      logger.info(`[${requestId}] Success with ChatGPT`);
      return NextResponse.json(
        successResponse({
          data: {
            markdown,
            summary: taggedSummary,
            model_used: "gpt-4o-mini",
          },
          message_th: "สรุปด้วย ChatGPT สำเร็จ",
        }),
      );
    } else {
      throw new Error("No content returned from OpenAI");
    }
  } catch (error: any) {
    logger.error(`[${requestId}] ChatGPT API Error: ${error.message}`);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message;

    return NextResponse.json(
      errorResponse({
        status: statusCode,
        message_en: errorMessage,
        message_th: "เกิดข้อผิดพลาดในการเรียกใช้ ChatGPT",
      }),
      { status: statusCode },
    );
  }
}
