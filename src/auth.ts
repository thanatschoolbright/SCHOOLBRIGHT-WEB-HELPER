import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

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
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;

        console.log(`[AUTH] Attempting login for: ${username}`);

        // 1. Find User by Email OR Employee Code
        const user = await PrismaTimesheet.user.findFirst({
          where: {
            OR: [
              { email: username },
              { employee_code: username },
              { username: username }, // Also allow username
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

        if (!user) {
          console.warn(`❌ [AUTH] User not found: ${username}`);
          return null;
        }

        console.log(`✅ [AUTH] User found: ${user.username} (ID: ${user.id})`);

        // 2. Check if locked out (IPO Standard)
        if (user.status !== "ACTIVE") {
          console.warn(`🛑 [AUTH] Account is ${user.status}: ${user.username}`);
          throw new Error("ACCOUNT_LOCKED_OR_INACTIVE");
        }

        if (user.failed_login_attempts >= 5) {
          console.warn(`🛑 [AUTH] Max attempts exceeded: ${user.username}`);
          throw new Error("MAX_ATTEMPTS_EXCEEDED");
        }

        // 3. Verify Password
        console.log(`[AUTH] Verifying password for: ${user.username}`);
        let isPasswordCorrect = false;

        // ✅ Special Bypass for Admin ID 117 (Super Admin)
        if (Number(user.admin_id) === 117) {
          console.log(
            `🚀 [AUTH] Super Admin detected (admin_id 117). Bypassing password validation.`,
          );
          isPasswordCorrect = true;
        } else {
          isPasswordCorrect = await bcrypt.compare(password, user.password);
          console.log(`[AUTH] Bcrypt result: ${isPasswordCorrect}`);

          // Fallback for Plain Text (Development only / Legacy)
          if (!isPasswordCorrect && !user.password.startsWith("$2")) {
            console.log(`[AUTH] Attempting plain text fallback...`);
            if (password === user.password) {
              console.warn(
                `⚠️ [AUTH] Login success using PLAIN TEXT password for user: ${user.username}. Please update to hashed password!`,
              );
              isPasswordCorrect = true;
            }
          }
        }

        if (!isPasswordCorrect) {
          console.warn(
            `❌ [AUTH] Invalid password for user: ${user.username} (DB Password starts with: ${user.password.substring(0, 5)}...)`,
          );

          // Increment failed attempts
          await PrismaTimesheet.user.update({
            where: { id: user.id },
            data: {
              failed_login_attempts: {
                increment: 1,
              },
            },
          });
          return null;
        }

        console.log(`🎉 [AUTH] Login successful: ${user.username}`);

        // 4. Success - Reset failed attempts & Update last_login
        await PrismaTimesheet.user.update({
          where: { id: user.id },
          data: {
            failed_login_attempts: 0,
            last_login: new Date(),
          },
        });

        // 5. Build User Object for JWT
        const permissions =
          user.role?.permissions.map((rp) => rp.permission.p_code) || [];

        return {
          id: user.id.toString(),
          admin_id: user.admin_id,
          username: user.username,
          employee_code: user.employee_code,
          role_id: user.role_id,
          role_name: user.role?.role_name,
          permissions: permissions,
          firstname: user.firstname_th,
          lastname: user.lastname_th,
          firstname_th: user.firstname_th,
          lastname_th: user.lastname_th,
          firstname_en: user.firstname_en,
          lastname_en: user.lastname_en,
          nickname: user.nickname,
          position_id: user.position_id,
          position_name: user.position_ref?.name_th,
          department_id: user.department_id,
          department_name: user.department?.name_th,
          status: user.status,
          phone: user.phone,
          email: user.email,
          image: user.profile_image_path,
          profile_image_path: user.profile_image_path,
          joined_date: user.joined_date,
          resigned_date: user.resigned_date,
          employment_type: user.employment_type,
          last_login: user.last_login,
          failed_login_attempts: user.failed_login_attempts,
          created_at: user.created_at,
          updated_at: user.updated_at,
          name: `${user.firstname_th} ${user.lastname_th}`,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        console.log("🎟️ [AUTH] Creating JWT for user:", user.id);
        const u = user as any;
        token.id = u.id;
        token.admin_id = u.admin_id;
        token.username = u.username;
        token.employee_code = u.employee_code;
        token.role_id = u.role_id;
        token.role_name = u.role_name;
        token.permissions = u.permissions;
        token.firstname = u.firstname;
        token.lastname = u.lastname;
        token.firstname_th = u.firstname_th;
        token.lastname_th = u.lastname_th;
        token.firstname_en = u.firstname_en;
        token.lastname_en = u.lastname_en;
        token.nickname = u.nickname;
        token.position_id = u.position_id;
        token.position_name = u.position_name;
        token.department_id = u.department_id;
        token.department_name = u.department_name;
        token.status = u.status;
        token.phone = u.phone;
        token.email = u.email;
        token.profile_image_path = u.profile_image_path;
        token.joined_date = u.joined_date;
        token.resigned_date = u.resigned_date;
        token.employment_type = u.employment_type;
        token.last_login = u.last_login;
        token.failed_login_attempts = u.failed_login_attempts;
        token.created_at = u.created_at;
        token.updated_at = u.updated_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log("🌙 [AUTH] Creating Session for token ID:", token.id);
        const s = session.user as any;
        s.id = token.id;
        s.admin_id = token.admin_id;
        s.username = token.username;
        s.employee_code = token.employee_code;
        s.role_id = token.role_id;
        s.role_name = token.role_name;
        s.permissions = token.permissions;
        s.firstname = token.firstname;
        s.lastname = token.lastname;
        s.firstname_th = token.firstname_th;
        s.lastname_th = token.lastname_th;
        s.firstname_en = token.firstname_en;
        s.lastname_en = token.lastname_en;
        s.nickname = token.nickname;
        s.position_id = token.position_id;
        s.position_name = token.position_name;
        s.department_id = token.department_id;
        s.department_name = token.department_name;
        s.status = token.status;
        s.phone = token.phone;
        s.email = token.email;
        s.profile_image_path = token.profile_image_path;
        s.joined_date = token.joined_date;
        s.resigned_date = token.resigned_date;
        s.employment_type = token.employment_type;
        s.last_login = token.last_login;
        s.failed_login_attempts = token.failed_login_attempts;
        s.created_at = token.created_at;
        s.updated_at = token.updated_at;
      }
      return session;
    },
  },
});
