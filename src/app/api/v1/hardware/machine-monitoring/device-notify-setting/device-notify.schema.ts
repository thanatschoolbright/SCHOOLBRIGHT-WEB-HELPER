import { z } from "zod";

export const ToggleDeviceNotifySchema = z.object({
  school_id: z.number().int().positive(),
  device_id: z.string().min(1),
  notify_enabled: z.boolean(),
});

export type ToggleDeviceNotifyDTO = z.infer<typeof ToggleDeviceNotifySchema>;
