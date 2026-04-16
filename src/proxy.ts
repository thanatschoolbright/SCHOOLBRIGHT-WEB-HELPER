import { auth } from "./auth";

export { auth as proxy };
export default auth;

export const config = {
  // ปรับปรุง Matcher เพื่อข้ามไฟล์ static ทั้งหมด ป้องกัน Middleware ทำงานซ้ำซ้อน
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.otf$).*)",
  ],
};
