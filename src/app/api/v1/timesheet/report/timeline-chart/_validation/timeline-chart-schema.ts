// ✨ Validation schema สำหรับ Project Timeline Chart
import { z } from "zod";

export const timelineChartSchema = z.object({
  // ── ช่วงวันที่ ──────────────────────────────────────────────
  start_date: z.string().optional(),
  end_date: z.string().optional(),

  // ── ตัวกรองโครงการ ──────────────────────────────────────────
  project_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),

  group_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),

  status_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),

  category_type: z.string().optional(),

  approval: z.string().optional(),

  // ── ตัวกรองโครงการย่อย ──────────────────────────────────────
  sub_status_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),

  // ── ตัวเลือก ────────────────────────────────────────────────
  has_sub_projects: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),

  search: z.string().optional(),
});

export type TimelineChartQuery = z.infer<typeof timelineChartSchema>;
