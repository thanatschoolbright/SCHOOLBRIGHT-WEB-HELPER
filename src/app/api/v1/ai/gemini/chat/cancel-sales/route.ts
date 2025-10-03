import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { QA_CANCEL_SALES_CHAT_PROMPT } from "@/constants/prompts";
import { errorResponse, successResponse } from "@/helpers/api/response";
import {
  matchSchool,
  matchUserByName,
  type SchoolMatch,
  type UserMatch,
} from "./matcher";

//** สร้าง URL เรียกใช้งาน Gemini รุ่น REST API v1 สำหรับฟีเจอร์สนทนา Cancel Sales
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

const normalizeText = (value?: string) =>
  (value || "")
    .toLowerCase()
    .replace(/โรงเรียน/g, "")
    .replace(/\s+/g, "")
    .trim();

const isConfirmationMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;
  return /(ยืนยัน|ตกลง|confirm|คอนเฟิร์ม|ใช่ค่ะ|ใช่ครับ|yes|ตกลงค่ะ|ตกลงครับ)/i.test(
    normalized
  );
};

const sanitizeCapturedValue = (value: string) =>
  value
    .replace(/[*_`]/g, "")
    .replace(/\(\s*รหัส[^)]*\)/gi, "")
    .replace(/\(SchoolID[^)]*\)/gi, "")
    .trim();

const extractApiStatusText = (result: CancelSalesResultMeta | null) => {
  if (!result?.data || typeof result.data !== "object") return null;
  const data = result.data as Record<string, any>;
  return (
    (typeof data.message === "string" && data.message) ||
    (typeof data.status === "string" && data.status) ||
    (typeof data?.data?.message === "string" && data.data.message) ||
    (typeof data?.data?.status === "string" && data.data.status) ||
    null
  );
};

interface SchoolContextHint {
  schoolId?: string;
  schoolName?: string;
  schoolNameEN?: string;
}

interface ExtractedInfo {
  schoolName?: string;
  schoolNameEN?: string;
  schoolId?: string;
  buyerName?: string;
  buyerLastName?: string;
  buyerUserId?: string;
  sellerName?: string;
  sellerLastName?: string;
  sellerUserId?: string;
  sSellId?: string;
}

interface CancelSalesResultMeta {
  status: "success" | "error";
  data?: unknown;
  message?: string;
}

type PendingField = "school" | "seller" | "transaction" | null;

const extractInfoFromMessages = (
  messages: Array<{ role: string; content: string }>
) => {
  const info: ExtractedInfo = {};
  let currentRole: "buyer" | "seller" | "" = "";
  let pendingField: "buyerUserId" | "sellerUserId" | "sSellId" | null = null;

  const lines = messages
    .filter((message) => message.role === "user")
    .flatMap((message) => message.content.split(/\n+/));

  for (const original of lines) {
    if (!original) continue;
    const line = original.trim().replace(/^[-•\*]+\s*/, "");
    if (!line) continue;
    const lower = line.toLowerCase();

    if (/(ผู้ซื้อ|buyer)/i.test(lower)) {
      currentRole = "buyer";
    } else if (/(ผู้ขาย|seller)/i.test(lower)) {
      currentRole = "seller";
    }

    const schoolIdMatch = line.match(/school[_\s-]*id\s*[:：]?\s*(\d+)/i);
    if (schoolIdMatch) {
      info.schoolId = schoolIdMatch[1];
    }

    if (/ชื่อโรงเรียน/.test(lower)) {
      const value = line.split(/[:：]/)[1]?.trim();
      if (value) {
        if (/อังกฤษ|english|schoolnameen/.test(lower)) {
          info.schoolNameEN = value;
        } else {
          info.schoolName = value;
        }
      }
    }

    const sSellMatch =
      line.match(/sSellID\s*[:：]?\s*([\w-]+)/i) ||
      line.match(
        /รหัส\s*ทราน(ซ|ส)เ?คชั?น[\s\-]*การซื้อขาย\s*[:：]?\s*([\w-]+)/i
      );
    if (sSellMatch) {
      const value = (sSellMatch[1] ?? sSellMatch[2] ?? "")
        .trim()
        .replace(/^[-\s]+/, "");
      if (value) {
        info.sSellId = value;
        pendingField = null;
      } else {
        pendingField = "sSellId";
      }
      continue;
    }

    const userIdMatch = line.match(/user[_\s-]*id[^:：]*[:：]?\s*(.+)?/i);
    if (userIdMatch) {
      const rawValue = userIdMatch[1]?.replace(/^[–\-]\s*/, "").trim();
      const targetField =
        currentRole === "seller" ? "sellerUserId" : "buyerUserId";
      if (rawValue && /^[0-9]+$/.test(rawValue)) {
        (info as any)[targetField] = rawValue;
        pendingField = null;
      } else {
        pendingField = targetField;
      }
      continue;
    }

    if (pendingField) {
      const value = line.replace(/^[–\-]\s*/, "").trim();
      if (value && value !== "—" && !/ไม่มี|not\s*required/i.test(value)) {
        (info as any)[pendingField] = value;
      }
      pendingField = null;
    }

    const nameMatch = line.match(/ชื่อ(?!โรงเรียน)[^:：]*[:：]\s*(.+)/i);
    if (nameMatch) {
      const value = nameMatch[1].trim();
      if (value && value !== "—") {
        if (currentRole === "seller") {
          info.sellerName = value;
        } else {
          info.buyerName = value;
        }
      }
    }

    const lastNameMatch = line.match(/นามสกุล[^:：]*[:：]\s*(.+)/i);
    if (lastNameMatch) {
      const value = lastNameMatch[1].trim();
      if (value && value !== "—") {
        if (currentRole === "seller") {
          info.sellerLastName = value;
        } else {
          info.buyerLastName = value;
        }
      }
      continue;
    }

    if (pendingField === "sSellId") {
      const value = line.replace(/^[–\-]\s*/, "").trim();
      if (value && value !== "—" && !/ไม่มี/.test(value)) {
        info.sSellId = value;
      }
      pendingField = null;
    }
  }

  return info;
};

const augmentInfoFromConversation = (
  messages: Array<{ role: string; content: string }>,
  info: ExtractedInfo
) => {
  let pendingField: PendingField = null;

  for (const message of messages) {
    const content = message.content?.trim();
    if (!content) continue;
    const lines = content
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    if (message.role === "assistant") {
      const lowerContent = content.toLowerCase();
      if (/โรงเรียน/.test(lowerContent) && /(อะไร|แจ้ง)/.test(lowerContent)) {
        pendingField = "school";
      }
      if (/ผู้ขาย/.test(lowerContent) && /(ใคร|คือ)/.test(lowerContent)) {
        pendingField = "seller";
      }
      if (
        /ssellid/i.test(content) ||
        /รหัส\s*(ธุรกรรม|ทราน|transaction)/i.test(lowerContent)
      ) {
        pendingField = "transaction";
      }

      for (const line of lines) {
        const schoolIdMatch = line.match(/school[_\s-]*id\s*[:：]?\s*(\d+)/i);
        if (schoolIdMatch && !info.schoolId) {
          info.schoolId = schoolIdMatch[1];
        }
        const sellerIdMatch = line.match(/\bUserID\b[^\d]*(\d+)/i);
        if (sellerIdMatch && !info.sellerUserId) {
          info.sellerUserId = sellerIdMatch[1];
        }
        if (/user\s*id\s*\(sID\/sID2\)/i.test(line) && !info.sellerUserId) {
          const digits = line.match(/(\d{3,})/);
          if (digits) info.sellerUserId = digits[1];
        }
        if (/โรงเรียนที่พบเจอปัญหาคือ/i.test(line) && !info.schoolName) {
          const nameMatch = line.match(
            /โรงเรียนที่พบเจอปัญหาคือ:\s*[*_]*([^\n]+)/i
          );
          if (nameMatch) {
            info.schoolName = sanitizeCapturedValue(nameMatch[1]);
          }
        }
      }
      continue;
    }

    if (message.role !== "user") continue;

    for (const line of lines) {
      const userIdMatch = line.match(/user[_\s-]*id\s*[:：]?\s*(\d+)/i);
      if (userIdMatch && !info.sellerUserId) {
        info.sellerUserId = userIdMatch[1];
      }

      const schoolIdMatch = line.match(/school[_\s-]*id\s*[:：]?\s*(\d+)/i);
      if (schoolIdMatch && !info.schoolId) {
        info.schoolId = schoolIdMatch[1];
      }

      if (pendingField === "school" && !info.schoolName) {
        info.schoolName = sanitizeCapturedValue(line);
        pendingField = null;
        continue;
      }

      if (pendingField === "seller") {
        if (!info.sellerName) {
          info.sellerName = sanitizeCapturedValue(line.replace(/\(.*?\)/g, ""));
        }
        if (!info.sellerUserId) {
          const digits = line.match(/(\d{3,})/);
          if (digits) info.sellerUserId = digits[1];
        }
        pendingField = null;
        continue;
      }

      if (pendingField === "transaction" && !info.sSellId) {
        const tx = line.match(/[A-Za-z0-9_-]+/);
        if (tx) info.sSellId = tx[0];
        pendingField = null;
        continue;
      }

      if (!info.sSellId) {
        const txInline = line.match(/ssellid\s*[:：]?\s*([\w-]+)/i);
        if (txInline) info.sSellId = txInline[1];
      }
    }
  }

  return info;
};

const buildSchoolSearchContext = async (
  origin: string,
  latestUserMessage: string
) => {
  const baseInstruction =
    'เริ่มสนทนาทุกครั้งด้วยคำถาม "โรงเรียนที่พบเจอปัญหาคืออะไรคะ?" และแจ้งผู้ใช้ว่าจะตรวจสอบ SchoolID ผ่าน API /api/v1/school ก่อนถามข้อมูลผู้ขาย';

  if (!latestUserMessage) return baseInstruction;

  const hasSchoolKeyword = /โรงเรียน|school/i.test(latestUserMessage);
  if (!hasSchoolKeyword) return baseInstruction;

  const contextLines = [baseInstruction];

  try {
    const schoolResponse = await axios.get(`${origin}/api/v1/school`);
    const schools: Array<{
      SchoolID: number | string;
      SchoolName: string;
      SchoolNameEN: string;
    }> = schoolResponse.data?.data ?? [];

    const normalizedMessage = normalizeText(latestUserMessage);
    const matched = schools
      .map((school) => {
        const normalizedName = normalizeText(school.SchoolName);
        const normalizedNameEN = normalizeText(school.SchoolNameEN);

        let score = 0;
        if (
          normalizedMessage === normalizedName ||
          (normalizedNameEN && normalizedMessage === normalizedNameEN)
        ) {
          score = 3;
        } else if (
          (normalizedName && normalizedMessage.includes(normalizedName)) ||
          (normalizedNameEN && normalizedMessage.includes(normalizedNameEN))
        ) {
          score = 2;
        } else if (
          (normalizedName && normalizedName.includes(normalizedMessage)) ||
          (normalizedNameEN && normalizedNameEN.includes(normalizedMessage))
        ) {
          score = 1;
        }

        return { school, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.school);

    if (!matched.length) {
      contextLines.push(
        "ยังไม่พบโรงเรียนที่ตรงกับข้อความล่าสุด ให้ขอชื่อโรงเรียนเพิ่มเติมหรือสะกดใหม่"
      );
      return contextLines.join("\n");
    }

    const [primary, ...alternatives] = matched;
    const primaryThai = (primary.SchoolName || "").trim();
    const primaryEnglish = (primary.SchoolNameEN || "").trim();
    const primaryDisplay = primaryEnglish
      ? `${primaryThai} (${primaryEnglish})`
      : primaryThai;

    contextLines.push(
      `โรงเรียนที่ตรงกันมากที่สุด: ${primaryDisplay} (SchoolID: ${primary.SchoolID})`
    );

    if (alternatives.length) {
      for (const school of alternatives) {
        const thai = (school.SchoolName || "").trim();
        const english = (school.SchoolNameEN || "").trim();
        const display = english ? `${thai} (${english})` : thai;
        contextLines.push(
          `- ทางเลือกใกล้เคียง: ${display} (SchoolID: ${school.SchoolID})`
        );
      }
    }

    contextLines.push(
      `ให้ถามยืนยันว่า \"ต้องการยกเลิกรายการสินค้าเกิน 7 วันที่${primaryThai} (รหัส : ${primary.SchoolID}) ใช่หรือไม่คะ\" และเมื่อได้รับคำยืนยันให้จดจำ SchoolID นี้สำหรับขั้นตอนถัดไป`
    );
    contextLines.push(
      "หากผู้ใช้บอกว่าไม่ตรงหรือยังไม่แน่ใจ ให้ขอชื่อโรงเรียนใหม่ก่อนดำเนินการถามข้อมูลผู้ขาย"
    );

    return contextLines.join("\n");
  } catch (error) {
    console.error("Gemini Cancel Sales School Lookup Failed", error);
    return contextLines.join("\n");
  }
};

const buildUserSearchContext = async (
  origin: string,
  school: SchoolContextHint
) => {
  if (!school.schoolId) return "";

  const schoolDisplay = school.schoolName
    ? school.schoolName
    : school.schoolNameEN
    ? school.schoolNameEN
    : "โรงเรียนที่ระบุ";

  const contextLines = [
    `Progress: กำลังค้นหาชื่อผู้ใช้ที่โรงเรียน${schoolDisplay} (รหัส : ${school.schoolId}) จาก API /api/v1/school/get-user`,
  ];

  try {
    const userResponse = await axios.get(
      `${origin}/api/v1/school/get-user?school_id=${school.schoolId}`
    );
    const users: Array<{
      UserID: number | string;
      Name: string;
      LastName: string;
      username?: string;
    }> = userResponse.data?.data ?? [];

    if (!users.length) {
      contextLines.push(
        "ยังไม่พบรายชื่อผู้ใช้ ให้แจ้งผู้ใช้ว่าสามารถระบุชื่อ-นามสกุล หรือหมายเลขบัตร/username เพิ่มเติมได้"
      );
    } else {
      contextLines.push("รายชื่อผู้ใช้บางส่วนในโรงเรียน:");
      for (const user of users.slice(0, 8)) {
        const thaiName = `${user.Name || ""} ${user.LastName || ""}`.trim();
        const displayName = thaiName || "ไม่ระบุชื่อ";
        const username = user.username ? ` | username: ${user.username}` : "";
        contextLines.push(
          `- ${displayName} (UserID: ${user.UserID})${username}`
        );
      }
    }

    contextLines.push(
      'หลังจากยืนยันโรงเรียนแล้ว ให้ตอบกลับผู้ใช้ว่า "โรงเรียนที่พบเจอปัญหาคือ: [ชื่อโรงเรียน]" และแจ้งผลการค้นหา ก่อนถามต่อว่า "ผู้ขายที่พบปัญหาคือใครคะ?" หากทราบรหัสผู้ใช้ให้ระบุด้วย'
    );
    contextLines.push(
      "เมื่อได้รับคำตอบเกี่ยวกับผู้ขายแล้ว ให้จดจำ UserID เป็นทั้ง sID และ sID2 (ค่าเดียวกัน) เพื่อใช้ในขั้นตอนถัดไป"
    );

    return contextLines.join("\n");
  } catch (error) {
    console.error("Gemini Cancel Sales User Lookup Failed", error);
    contextLines.push(
      "การค้นหารายชื่อผู้ใช้ล้มเหลว ให้บอกผู้ใช้ว่าต้องการชื่อและนามสกุล หรือรหัสผู้ใช้เพื่อค้นหาอีกครั้ง"
    );
    return contextLines.join("\n");
  }
};

//** เรียก Gemini สนทนา AI สำหรับ workflow ยกเลิกรายการขาย
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
    const origin = request.nextUrl.origin;
    const logPrefix = "[Gemini Cancel Sales]";
    console.info(
      `${logPrefix} Incoming request`,
      JSON.stringify({ messageCount: chatMessages.length }, null, 2)
    );
    const latestUserMessage = [...chatMessages]
      .reverse()
      .find((message) => message.role === "user")?.content;

    const extractedInfo = augmentInfoFromConversation(
      chatMessages,
      extractInfoFromMessages(chatMessages)
    );

    const schoolSearchTerms: Array<string | undefined> = [
      extractedInfo.schoolName,
      extractedInfo.schoolNameEN,
      extractedInfo.schoolId,
      latestUserMessage,
    ];

    let schoolMatch: SchoolMatch | null = null;
    const seenTerms = new Set<string>();
    for (const term of schoolSearchTerms) {
      if (!term) continue;
      const key = term.trim().toLowerCase();
      if (!key || seenTerms.has(key)) continue;
      seenTerms.add(key);

      schoolMatch = await matchSchool(origin, term);
      if (schoolMatch?.schoolId) {
        extractedInfo.schoolId = schoolMatch.schoolId;
        extractedInfo.schoolName = schoolMatch.schoolName;
        extractedInfo.schoolNameEN = schoolMatch.schoolNameEN;
        break;
      }
    }

    console.info(
      `${logPrefix} Extracted info after school/user matching`,
      JSON.stringify(
        {
          schoolId: extractedInfo.schoolId,
          schoolName: extractedInfo.schoolName,
          sellerUserId: extractedInfo.sellerUserId,
          sSellId: extractedInfo.sSellId,
        },
        null,
        2
      )
    );

    let buyerMatch: UserMatch | null = null;
    let sellerMatch: UserMatch | null = null;
    if (extractedInfo.schoolId) {
      if (
        extractedInfo.sellerName ||
        extractedInfo.sellerLastName ||
        extractedInfo.sellerUserId
      ) {
        sellerMatch = await matchUserByName(
          origin,
          extractedInfo.schoolId,
          extractedInfo.sellerName,
          extractedInfo.sellerLastName,
          extractedInfo.sellerUserId
        );
        if (sellerMatch?.userId) {
          extractedInfo.sellerUserId = sellerMatch.userId;
          extractedInfo.sellerName = sellerMatch.name;
          extractedInfo.sellerLastName = sellerMatch.lastName;
        }
      }
    }

    if (extractedInfo.sellerUserId) {
      extractedInfo.buyerUserId = extractedInfo.sellerUserId;
      if (!extractedInfo.buyerName && extractedInfo.sellerName) {
        extractedInfo.buyerName = extractedInfo.sellerName;
      }
      if (!extractedInfo.buyerLastName && extractedInfo.sellerLastName) {
        extractedInfo.buyerLastName = extractedInfo.sellerLastName;
      }
      buyerMatch = sellerMatch;
    }

    const preparedCancellationPayload =
      extractedInfo.schoolId &&
      extractedInfo.sellerUserId &&
      extractedInfo.sSellId
        ? {
            SchoolID: extractedInfo.schoolId,
            sID: extractedInfo.sellerUserId,
            sID2: extractedInfo.sellerUserId,
            sSellID: extractedInfo.sSellId,
          }
        : null;

    if (!preparedCancellationPayload) {
      console.warn(
        `${logPrefix} Missing cancellation payload data`,
        JSON.stringify(
          {
            schoolId: extractedInfo.schoolId,
            sellerUserId: extractedInfo.sellerUserId,
            sSellId: extractedInfo.sSellId,
          },
          null,
          2
        )
      );
    }

    let cancelSalesResult: CancelSalesResultMeta | null = null;
    const hasCancellationPayload = Boolean(preparedCancellationPayload);
    const shouldSubmitCancellation =
      hasCancellationPayload &&
      latestUserMessage &&
      isConfirmationMessage(latestUserMessage);

    console.info(
      `${logPrefix} Submission check`,
      JSON.stringify(
        {
          hasPayload: hasCancellationPayload,
          shouldSubmit: shouldSubmitCancellation,
          latestUserMessage,
        },
        null,
        2
      )
    );

    if (shouldSubmitCancellation && preparedCancellationPayload) {
      console.info(
        `${logPrefix} Calling cancel-sales API`,
        JSON.stringify(preparedCancellationPayload, null, 2)
      );
      try {
        const cancellationResponse = await axios.post(
          `${origin}/api/v1/support/cancle-sales`,
          preparedCancellationPayload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        cancelSalesResult = {
          status: "success",
          data: cancellationResponse.data,
        };
        console.info(
          `${logPrefix} Cancel-sales API success`,
          JSON.stringify(cancellationResponse.data, null, 2)
        );
      } catch (error) {
        let message = "ไม่ทราบสาเหตุ";
        let data: unknown = undefined;
        if (axios.isAxiosError(error)) {
          message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            message;
          data = error.response?.data;
        } else if (error instanceof Error) {
          message = error.message;
        }

        console.error("Gemini Cancel Sales Submission Failed", {
          payload: preparedCancellationPayload,
          error,
        });

        cancelSalesResult = {
          status: "error",
          message,
          data,
        };
        console.error(
          `${logPrefix} Cancel-sales API error`,
          JSON.stringify(
            {
              message,
              data,
            },
            null,
            2
          )
        );
      }
    } else if (!shouldSubmitCancellation) {
      console.info(
        `${logPrefix} Skipping cancel-sales API call`,
        JSON.stringify(
          {
            reason: hasCancellationPayload
              ? "latest message not confirmation"
              : "payload incomplete",
          },
          null,
          2
        )
      );
    }

    const cancellationPayloadJson = preparedCancellationPayload
      ? JSON.stringify(preparedCancellationPayload, null, 2)
      : null;

    const cancelSalesResultJson =
      cancelSalesResult && cancelSalesResult.data !== undefined
        ? JSON.stringify(cancelSalesResult.data, null, 2)
        : null;

    const schoolSearchContext = await buildSchoolSearchContext(
      origin,
      latestUserMessage ?? ""
    );

    const userSearchContext = await buildUserSearchContext(origin, {
      schoolId: extractedInfo.schoolId,
      schoolName: extractedInfo.schoolName,
      schoolNameEN: extractedInfo.schoolNameEN,
    });

    const structuredContextParts: string[] = [];
    if (extractedInfo.schoolName || extractedInfo.schoolId) {
      structuredContextParts.push(
        `โรงเรียนที่ระบุ: ${
          extractedInfo.schoolName || extractedInfo.schoolNameEN || "ไม่ระบุ"
        } (SchoolID: ${extractedInfo.schoolId || "ไม่ทราบ"})`
      );
    }
    if (extractedInfo.sellerName || extractedInfo.sellerUserId) {
      structuredContextParts.push(
        `ผู้ขาย: ${
          (extractedInfo.sellerName || "ไม่ทราบ") +
          (extractedInfo.sellerLastName
            ? " " + extractedInfo.sellerLastName
            : "")
        } (UserID: ${extractedInfo.sellerUserId || "ไม่ทราบ"})`
      );
      structuredContextParts.push(
        `sID (รหัสสำหรับผู้ขาย): ${extractedInfo.sellerUserId || "ยังไม่ทราบ"}`
      );
      structuredContextParts.push(
        `sID2 (รหัสสำหรับผู้ขาย): ${extractedInfo.sellerUserId || "ยังไม่ทราบ"}`
      );
    }
    if (extractedInfo.sSellId) {
      structuredContextParts.push(
        `รหัสธุรกรรม (sSellID): ${extractedInfo.sSellId}`
      );
    }
    if (preparedCancellationPayload && cancellationPayloadJson) {
      structuredContextParts.push(
        [
          "cancellationPayload (ใช้ส่งไปยัง /api/v1/support/cancle-sales):",
          "```json",
          cancellationPayloadJson,
          "```",
        ].join("\n")
      );
    }
    if (cancelSalesResult) {
      if (cancelSalesResult.status === "success" && cancelSalesResultJson) {
        structuredContextParts.push(
          [
            "ผลลัพธ์จาก API ยกเลิกการขาย:",
            "```json",
            cancelSalesResultJson,
            "```",
          ].join("\n")
        );
      } else {
        const errorLines = [
          "ข้อผิดพลาดจาก API ยกเลิกการขาย:",
          `- สาเหตุ: ${cancelSalesResult.message || "ไม่ทราบ"}`,
        ];
        if (cancelSalesResult.data) {
          errorLines.push("```json");
          errorLines.push(JSON.stringify(cancelSalesResult.data, null, 2));
          errorLines.push("```");
        }
        structuredContextParts.push(errorLines.join("\n"));
      }
    }

    const structuredContextText = structuredContextParts.length
      ? [
          "ข้อมูลที่ระบุจากการสนทนาปัจจุบัน (พร้อมผลการค้นหาที่ตรงกัน):",
          ...structuredContextParts,
        ].join("\n")
      : "";

    const cancelSalesInstruction =
      cancelSalesResult &&
      preparedCancellationPayload &&
      cancellationPayloadJson
        ? (() => {
            if (cancelSalesResult.status === "success") {
              const lines = [
                "ให้แจ้งผู้ใช้ว่าดำเนินการยกเลิกรายการสำเร็จ",
                "แสดง JSON payload ด้วยรูปแบบด้านล่าง (ห้ามแก้ key และต้องใช้ค่าจริง):",
                "```json",
                cancellationPayloadJson,
                "```",
              ];
              if (cancelSalesResultJson) {
                lines.push("แสดงผลลัพธ์จาก API ตามนี้:");
                lines.push("```json");
                lines.push(cancelSalesResultJson);
                lines.push("```");
              }
              lines.push("เตือนผู้ใช้ให้ตรวจสอบสถานะในระบบอีกครั้ง");
              return lines.join("\n");
            }

            const errorLines = [
              "แจ้งผู้ใช้ว่าการส่งคำสั่งยกเลิกล้มเหลว",
              "แสดง JSON payload ที่ใช้เรียก API เพื่อให้ตรวจสอบ:",
              "```json",
              cancellationPayloadJson,
              "```",
              `สาเหตุที่ได้รับ: ${cancelSalesResult.message || "ไม่ทราบ"}`,
            ];
            if (cancelSalesResult.data) {
              errorLines.push("รายละเอียดเพิ่มเติมจาก API:");
              errorLines.push("```json");
              errorLines.push(JSON.stringify(cancelSalesResult.data, null, 2));
              errorLines.push("```");
            }
            errorLines.push(
              "แนะนำให้ตรวจสอบข้อมูลและลองใหม่ หรือส่งต่อให้ทีมที่เกี่ยวข้อง"
            );
            return errorLines.join("\n");
          })()
        : "";

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
        parts: [
          { text: QA_CANCEL_SALES_CHAT_PROMPT },
          ...(schoolSearchContext ? [{ text: schoolSearchContext }] : []),
          ...(userSearchContext ? [{ text: userSearchContext }] : []),
          ...(structuredContextText ? [{ text: structuredContextText }] : []),
          ...(cancelSalesInstruction ? [{ text: cancelSalesInstruction }] : []),
        ],
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
        const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20_000);

        const geminiResponse = await axios.post(
          requestUrl,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            timeout: timeoutMs,
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
          console.error("Gemini Cancel Sales Empty Response", {
            model: modelName,
            data: geminiResponse.data,
          });
        } else {
          lastErrorMessage =
            typeof geminiResponse.data === "string"
              ? geminiResponse.data
              : JSON.stringify(geminiResponse.data);
          console.error("Gemini Cancel Sales Error Response", {
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
        console.error("Gemini Cancel Sales Request Failed", {
          model: modelName,
          error,
        });
      }
    }

    if (!replyText) {
      const timeoutHint =
        lastErrorMessage && /timeout|exceeded/i.test(lastErrorMessage)
          ? " (Timeout - ลองอีกครั้งหรือยืนยันว่าคีย์ GEMINI พร้อมใช้งาน)"
          : "";
      console.error(
        `${logPrefix} No reply from Gemini`,
        JSON.stringify({ lastErrorMessage }, null, 2)
      );
      return NextResponse.json(
        errorResponse({
          status: 502,
          message_en:
            lastErrorMessage || "All Gemini cancel-sales candidates failed",
          message_th: `ไม่สามารถรับคำตอบจาก Gemini ได้${timeoutHint}`,
        }),
        { status: 502 }
      );
    }

    console.info(
      `${logPrefix} Reply prepared`,
      JSON.stringify(
        {
          cancelSalesTriggered: Boolean(cancelSalesResult),
        },
        null,
        2
      )
    );

    return NextResponse.json(
      successResponse({
        data: {
          reply: replyText,
          meta: {
            extraction: extractedInfo,
            schoolMatch,
            buyerMatch,
            sellerMatch,
            cancellationPayload: preparedCancellationPayload,
            cancelSalesResult,
            cancelSalesTriggered: Boolean(cancelSalesResult),
          },
        },
        message_en: "Gemini cancel-sales chat replied",
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
