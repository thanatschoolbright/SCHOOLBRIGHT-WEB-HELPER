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
        let isPasswordCorrect = await bcrypt.compare(password, user.password);
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
          employee_code: user.employee_code,
          role_id: user.role_id,
          role_name: user.role?.role_name,
          permissions: permissions,
          firstname: user.firstname_th,
          lastname: user.lastname_th,
          nickname: user.nickname,
          phone: user.phone,
          position_name: user.position_ref?.name_th,
          name: `${user.firstname_th} ${user.lastname_th}`,
          email: user.email,
          image: user.profile_image_path,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        console.log("🎟️ [AUTH] Creating JWT for user:", user.id);
        token.id = user.id;
        token.admin_id = (user as any).admin_id;
        token.employee_code = (user as any).employee_code;
        token.role_id = (user as any).role_id;
        token.role_name = (user as any).role_name;
        token.permissions = (user as any).permissions;
        token.firstname = (user as any).firstname;
        token.lastname = (user as any).lastname;
        token.nickname = (user as any).nickname;
        token.phone = (user as any).phone;
        token.position_name = (user as any).position_name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log("🌙 [AUTH] Creating Session for token ID:", token.id);
        (session.user as any).id = token.id;
        (session.user as any).admin_id = token.admin_id;
        (session.user as any).employee_code = token.employee_code;
        (session.user as any).role_id = token.role_id;
        (session.user as any).role_name = token.role_name;
        (session.user as any).permissions = token.permissions;
        (session.user as any).firstname = token.firstname;
        (session.user as any).lastname = token.lastname;
        (session.user as any).nickname = token.nickname;
        (session.user as any).phone = token.phone;
        (session.user as any).position_name = token.position_name;
      }
      return session;
    },
  },
});
