import { z } from "zod";

// 📝 Schema ตรวจสอบ request body สำหรับ Health Check API
export const healthCheckRequestSchema = z.object({
  mode: z.enum(["discord", "silent", "normal"]).optional().default("silent"),
});

export type HealthCheckRequestInput = z.infer<typeof healthCheckRequestSchema>;
