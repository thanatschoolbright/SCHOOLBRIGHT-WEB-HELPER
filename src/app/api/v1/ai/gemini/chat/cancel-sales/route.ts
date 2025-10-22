//** ไฟล์ API สำหรับจัดการการสนทนา AI เพื่อยกเลิกรายการขายเกิน 7 วัน
//** โดยใช้ Gemini AI ในการประมวลผลและโต้ตอบกับผู้ใช้
import axios from "axios"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { QA_CANCEL_SALES_CHAT_PROMPT } from "src/constants/prompts";
import { errorResponse, successResponse } from "src/helpers/api/response";
import {
  matchSchool,
  matchUserByName,
  type SchoolMatch,
  type UserMatch,
} from "./matcher";

//** สร้าง URL สำหรับเรียกใช้งาน Gemini REST API v1 สำหรับฟีเจอร์สนทนา Cancel Sales
const buildGeminiChatUrl = (modelName: string): string =>
  `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent`;

//** Schema สำหรับตรวจสอบโครงสร้างของข้อความที่ส่งเข้ามาใน API
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

//** แปลงข้อความเป็นรูปแบบปกติ (ตัวพิมพ์เล็ก, ลบคำว่า "โรงเรียน", ลบช่องว่าง)
const normalizeText = (value?: string): string =>
  (value || "")
    .toLowerCase()
    .replace(/โรงเรียน/g, "")
    .replace(/\s+/g, "")
    .trim();

//** ตรวจสอบว่าข้อความเป็นข้อความยืนยันหรือไม่
const isConfirmationMessage = (message: string): boolean => {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) return false;
  return /(ยืนยัน|ตกลง|confirm|คอนเฟิร์ม|ใช่ค่ะ|ใช่ครับ|yes|ตกลงค่ะ|ตกลงครับ)/i.test(
    normalizedMessage
  );
};

//** ล้างค่าที่ดึงมาได้จากข้อความ (ลบอักขระพิเศษและรหัสที่ไม่เกี่ยวข้อง)
const sanitizeCapturedValue = (value: string): string =>
  value
    .replace(/[*_`]/g, "")
    .replace(/\(\s*รหัส[^)]*\)/gi, "")
    .replace(/\(SchoolID[^)]*\)/gi, "")
    .trim();

//** ดึงข้อความสถานะจากผลลัพธ์ API
const extractApiStatusText = (
  result: CancelSalesResultMeta | null
): string | null => {
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

//** Interface สำหรับข้อมูลบริบทของโรงเรียน
interface SchoolContextHint {
  schoolId?: string;
  schoolName?: string;
  schoolNameEN?: string;
}

//** Interface สำหรับข้อมูลที่ดึงมาจากข้อความสนทนา
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

//** Interface สำหรับผลลัพธ์จากการยกเลิกการขาย
interface CancelSalesResultMeta {
  status: "success" | "error";
  data?: unknown;
  message?: string;
}

//** Type สำหรับฟิลด์ที่กำลังรอข้อมูล
type PendingField = "school" | "seller" | "transaction" | null;

//** ดึงข้อมูลจากข้อความสนทนาของผู้ใช้
//** ฟังก์ชันนี้จะวิเคราะห์ข้อความที่ผู้ใช้ป้อนเข้ามาเพื่อดึงข้อมูลสำคัญ เช่น SchoolID, ชื่อโรงเรียน, UserID ของผู้ซื้อ/ผู้ขาย และ sSellID
const extractInfoFromMessages = (
  messages: Array<{ role: string; content: string }>
): ExtractedInfo => {
  const extractedInformation: ExtractedInfo = {};
  let currentRole: "buyer" | "seller" | "" = "";
  let pendingField: "buyerUserId" | "sellerUserId" | "sSellId" | null = null;

  const userMessageLines = messages
    .filter((message) => message.role === "user")
    .flatMap((message) => message.content.split(/\n+/));

  for (const originalLine of userMessageLines) {
    if (!originalLine) continue;
    const processedLine = originalLine.trim().replace(/^[-•\*]+\s*/, "");
    if (!processedLine) continue;
    const lowerCaseLine = processedLine.toLowerCase();

    //** ตรวจสอบบทบาทของผู้ใช้ (ผู้ซื้อหรือผู้ขาย)
    if (/(ผู้ซื้อ|buyer)/i.test(lowerCaseLine)) {
      currentRole = "buyer";
    } else if (/(ผู้ขาย|seller)/i.test(lowerCaseLine)) {
      currentRole = "seller";
    }

    //** ดึง SchoolID
    const schoolIdMatch = processedLine.match(
      /school[_\s-]*id\s*[:：]?\s*(\d+)/i
    );
    if (schoolIdMatch) {
      extractedInformation.schoolId = schoolIdMatch[1];
    }

    //** ดึงชื่อโรงเรียน (ไทยหรืออังกฤษ)
    if (/ชื่อโรงเรียน/.test(lowerCaseLine)) {
      const value = processedLine.split(/[:：]/)[1]?.trim();
      if (value) {
        if (/อังกฤษ|english|schoolnameen/.test(lowerCaseLine)) {
          extractedInformation.schoolNameEN = value;
        } else {
          extractedInformation.schoolName = value;
        }
      }
    }

    //** ดึง sSellID
    const sSellIdMatch =
      processedLine.match(/sSellID\s*[:：]?\s*([\w-]+)/i) ||
      processedLine.match(
        /รหัส\s*ทราน(ซ|ส)เ?คชั?น[\s\-]*การซื้อขาย\s*[:：]?\s*([\w-]+)/i
      );
    if (sSellIdMatch) {
      const value = (sSellIdMatch[1] ?? sSellIdMatch[2] ?? "")
        .trim()
        .replace(/^[-\s]+/, "");
      if (value) {
        extractedInformation.sSellId = value;
        pendingField = null;
      } else {
        pendingField = "sSellId";
      }
      continue;
    }

    //** ดึง UserID
    const userIdMatch = processedLine.match(
      /user[_\s-]*id[^:：]*[:：]?\s*(.+)?/i
    );
    if (userIdMatch) {
      const rawValue = userIdMatch[1]?.replace(/^[–\-]\s*/, "").trim();
      const targetField: keyof ExtractedInfo =
        currentRole === "seller" ? "sellerUserId" : "buyerUserId";
      if (rawValue && /^[0-9]+$/.test(rawValue)) {
        extractedInformation[targetField] = rawValue;
        pendingField = null;
      } else {
        pendingField = targetField;
      }
      continue;
    }

    //** จัดการฟิลด์ที่รอดำเนินการ
    if (pendingField) {
      const value = processedLine.replace(/^[–\-]\s*/, "").trim();
      if (value && value !== "—" && !/ไม่มี|not\s*required/i.test(value)) {
        extractedInformation[pendingField as keyof ExtractedInfo] = value;
      }
      pendingField = null;
    }

    //** ดึงชื่อ
    const nameMatch = processedLine.match(
      /ชื่อ(?!โรงเรียน)[^:：]*[:：]\s*(.+)/i
    );
    if (nameMatch) {
      const value = nameMatch[1].trim();
      if (value && value !== "—") {
        if (currentRole === "seller") {
          extractedInformation.sellerName = value;
        } else {
          extractedInformation.buyerName = value;
        }
      }
    }

    //** ดึงนามสกุล
    const lastNameMatch = processedLine.match(/นามสกุล[^:：]*[:：]\s*(.+)/i);
    if (lastNameMatch) {
      const value = lastNameMatch[1].trim();
      if (value && value !== "—") {
        if (currentRole === "seller") {
          extractedInformation.sellerLastName = value;
        } else {
          extractedInformation.buyerLastName = value;
        }
      }
      continue;
    }

    //** จัดการ sSellID ที่รอดำเนินการ
    if (pendingField === "sSellId") {
      const value = processedLine.replace(/^[–\-]\s*/, "").trim();
      if (value && value !== "—" && !/ไม่มี/.test(value)) {
        extractedInformation.sSellId = value;
      }
      pendingField = null;
    }
  }

  return extractedInformation;
};

//** เพิ่มข้อมูลที่ดึงมาได้จากบทสนทนา
//** ฟังก์ชันนี้จะช่วยเสริมข้อมูลที่ดึงมาได้จาก extractInfoFromMessages โดยพิจารณาจากบทสนทนาทั้งหมด
const augmentInfoFromConversation = (
  messages: Array<{ role: string; content: string }>,
  extractedInformation: ExtractedInfo
): ExtractedInfo => {
  let pendingField: PendingField = null;

  for (const message of messages) {
    const messageContent = message.content?.trim();
    if (!messageContent) continue;
    const lines = messageContent
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    if (message.role === "assistant") {
      const lowerCaseContent = messageContent.toLowerCase();
      if (
        /โรงเรียน/.test(lowerCaseContent) &&
        /(อะไร|แจ้ง)/.test(lowerCaseContent)
      ) {
        pendingField = "school";
      }
      if (
        /ผู้ขาย/.test(lowerCaseContent) &&
        /(ใคร|คือ)/.test(lowerCaseContent)
      ) {
        pendingField = "seller";
      }
      if (
        /ssellid/i.test(messageContent) ||
        /รหัส\s*(ธุรกรรม|ทราน|transaction)/i.test(lowerCaseContent)
      ) {
        pendingField = "transaction";
      }

      for (const line of lines) {
        const schoolIdMatch = line.match(/school[_\s-]*id\s*[:：]?\s*(\d+)/i);
        if (schoolIdMatch && !extractedInformation.schoolId) {
          extractedInformation.schoolId = schoolIdMatch[1];
        }
        const sellerIdMatch = line.match(/\bUserID\b[^\d]*(\d+)/i);
        if (sellerIdMatch && !extractedInformation.sellerUserId) {
          extractedInformation.sellerUserId = sellerIdMatch[1];
        }
        if (
          /user\s*id\s*\(sID\/sID2\)/i.test(line) &&
          !extractedInformation.sellerUserId
        ) {
          const digits = line.match(/(\d{3,})/);
          if (digits) extractedInformation.sellerUserId = digits[1];
        }
        if (
          /โรงเรียนที่พบเจอปัญหาคือ/i.test(line) &&
          !extractedInformation.schoolName
        ) {
          const nameMatch = line.match(
            /โรงเรียนที่พบเจอปัญหาคือ:\s*[*_]*([^\n]+)/i
          );
          if (nameMatch) {
            extractedInformation.schoolName = sanitizeCapturedValue(
              nameMatch[1]
            );
          }
        }
      }
      continue;
    }

    if (message.role !== "user") continue;

    for (const line of lines) {
      const userIdMatch = line.match(/user[_\s-]*id\s*[:：]?\s*(\d+)/i);
      if (userIdMatch && !extractedInformation.sellerUserId) {
        extractedInformation.sellerUserId = userIdMatch[1];
      }

      const schoolIdMatch = line.match(/school[_\s-]*id\s*[:：]?\s*(\d+)/i);
      if (schoolIdMatch && !extractedInformation.schoolId) {
        extractedInformation.schoolId = schoolIdMatch[1];
      }

      if (pendingField === "school" && !extractedInformation.schoolName) {
        extractedInformation.schoolName = sanitizeCapturedValue(line);
        pendingField = null;
        continue;
      }

      if (pendingField === "seller") {
        if (!extractedInformation.sellerName) {
          extractedInformation.sellerName = sanitizeCapturedValue(
            line.replace(/\(.*?\)/g, "")
          );
        }
        if (!extractedInformation.sellerUserId) {
          const digits = line.match(/(\d{3,})/);
          if (digits) extractedInformation.sellerUserId = digits[1];
        }
        pendingField = null;
        continue;
      }

      if (pendingField === "transaction" && !extractedInformation.sSellId) {
        const transactionId = line.match(/[A-Za-z0-9_-]+/);
        if (transactionId) extractedInformation.sSellId = transactionId[0];
        pendingField = null;
        continue;
      }

      if (!extractedInformation.sSellId) {
        const transactionInline = line.match(/ssellid\s*[:：]?\s*([\w-]+)/i);
        if (transactionInline)
          extractedInformation.sSellId = transactionInline[1];
      }
    }
  }

  return extractedInformation;
};

//** สร้างบริบทสำหรับการค้นหาโรงเรียน
//** ฟังก์ชันนี้จะใช้ข้อความล่าสุดของผู้ใช้ในการค้นหาโรงเรียนที่เกี่ยวข้องจาก API
//** และสร้างบริบทสำหรับ Gemini AI เพื่อช่วยในการโต้ตอบ
const buildSchoolSearchContext = async (
  requestOrigin: string,
  latestUserMessage: string
): Promise<string> => {
  const baseInstruction =
    'เริ่มสนทนาทุกครั้งด้วยคำถาม "โรงเรียนที่พบเจอปัญหาคืออะไรคะ?" และแจ้งผู้ใช้ว่าจะตรวจสอบ SchoolID ผ่าน API /api/v1/school ก่อนถามข้อมูลผู้ขาย';

  if (!latestUserMessage) return baseInstruction;

  const hasSchoolKeyword = /โรงเรียน|school/i.test(latestUserMessage);
  if (!hasSchoolKeyword) return baseInstruction;

  const contextLines = [baseInstruction];

  try {
    const schoolResponse = await axios.get(`${requestOrigin}/api/v1/school`);
    const schools: Array<{
      SchoolID: number | string;
      SchoolName: string;
      SchoolNameEN: string;
    }> = schoolResponse.data?.data ?? [];

    const normalizedMessage = normalizeText(latestUserMessage);
    const matchedSchools = schools
      .map((school) => {
        const normalizedName = normalizeText(school.SchoolName);
        const normalizedEnglishName = normalizeText(school.SchoolNameEN);

        let score = 0;
        if (
          normalizedMessage === normalizedName ||
          (normalizedEnglishName && normalizedMessage === normalizedEnglishName)
        ) {
          score = 3;
        } else if (
          (normalizedName && normalizedMessage.includes(normalizedName)) ||
          (normalizedEnglishName &&
            normalizedMessage.includes(normalizedEnglishName))
        ) {
          score = 2;
        } else if (
          (normalizedName && normalizedName.includes(normalizedMessage)) ||
          (normalizedEnglishName &&
            normalizedEnglishName.includes(normalizedMessage))
        ) {
          score = 1;
        }

        return { school, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.school);

    if (!matchedSchools.length) {
      contextLines.push(
        "ยังไม่พบโรงเรียนที่ตรงกับข้อความล่าสุด ให้ขอชื่อโรงเรียนเพิ่มเติมหรือสะกดใหม่"
      );
      return contextLines.join("\n");
    }

    const [primarySchool, ...alternativeSchools] = matchedSchools;
    const primarySchoolThai = (primarySchool.SchoolName || "").trim();
    const primarySchoolEnglish = (primarySchool.SchoolNameEN || "").trim();
    const primarySchoolDisplay = primarySchoolEnglish
      ? `${primarySchoolThai} (${primarySchoolEnglish})`
      : primarySchoolThai;

    contextLines.push(
      `โรงเรียนที่ตรงกันมากที่สุด: ${primarySchoolDisplay} (SchoolID: ${primarySchool.SchoolID})`
    );

    if (alternativeSchools.length) {
      for (const school of alternativeSchools) {
        const thaiName = (school.SchoolName || "").trim();
        const englishName = (school.SchoolNameEN || "").trim();
        const displayName = englishName
          ? `${thaiName} (${englishName})`
          : thaiName;
        contextLines.push(
          `- ทางเลือกใกล้เคียง: ${displayName} (SchoolID: ${school.SchoolID})`
        );
      }
    }

    contextLines.push(
      `ให้ถามยืนยันว่า \"ต้องการยกเลิกรายการสินค้าเกิน 7 วันที่${primarySchoolThai} (รหัส : ${primarySchool.SchoolID}) ใช่หรือไม่คะ\" และเมื่อได้รับคำยืนยันให้จดจำ SchoolID นี้สำหรับขั้นตอนถัดไป`
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

//** สร้างบริบทสำหรับการค้นหาผู้ใช้
//** ฟังก์ชันนี้จะใช้ SchoolID ที่ได้มาเพื่อค้นหาผู้ใช้ที่เกี่ยวข้องจาก API
//** และสร้างบริบทสำหรับ Gemini AI เพื่อช่วยในการโต้ตอบ
const buildUserSearchContext = async (
  requestOrigin: string,
  schoolContext: SchoolContextHint
): Promise<string> => {
  if (!schoolContext.schoolId) return "";

  const schoolDisplayName = schoolContext.schoolName
    ? schoolContext.schoolName
    : schoolContext.schoolNameEN
    ? schoolContext.schoolNameEN
    : "โรงเรียนที่ระบุ";

  const contextLines = [
    `Progress: กำลังค้นหาชื่อผู้ใช้ที่โรงเรียน${schoolDisplayName} (รหัส : ${schoolContext.schoolId}) จาก API /api/v1/school/get-user`,
  ];

  try {
    const userResponse = await axios.get(
      `${requestOrigin}/api/v1/school/get-user?school_id=${schoolContext.schoolId}`
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

//** ฟังก์ชันสำหรับบันทึกข้อมูลลงในคอนโซลอย่างมีโครงสร้าง
const logStructuredInfo = (prefix: string, message: string, data: object) => {
  console.info(`${prefix} ${message}`, JSON.stringify(data, null, 2));
};

//** ฟังก์ชันสำหรับบันทึกข้อผิดพลาดลงในคอนโซลอย่างมีโครงสร้าง
const logStructuredError = (prefix: string, message: string, data: object) => {
  console.error(`${prefix} ${message}`, JSON.stringify(data, null, 2));
};

//** API Endpoint สำหรับจัดการการสนทนา AI เพื่อยกเลิกรายการขาย
//** ฟังก์ชันนี้เป็น Main Handler สำหรับ API route นี้
export async function POST(request: NextRequest) {
  const loggerPrefix = "[Gemini Cancel Sales]";
  try {
    const googleApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!googleApiKey) {
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
    const requestOrigin = request.nextUrl.origin;
    logStructuredInfo(loggerPrefix, "Incoming request", {
      messageCount: chatMessages.length,
    });
    const latestUserMessage = [...chatMessages]
      .reverse()
      .find((message) => message.role === "user")?.content;

    const extractedInformation = augmentInfoFromConversation(
      chatMessages,
      extractInfoFromMessages(chatMessages)
    );

    const schoolSearchTerms: Array<string | undefined> = [
      extractedInformation.schoolName,
      extractedInformation.schoolNameEN,
      extractedInformation.schoolId,
      latestUserMessage,
    ];

    let schoolMatchResult: SchoolMatch | null = null;
    const seenSearchTerms = new Set<string>();
    for (const searchTerm of schoolSearchTerms) {
      if (!searchTerm) continue;
      const key = searchTerm.trim().toLowerCase();
      if (!key || seenSearchTerms.has(key)) continue;
      seenSearchTerms.add(key);

      schoolMatchResult = await matchSchool(requestOrigin, searchTerm);
      if (schoolMatchResult?.schoolId) {
        extractedInformation.schoolId = schoolMatchResult.schoolId;
        extractedInformation.schoolName = schoolMatchResult.schoolName;
        extractedInformation.schoolNameEN = schoolMatchResult.schoolNameEN;
        break;
      }
    }

    logStructuredInfo(
      loggerPrefix,
      "Extracted information after school/user matching",
      {
        schoolId: extractedInformation.schoolId,
        schoolName: extractedInformation.schoolName,
        sellerUserId: extractedInformation.sellerUserId,
        sSellId: extractedInformation.sSellId,
      }
    );

    let buyerMatchResult: UserMatch | null = null;
    let sellerMatchResult: UserMatch | null = null;
    if (extractedInformation.schoolId) {
      if (
        extractedInformation.sellerName ||
        extractedInformation.sellerLastName ||
        extractedInformation.sellerUserId
      ) {
        sellerMatchResult = await matchUserByName(
          requestOrigin,
          extractedInformation.schoolId,
          extractedInformation.sellerName,
          extractedInformation.sellerLastName,
          extractedInformation.sellerUserId
        );
        if (sellerMatchResult?.userId) {
          extractedInformation.sellerUserId = sellerMatchResult.userId;
          extractedInformation.sellerName = sellerMatchResult.name;
          extractedInformation.sellerLastName = sellerMatchResult.lastName;
        }
      }
    }

    if (extractedInformation.sellerUserId) {
      extractedInformation.buyerUserId = extractedInformation.sellerUserId;
      if (!extractedInformation.buyerName && extractedInformation.sellerName) {
        extractedInformation.buyerName = extractedInformation.sellerName;
      }
      if (
        !extractedInformation.buyerLastName &&
        extractedInformation.sellerLastName
      ) {
        extractedInformation.buyerLastName =
          extractedInformation.sellerLastName;
      }
      buyerMatchResult = sellerMatchResult;
    }

    const preparedCancellationPayload =
      extractedInformation.schoolId &&
      extractedInformation.sellerUserId &&
      extractedInformation.sSellId
        ? {
            SchoolID: extractedInformation.schoolId,
            sID: extractedInformation.sellerUserId,
            sID2: extractedInformation.sellerUserId,
            sSellID: extractedInformation.sSellId,
          }
        : null;

    if (!preparedCancellationPayload) {
      console.warn(
        `${loggerPrefix} Missing cancellation payload data`,
        JSON.stringify(
          {
            schoolId: extractedInformation.schoolId,
            sellerUserId: extractedInformation.sellerUserId,
            sSellId: extractedInformation.sSellId,
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

    logStructuredInfo(loggerPrefix, "Submission check", {
      hasPayload: hasCancellationPayload,
      shouldSubmit: shouldSubmitCancellation,
      latestUserMessage,
    });

    if (shouldSubmitCancellation && preparedCancellationPayload) {
      logStructuredInfo(
        loggerPrefix,
        "Calling cancel-sales API",
        preparedCancellationPayload
      );
      try {
        const cancellationResponse = await axios.post(
          `${requestOrigin}/api/v1/support/cancle-sales`,
          preparedCancellationPayload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        cancelSalesResult = {
          status: "success",
          data: cancellationResponse.data,
        };
        logStructuredInfo(
          loggerPrefix,
          "Cancel-sales API success",
          cancellationResponse.data
        );
      } catch (error) {
        let errorMessage = "ไม่ทราบสาเหตุ";
        let errorData: unknown = undefined;
        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            errorMessage;
          errorData = error.response?.data;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        console.error("Gemini Cancel Sales Submission Failed", {
          payload: preparedCancellationPayload,
          error,
        });

        cancelSalesResult = {
          status: "error",
          message: errorMessage,
          data: errorData,
        };
        logStructuredError(loggerPrefix, "Cancel-sales API error", {
          message: errorMessage,
          data: errorData,
        });
      }
    } else if (!shouldSubmitCancellation) {
      logStructuredInfo(loggerPrefix, "Skipping cancel-sales API call", {
        reason: hasCancellationPayload
          ? "latest message not confirmation"
          : "payload incomplete",
      });
    }

    const cancellationPayloadJson = preparedCancellationPayload
      ? JSON.stringify(preparedCancellationPayload, null, 2)
      : null;

    const cancelSalesResultJson =
      cancelSalesResult && cancelSalesResult.data !== undefined
        ? JSON.stringify(cancelSalesResult.data, null, 2)
        : null;

    const schoolSearchContext = await buildSchoolSearchContext(
      requestOrigin,
      latestUserMessage ?? ""
    );

    const userSearchContext = await buildUserSearchContext(requestOrigin, {
      schoolId: extractedInformation.schoolId,
      schoolName: extractedInformation.schoolName,
      schoolNameEN: extractedInformation.schoolNameEN,
    });

    const structuredContextParts: string[] = [];
    if (extractedInformation.schoolName || extractedInformation.schoolId) {
      structuredContextParts.push(
        `โรงเรียนที่ระบุ: ${
          extractedInformation.schoolName ||
          extractedInformation.schoolNameEN ||
          "ไม่ระบุ"
        } (SchoolID: ${extractedInformation.schoolId || "ไม่ทราบ"})`
      );
    }
    if (extractedInformation.sellerName || extractedInformation.sellerUserId) {
      structuredContextParts.push(
        `ผู้ขาย: ${
          (extractedInformation.sellerName || "ไม่ทราบ") +
          (extractedInformation.sellerLastName
            ? " " + extractedInformation.sellerLastName
            : "")
        } (UserID: ${extractedInformation.sellerUserId || "ไม่ทราบ"})`
      );
      structuredContextParts.push(
        `sID (รหัสสำหรับผู้ขาย): ${
          extractedInformation.sellerUserId || "ยังไม่ทราบ"
        }`
      );
      structuredContextParts.push(
        `sID2 (รหัสสำหรับผู้ขาย): ${
          extractedInformation.sellerUserId || "ยังไม่ทราบ"
        }`
      );
    }
    if (extractedInformation.sSellId) {
      structuredContextParts.push(
        `รหัสธุรกรรม (sSellID): ${extractedInformation.sSellId}`
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
      if (cancelSalesResult.status === "success" && cancellationPayloadJson) {
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
        const requestUrl = `${buildGeminiChatUrl(
          modelName
        )}?key=${googleApiKey}`;
        const timeoutMilliseconds = Number(
          process.env.GEMINI_TIMEOUT_MS ?? 20_000
        );

        const geminiResponse = await axios.post(
          requestUrl,
          { contents },
          {
            headers: { "Content-Type": "application/json" },
            timeout: timeoutMilliseconds,
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
          logStructuredError(
            loggerPrefix,
            "Gemini Cancel Sales Empty Response",
            {
              model: modelName,
              data: geminiResponse.data,
            }
          );
        } else {
          lastErrorMessage =
            typeof geminiResponse.data === "string"
              ? geminiResponse.data
              : JSON.stringify(geminiResponse.data);
          logStructuredError(
            loggerPrefix,
            "Gemini Cancel Sales Error Response",
            {
              model: modelName,
              status: geminiResponse.status,
              data: geminiResponse.data,
            }
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String((error as Error).message)
            : String(error);
        lastErrorMessage = errorMessage;
        logStructuredError(loggerPrefix, "Gemini Cancel Sales Request Failed", {
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
      logStructuredError(loggerPrefix, "No reply from Gemini", {
        lastErrorMessage,
      });
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

    logStructuredInfo(loggerPrefix, "Reply prepared", {
      cancelSalesTriggered: Boolean(cancelSalesResult),
    });

    return NextResponse.json(
      successResponse({
        data: {
          reply: replyText,
          meta: {
            extraction: extractedInformation,
            schoolMatch: schoolMatchResult,
            buyerMatch: buyerMatchResult,
            sellerMatch: sellerMatchResult,
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
