import { z } from "zod";
// ** VALIDATION SCHEMA
export const ReportDateSchema = z.object({
  start_date: z.string().min(1, "กรุณาระบุ start_date"),
  end_date: z.string().min(1, "กรุณาระบุ end_date"),
});
