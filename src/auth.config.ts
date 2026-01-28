import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/v2/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      const isPlaygroundPage = nextUrl.pathname.startsWith("/playground");

      if (isAdminPage || isPlaygroundPage) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
