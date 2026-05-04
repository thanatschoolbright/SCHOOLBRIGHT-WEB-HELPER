import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import axios from "axios";

const BACKLOG_SPACE = process.env.BACKLOG_SPACE ?? "jabjai";
const BACKLOG_DOMAIN = process.env.BACKLOG_DOMAIN ?? "backlog.com";
const CLIENT_ID = process.env.BACKLOG_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.BACKLOG_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.BACKLOG_CRM_REDIRECT_URI ?? "";

export const BACKLOG_TOKEN_URL = `https://${BACKLOG_SPACE}.${BACKLOG_DOMAIN}/api/v2/oauth2/token`;
export const BACKLOG_AUTHORIZE_URL = `https://${BACKLOG_SPACE}.${BACKLOG_DOMAIN}/OAuth2AccessRequest.action`;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// ✨ แลก authorization_code เป็น access_token และ refresh_token จาก Backlog
export async function exchangeCodeForToken(
  code: string,
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  });

  const { data } = await axios.post<TokenResponse>(
    BACKLOG_TOKEN_URL,
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  return data;
}

// ✨ ต่ออายุ access_token ด้วย refresh_token ที่มีอยู่
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const { data } = await axios.post<TokenResponse>(
    BACKLOG_TOKEN_URL,
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  return data;
}

// ✨ บันทึกหรืออัปเดต token ของ user ลงใน crm_support_authentication
export async function upsertUserToken(
  userId: number,
  tokenData: TokenResponse,
) {
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  return (PrismaTimesheet as any).crmSupportAuthentication.upsert({
    where: { user_id: userId },
    update: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    },
    create: {
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    },
  });
}

// ✨ ดึง token ที่ยังใช้งานได้ของ user (auto-refresh ถ้าหมดอายุ)
export async function getValidTokenForUser(
  userId: number,
): Promise<string | null> {
  const record = await (
    PrismaTimesheet as any
  ).crmSupportAuthentication.findUnique({
    where: { user_id: userId },
  });

  if (!record) return null;

  // ถ้า token ยังไม่หมดอายุ (เผื่อเวลา 60 วินาที)
  const isExpired = new Date(record.expires_at).getTime() - Date.now() < 60_000;
  if (!isExpired) return record.access_token as string;

  // Token หมดอายุ — ทำ refresh แล้วบันทึกกลับ
  const newToken = await refreshAccessToken(record.refresh_token as string);
  await upsertUserToken(userId, newToken);

  return newToken.access_token;
}

export { CLIENT_ID, REDIRECT_URI };
