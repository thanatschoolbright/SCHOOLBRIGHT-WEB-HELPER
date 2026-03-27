// ✨ Validation schema สำหรับ Project Timeline Chart
import { z } from "zod";

export const timelineChartSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  project_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
});

export type TimelineChartQuery = z.infer<typeof timelineChartSchema>;
