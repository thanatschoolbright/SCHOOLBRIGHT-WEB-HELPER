import { z } from "zod";

export const Schema = z.object({
  id: z.union([z.number().min(1), z.string().min(1).optional()]),
  name: z.string().min(1),
  name_en: z.string().optional(),
  project_id: z.union([z.number().min(1), z.string().min(1)]),
  by: z.union([z.number().min(1), z.string().min(1)]),
  backlogDescription: z.any().optional(),
  dateRange: z.any().optional(),
  asset_capture_type: z.enum(["CAPTUREABLE", "UN_CAPTUREABLE"]).optional(),
});
