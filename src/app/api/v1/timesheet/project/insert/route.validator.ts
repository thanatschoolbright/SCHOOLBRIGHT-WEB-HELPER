import { z } from "zod";

export const Schema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1),
  description: z.string(),
  by: z.coerce.number().min(1),
  categoryType: z.string(),
  status: z.string(),
  name_en: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  projectStatusId: z.coerce.number().nullable().optional(),
  completeDate: z.string().optional().nullable(),
  estimateWorkhours: z.coerce.number().optional().nullable(),
  assetCaptureType: z.enum(["CAPTUREABLE", "UN_CAPTUREABLE"]).optional(),
  assignees: z
    .array(z.object({ userId: z.number(), position: z.string().optional() }))
    .optional(),
});
