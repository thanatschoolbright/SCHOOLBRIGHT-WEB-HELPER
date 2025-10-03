import { z } from "zod";

export const Schema = z.object({
  id: z.union([z.number().min(1), z.string().min(1).optional()]),
  name: z.string().min(1),
  project_id: z.union([z.number().min(1), z.string().min(1)]),
  by: z.union([z.number().min(1), z.string().min(1)]),
  backlogDescription: z.any().optional(),
  dateRange: z.any().optional(),
});
