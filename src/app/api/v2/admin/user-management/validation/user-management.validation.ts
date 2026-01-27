import { z } from "zod";

export const CreateUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  admin_id: z.number().int(),
  employee_code: z.string().optional(),
  firstname_th: z.string().optional(),
  lastname_th: z.string().optional(),
  firstname_en: z.string().optional(),
  lastname_en: z.string().optional(),
  nickname: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role_id: z.number().int().optional(),
  profile_image: z.string().optional(),
  created_by: z.number().int().optional(),
});

export const UpdateUserSchema = z.object({
  id: z.number().int(),
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  admin_id: z.number().int().optional(),
  employee_code: z.string().optional(),
  firstname_th: z.string().optional(),
  lastname_th: z.string().optional(),
  firstname_en: z.string().optional(),
  lastname_en: z.string().optional(),
  nickname: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role_id: z.number().int().optional(),
  profile_image: z.string().optional(),
  updated_by: z.number().int().optional(),
});

export const DeleteUserSchema = z.object({
  id: z.number().int(),
  deleted_by: z.number().int().optional(),
});

export const ReadUserSchema = z.object({
  page: z.number().int().default(1),
  limit: z.number().int().default(50),
  search: z.string().optional(),
  role_id: z.number().int().optional(),
  status: z.string().optional(),
});
