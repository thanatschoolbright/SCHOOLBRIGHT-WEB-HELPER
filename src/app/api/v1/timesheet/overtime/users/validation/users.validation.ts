import { z } from "zod";

/* Validation Schema สำหรับ GET Users Query Parameters */
export const GetUsersQuerySchema = z.object({
  search: z.string().optional().default(""),
});

export type GetUsersQuery = z.infer<typeof GetUsersQuerySchema>;

/* Validation Schema สำหรับ POST Users Request Body */
export const PostUsersRequestSchema = z.object({
  search: z.string().optional().default(""),
  limit: z.number().int().positive().optional().default(50),
  page: z.number().int().positive().optional().default(1),
});

export type PostUsersRequest = z.infer<typeof PostUsersRequestSchema>;

/* Response Type สำหรับ User Data */
export const UserResponseSchema = z.object({
  admin_id: z.number().int(),
  firstname_en: z.string().nullable(),
  firstname_th: z.string().nullable(),
  lastname_en: z.string().nullable(),
  lastname_th: z.string().nullable(),
  nickname: z.string().nullable(),
  employee_code: z.string().nullable(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/* API Response Pagination Type */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof PaginationSchema>;
