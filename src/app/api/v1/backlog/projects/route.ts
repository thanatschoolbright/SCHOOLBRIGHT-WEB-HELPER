import { errorResponse, successResponse } from "@/helpers/api/response";
import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

interface BacklogProject {
  archived: boolean;
  chartEnabled: boolean;
  displayOrder: number;
  id: number;
  name: string;
  projectKey: string;
  subtaskingEnabled: boolean;
  textFormattingRule: string;
  [additionalKey: string]: unknown;
}

type BacklogApiSuccess = BacklogProject[];
type NormalizedAxiosError = {
  detail: unknown;
  messageEnglish: string;
  messageThai: string;
  statusCode: number;
};

const BACKLOG_API_PATH = "/api/v2/projects";
const DEFAULT_BACKLOG_DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

//** ดึงรายการ Projects ทั้งหมดจาก Backlog โดยรองรับการเลือกโดเมนอัตโนมัติ
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const apiKey = process.env.BACKLOG_API_KEY ?? requestUrl.searchParams.get("apiKey") ?? undefined;

    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "BACKLOG_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
        }),
        { status: 500 }
      );
    }

    const backlogSpace = requestUrl.searchParams.get("space") ?? request.cookies.get("backlog_space")?.value;

    if (!backlogSpace) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space parameter",
          message_th: "กรุณาระบุ space (subdomain)",
        }),
        { status: 400 }
      );
    }

    const backlogHostOverride =
      requestUrl.searchParams.get("host") ??
      request.cookies.get("backlog_host")?.value ??
      process.env.BACKLOG_SPACE_HOST ??
      undefined;

    const backlogDomainOverrides = buildDomainOverrideList(
      requestUrl.searchParams.getAll("domain"),
      process.env.BACKLOG_DOMAINS
    );

    const backlogBaseUrls = buildBacklogBaseUrls(backlogSpace, backlogHostOverride, backlogDomainOverrides);

    const backlogProjects = await fetchBacklogProjects(backlogBaseUrls, apiKey);

    return NextResponse.json(
      successResponse({
        data: backlogProjects,
        message_en: "Fetch Backlog projects successfully",
        message_th: "ดึงข้อมูลโครงการจาก Backlog สำเร็จ",
      })
    );
  } catch (unknownError) {
    const normalizedError = normalizeAxiosError(unknownError);

    return NextResponse.json(
      errorResponse({
        status: normalizedError.statusCode,
        message_en: normalizedError.messageEnglish,
        message_th: normalizedError.messageThai,
        error: normalizedError.detail,
      }),
      { status: normalizedError.statusCode }
    );
  }
}

//** สร้างรายการโดเมนสำรองเพื่อค้นหาโดเมนที่ใช้งานได้จริง
function buildDomainOverrideList(domainParameters: string[], environmentDomains?: string): string[] {
  const domainCandidates = [...domainParameters];

  if (environmentDomains) {
    environmentDomains
      .split(",")
      .map((domainItem) => domainItem.trim())
      .filter((domainItem) => domainItem.length > 0)
      .forEach((domainItem) => domainCandidates.push(domainItem));
  }

  if (domainCandidates.length === 0) {
    return [...DEFAULT_BACKLOG_DOMAINS];
  }

  return Array.from(new Set(domainCandidates));
}

//** ประกอบ URL พื้นฐานของ Backlog ตาม space และโดเมนที่ใช้งานได้
function buildBacklogBaseUrls(backlogSpace: string, backlogHostOverride: string | undefined, backlogDomainOverrides: string[]): string[] {
  if (backlogHostOverride) {
    return [`https://${sanitizeHost(backlogHostOverride)}`];
  }

  return backlogDomainOverrides.map((domainItem) => {
    const sanitizedDomainItem = sanitizeHost(domainItem);
    return `https://${backlogSpace}.${sanitizedDomainItem}`;
  });
}

//** เรียกข้อมูลโครงการจาก Backlog พร้อมวนตามลำดับโดเมนสำรอง
async function fetchBacklogProjects(backlogBaseUrls: string[], apiKey: string): Promise<BacklogApiSuccess> {
  let lastError: unknown;

  for (const backlogBaseUrl of backlogBaseUrls) {
    try {
      const response = await axios.get<BacklogApiSuccess>(`${backlogBaseUrl}${BACKLOG_API_PATH}`, {
        params: { apiKey },
      });

      return response.data;
    } catch (requestError) {
      lastError = requestError;
    }
  }

  throw lastError ?? new Error("Unable to reach Backlog API");
}

//** ทำความสะอาดข้อมูล host หรือโดเมนให้ใช้งานได้อย่างปลอดภัย
function sanitizeHost(rawHost: string): string {
  return rawHost.replace(/^https?:\/\//u, "").replace(/\/+$/u, "");
}

//** แปลงข้อผิดพลาดจาก Axios ให้อ่านง่ายและแจ้งผู้ใช้เป็นภาษาไทยได้
function normalizeAxiosError(rawError: unknown): NormalizedAxiosError {
  if (isAxiosErrorWithMeta(rawError)) {
    const statusCode = rawError.response?.status ?? mapAxiosCodeToStatus(rawError.code);
    const messageEnglish = rawError.response?.data?.message ?? rawError.message ?? "Fetch projects failed";

    if (rawError.code === "ENOTFOUND") {
      return {
        detail: {
          code: rawError.code,
          host: rawError.config?.url,
        },
        messageEnglish: "Backlog space domain could not be resolved",
        messageThai: "ไม่พบโดเมนของ Backlog โปรดตรวจสอบ space หรือโดเมนที่ตั้งค่า",
        statusCode,
      };
    }

    return {
      detail: rawError.toJSON?.() ?? rawError,
      messageEnglish,
      messageThai: "ดึงข้อมูลโครงการจาก Backlog ไม่สำเร็จ",
      statusCode,
    };
  }

  const fallbackMessage = rawError instanceof Error ? rawError.message : "Fetch projects failed";

  return {
    detail: rawError,
    messageEnglish: fallbackMessage,
    messageThai: "ดึงข้อมูลโครงการจาก Backlog ไม่สำเร็จ",
    statusCode: 500,
  };
}

//** ตรวจสอบว่าเป็น AxiosError ที่แนบข้อมูลเมตาไว้ครบถ้วน
function isAxiosErrorWithMeta(error: unknown): error is AxiosError<{ message?: string }> {
  return axios.isAxiosError(error);
}

//** กำหนดค่า HTTP Status ที่เหมาะสมจากรหัสข้อผิดพลาดของ Axios
function mapAxiosCodeToStatus(errorCode?: string) {
  if (errorCode === "ENOTFOUND") return 404;
  if (errorCode === "ECONNREFUSED" || errorCode === "ECONNRESET") return 502;
  if (errorCode === "ETIMEDOUT") return 504;
  return 500;
}
