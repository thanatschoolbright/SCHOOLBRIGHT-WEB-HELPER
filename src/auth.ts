import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            console.error("[AUTH_ERROR] Missing credentials");
            throw new Error("MISSING_CREDENTIALS");
          }

          const username = (credentials.username as string).trim();
          const password = credentials.password as string;

          // 1. Find User by Email OR Employee Code
          const databaseUser = await PrismaTimesheet.user.findFirst({
            where: {
              OR: [
                { email: { equals: username, mode: "insensitive" } },
                { employee_code: { equals: username, mode: "insensitive" } },
                { username: { equals: username, mode: "insensitive" } }, // Also allow username
              ],
              is_deleted: false,
            },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
              position_ref: true,
            },
          });

          if (!databaseUser) {
            throw new Error(`USER_NOT_FOUND: ${username}`);
          }

          // 2. Check if locked out (IPO Standard - with 15 min Auto-Unlock)
          const MAX_FAILED_ATTEMPTS = 5;
          const LOCKOUT_MINUTES = 15;

          if (databaseUser.status !== "ACTIVE") {
            throw new Error("ACCOUNT_LOCKED_OR_INACTIVE");
          }

          if (databaseUser.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
            const now = new Date();
            const lastAttempt = new Date(databaseUser.updated_at);
            const diffInMinutes =
              (now.getTime() - lastAttempt.getTime()) / (1000 * 60);

            if (diffInMinutes < LOCKOUT_MINUTES) {
              throw new Error("MAX_ATTEMPTS_EXCEEDED");
            } else {
              // Lockout duration expired for: ${databaseUser.username}. Allowing attempt...
            }
          }

          // 3. Verify Password
          const isPasswordCorrect = await bcrypt.compare(
            password,
            databaseUser.password,
          );

          let finalPasswordStatus = isPasswordCorrect;

          // Fallback for Plain Text (Development only / Legacy)
          if (!finalPasswordStatus && !databaseUser.password.startsWith("$2")) {
            if (password === databaseUser.password) {
              finalPasswordStatus = true;
            }
          }

          if (!finalPasswordStatus) {
            // Increment failed attempts
            await PrismaTimesheet.user.update({
              where: { id: databaseUser.id },
              data: {
                failed_login_attempts: {
                  increment: 1,
                },
              },
            });
            throw new Error("INVALID_PASSWORD");
          }

          // 4. Success - Reset failed attempts & Update last_login
          await PrismaTimesheet.user.update({
            where: { id: databaseUser.id },
            data: {
              failed_login_attempts: 0,
              last_login: new Date(),
            },
          });

          // 5. Build User Object for JWT
          const permissions =
            databaseUser.role?.permissions.map(
              (rolePermission) => rolePermission.permission.p_code,
            ) || [];

          return {
            id: databaseUser.id.toString(),
            admin_id: databaseUser.admin_id,
            username: databaseUser.username,
            employee_code: databaseUser.employee_code,
            role_id: databaseUser.role_id,
            role_name: databaseUser.role?.role_name,
            permissions: permissions,
            firstname: databaseUser.firstname_th,
            lastname: databaseUser.lastname_th,
            firstname_th: databaseUser.firstname_th,
            lastname_th: databaseUser.lastname_th,
            firstname_en: databaseUser.firstname_en,
            lastname_en: databaseUser.lastname_en,
            nickname: databaseUser.nickname,
            position_id: databaseUser.position_id,
            position_name: databaseUser.position_ref?.name_th,
            department_id: databaseUser.department_id,
            department_name: databaseUser.department?.name_th,
            status: databaseUser.status,
            phone: databaseUser.phone,
            email: databaseUser.email,
            image: databaseUser.profile_image_path,
            profile_image_path: databaseUser.profile_image_path,
            joined_date: databaseUser.joined_date,
            resigned_date: databaseUser.resigned_date,
            employment_type: databaseUser.employment_type,
            last_login: databaseUser.last_login,
            failed_login_attempts: databaseUser.failed_login_attempts,
            created_at: databaseUser.created_at,
            updated_at: databaseUser.updated_at,
            name: `${databaseUser.firstname_th} ${databaseUser.lastname_th}`,
          };
        } catch (error: any) {
          console.error(
            "[AUTH_FATAL_ERROR] Authorization exception:",
            error.message || error,
          );
          // Re-throw to make sure NextAuth handles it or pass a clear message
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      try {
        const urlObj = new URL(url);
        // Allows callback URLs on the same origin
        if (urlObj.origin === baseUrl) return url;

        // [Fix] ป้องกันการเด้งไป localhost:3000 บน Production
        // หาก url ที่ส่งมาเป็น absolute URL และไม่ใช่ localhost ในขณะที่ baseUrl (ที่ NextAuth เดา) เป็น localhost
        // ให้ใช้ url นั้นได้เลย (ซึ่งมักจะเป็น Origin จริงของ Production ที่ส่งมาจาก Client)
        if (!url.includes("localhost") && baseUrl.includes("localhost")) {
          return url;
        }
      } catch (e) {
        // กรณีไม่ใช่ URL ที่ถูกต้อง ให้กลับไปที่ baseUrl
      }

      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as any;
        token.id = authenticatedUser.id;
        token.admin_id = authenticatedUser.admin_id;
        token.username = authenticatedUser.username;
        token.employee_code = authenticatedUser.employee_code;
        token.role_id = authenticatedUser.role_id;
        token.role_name = authenticatedUser.role_name;
        token.permissions = authenticatedUser.permissions;
        token.firstname = authenticatedUser.firstname;
        token.lastname = authenticatedUser.lastname;
        token.firstname_th = authenticatedUser.firstname_th;
        token.lastname_th = authenticatedUser.lastname_th;
        token.firstname_en = authenticatedUser.firstname_en;
        token.lastname_en = authenticatedUser.lastname_en;
        token.nickname = authenticatedUser.nickname;
        token.position_id = authenticatedUser.position_id;
        token.position_name = authenticatedUser.position_name;
        token.department_id = authenticatedUser.department_id;
        token.department_name = authenticatedUser.department_name;
        token.status = authenticatedUser.status;
        token.phone = authenticatedUser.phone;
        token.email = authenticatedUser.email;
        token.image = authenticatedUser.image;
        token.profile_image_path = authenticatedUser.profile_image_path;
        token.joined_date = authenticatedUser.joined_date;
        token.resigned_date = authenticatedUser.resigned_date;
        token.employment_type = authenticatedUser.employment_type;
        token.last_login = authenticatedUser.last_login;
        token.failed_login_attempts = authenticatedUser.failed_login_attempts;
        token.created_at = authenticatedUser.created_at;
        token.updated_at = authenticatedUser.updated_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as any;
        sessionUser.id = token.id;
        sessionUser.admin_id = token.admin_id;
        sessionUser.username = token.username;
        sessionUser.employee_code = token.employee_code;
        sessionUser.role_id = token.role_id;
        sessionUser.role_name = token.role_name;
        sessionUser.permissions = token.permissions;
        sessionUser.firstname = token.firstname;
        sessionUser.lastname = token.lastname;
        sessionUser.firstname_th = token.firstname_th;
        sessionUser.lastname_th = token.lastname_th;
        sessionUser.firstname_en = token.firstname_en;
        sessionUser.lastname_en = token.lastname_en;
        sessionUser.nickname = token.nickname;
        sessionUser.position_id = token.position_id;
        sessionUser.position_name = token.position_name;
        sessionUser.department_id = token.department_id;
        sessionUser.department_name = token.department_name;
        sessionUser.status = token.status;
        sessionUser.phone = token.phone;
        sessionUser.email = token.email;
        sessionUser.image = token.image;
        sessionUser.profile_image_path = token.profile_image_path;
        sessionUser.joined_date = token.joined_date;
        sessionUser.resigned_date = token.resigned_date;
        sessionUser.employment_type = token.employment_type;
        sessionUser.last_login = token.last_login;
        sessionUser.failed_login_attempts = token.failed_login_attempts;
        sessionUser.created_at = token.created_at;
        sessionUser.updated_at = token.updated_at;
      }
      return session;
    },
  },
});
