// file locate : src/services/api-url.tsx

/** ข้อมูลการเชื่อมต่อ Huawei Cloud Object Storage Service (OBS) */
export const HUAWEI_STORAGE = {
  OBS_BUCKET_URL: process.env.NEXT_PUBLIC_OBS_BUCKET_URL ?? "error",
  OBS_ENDPOINT: process.env.NEXT_PUBLIC_OBS_ENDPOINT ?? "error",
  OBS_DOMAIN: process.env.NEXT_PUBLIC_OBS_DOMAIN ?? "error",
  OBS_ACCOUNT_ID: process.env.NEXT_PUBLIC_OBS_ACCOUNT_ID ?? "error", // เพิ่มไว้กรณีต้องใช้ ID ในการระบุ Path
} as const;
