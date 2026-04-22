import { randomUUID } from "crypto";

// โครงสร้างข้อมูลสำหรับบันทึก log แต่ละ event ที่รับจาก LINE Webhook
export interface WebhookLogEntry {
  traceId: string;
  requestTime: Date;
  responseTime?: Date;
  eventType: string;
  sourceType: string;
  groupId?: string;
  userId?: string;
  commandText?: string;
  outcome: "success" | "error" | "ignored";
  errorMessage?: string;
  requestBody?: object;
  responseBody?: object;
  ipAddress?: string;
  userAgent?: string;
}

// บันทึก log ผ่าน API /api/v1/logger/create แบบ fire-and-forget
// ใช้ fetch โดยตรงเพื่อหลีกเลี่ยง circular call จาก axios interceptor
export function writeWebhookLog(entry: WebhookLogEntry): void {
  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  const payload = {
    requestTime: entry.requestTime.toISOString(),
    responseTime: entry.responseTime?.toISOString() ?? new Date().toISOString(),
    durationMs: entry.responseTime
      ? entry.responseTime.getTime() - entry.requestTime.getTime()
      : null,
    method: "POST",
    statusCode: entry.outcome === "error" ? 500 : 200,
    url: `${baseUrl}/api/v1/application/line/webhook`,
    endpoint: "/api/v1/application/line/webhook",
    serviceName: "line-webhook",
    requestBody: entry.requestBody ?? null,
    responseBody: entry.responseBody ?? null,
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
    calledBy: entry.userId ?? entry.groupId ?? "line-platform",
    traceId: entry.traceId,
    errorMessage: entry.errorMessage ?? null,
    isSuccess: entry.outcome !== "error",
    isArchived: false,
  };

  fetch(`${baseUrl}/api/v1/logger/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    // ไม่ให้ log error ทำให้ webhook ล้มเหลว
    console.error("[WebhookLogger] Failed to write log:", err);
  });
}

// สร้าง traceId ใหม่สำหรับแต่ละ webhook request
export function generateWebhookTraceId(): string {
  return `line-wh-${randomUUID()}`;
}
