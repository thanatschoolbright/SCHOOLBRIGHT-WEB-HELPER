"use server";

import { signIn as nextAuthSignIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(values: any) {
  try {
    // 💡 ปิดการใช้ redirectTo เพื่อให้เราสามารถจัดการการตอบกลับได้เอง
    // และลดโอกาสที่ Next.js จะพลาดการเซ็ต Cookie ในบางสถาปัตยกรรม
    await nextAuthSignIn("credentials", {
      username: values.username,
      password: values.password,
      redirect: false, // สำคัญ: ปิด Auto Redirect
    });
    return { success: true };
  } catch (error: any) {
    // ✅ ถ้าเป็น Error เรื่อง Redirect (ซึ่งหมายถึง Login สำเร็จ) ให้โยนออกไปเลยไม่ต้องจับ
    if (
      error?.message === "NEXT_REDIRECT" ||
      error?.digest?.includes("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("❌ [LoginAction] Authentication error:", error);

    if (error instanceof AuthError) {
      // Auth.js v5 wraps custom errors from authorize in the 'cause' or provides them in the message
      const errorMessage = (error.cause?.message || error.message) as string;

      if (errorMessage && typeof errorMessage === "string") {
        if (errorMessage.includes("MAX_ATTEMPTS_EXCEEDED")) {
          return {
            error:
              "บัญชีของคุณถูกระงับชั่วคราว เนื่องจากระบุรหัสผ่านผิดเกิน 5 ครั้ง โดยระบบจะปลดล็อกอัตโนมัติในภายหลัง (หรือโปรดติดต่อแอดมิน)",
          };
        }
        if (errorMessage.includes("ACCOUNT_LOCKED_OR_INACTIVE")) {
          return {
            error:
              "บัญชีของคุณไม่อยู่ในสถานะที่ใช้งานได้ โปรดติดต่อฝ่ายบุคคลหรือแอดมิน",
          };
        }
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "อีเมล/รหัสพนักงาน หรือ รหัสผ่านไม่ถูกต้อง" };
        default:
          return { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
      }
    }
    throw error;
  }
}
