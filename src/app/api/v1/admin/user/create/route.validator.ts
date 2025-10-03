import { z } from "zod";

export const Schema = z.object({
  username: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  lastname: z.string().min(1),
});
