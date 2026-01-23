import { z } from "zod";

/**
 * Validation schema for exporting overtime records.
 */
export const ExportOvertimeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
  requester_id: z.string().optional(),
});

export type ExportOvertimeParams = z.infer<typeof ExportOvertimeSchema>;
