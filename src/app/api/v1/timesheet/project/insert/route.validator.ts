import { z } from "zod";

export const Schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string(),
  by: z.number().min(1),
  categoryType: z.string(),
  status: z.string(),
  name_en: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
