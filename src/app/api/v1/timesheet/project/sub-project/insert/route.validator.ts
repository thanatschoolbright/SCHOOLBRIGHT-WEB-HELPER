import { z } from "zod";

export const Schema = z.object({
  id: z.union([z.number().min(1), z.string().min(1).optional()]),
  name: z.string().min(1),
  name_en: z.string().optional().nullable(),
  project_id: z.union([z.number().min(1), z.string().min(1)]),
  by: z.union([z.number().min(1), z.string().min(1)]),
  backlogDescription: z.any().optional(),
  assetCaptureType: z.enum(["CAPTUREABLE", "UN_CAPTUREABLE"]).optional(),
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
  status: z.string().optional(),
  projectStatusId: z.number().optional().nullable(),
  assignees: z
    .array(
      z.object({
        userId: z.number(),
        position: z.string().optional().nullable(),
      }),
    )
    .optional(),
});
