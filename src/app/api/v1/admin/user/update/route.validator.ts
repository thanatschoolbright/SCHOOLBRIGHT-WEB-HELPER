import { z } from "zod";

export const Schema = z.object({
  id: z.string().uuid(),
  admin_id: z.string().min(1),
  employee_code: z.string().min(1),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  nickname: z.string().min(1),
  position: z.string().min(1),
  email: z.string().email(),
  backlog_email: z.string().email(),
  tel: z.string().min(1),
});
