"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@stores/store";
import { setResponse } from "@stores/reducers/authentication/call-get-login-admin";
import { setDraftValues as setRefreshDraft } from "@stores/reducers/authentication/call-refresh-token";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * @notice AuthenticationProvider - จัดการการนำทางและซิงค์ข้อมูลกับ Redux สำหรับ Legacy Code
 * ใช้ Session จาก Next-Auth v5 และซิงค์ลง Redux เพื่อให้ Component เดิมทำงานได้
 */
export default function AuthenticationProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. ถ้ายังโหลด Session ไม่เสร็จ ให้รอก่อน
    if (status === "loading") {
      console.log("⏳ [AuthProvider] Status: loading...");
      return;
    }

    console.log(`🛡️ [AuthProvider] Status: ${status}, Path: ${pathname}`);

    // 2. ตรวจสอบเส้นทางที่เกี่ยวข้องกับ Authentication
    const authPages = ["/auth/v2/signin"];
    const isAuthPage = authPages.includes(pathname);

    // 3. ถ้าเข้าสู่ระบบแล้ว (Authenticated)
    if (status === "authenticated" && session) {
      // ✅ ซิงค์ข้อมูลจาก Session เข้าสู่ Redux เพื่อให้ Component เดิมใช้งานได้
      const user = session.user as any;
      console.log("🔐 [AuthProvider] User authenticated:", user);
      const reduxAuthData = {
        status: 200,
        data: {
          success: true,
          token: "next-auth-session", // Secure JWT session
          user_data: {
            admin_id: Number(user.admin_id) || 0,
            user_id: Number(user.id) || 0,
            employee_code: user.employee_code || "",
            firstname: user.firstname || user.name?.split(" ")[0] || "",
            lastname: user.lastname || user.name?.split(" ")[1] || "",
            nickname: user.nickname || "",
            email: user.email || "",
            tel: user.phone || "",
            position: user.role_name || user.position_name || "",
            ...user,
          },
        },
      };

      dispatch(setResponse(reduxAuthData as any));

      // ✅ ซิงค์ข้อมูลสำหรับ Legacy Refresh Token (JabjaiKey)
      dispatch(
        setRefreshDraft({
          school_id: "0", // จะถูกอัปเดตโดย SchoolReduxProvider หรือใช้จาก Session ถ้ามี
          user_id: String(user.id || ""),
          token: "next-auth-session",
        }),
      );

      // ✅ หากอยู่หน้า Login ให้เด้งไปหน้าหลัก
      if (isAuthPage) {
        router.replace("/main");
      }
      setIsInitializing(false);
    }

    // 4. ถ้ายังไม่ได้เข้าสู่ระบบ
    else if (status === "unauthenticated") {
      // ✅ ถ้าไม่ใช่หน้า Auth และพยายามเข้าหน้าหลักหรือหน้าอื่นๆ ให้เด้งไป Login
      if (
        !isAuthPage &&
        (pathname === "/" ||
          pathname.startsWith("/main") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/timesheet"))
      ) {
        router.replace("/auth/v2/signin");
      }
      setIsInitializing(false);
    }
  }, [status, session, dispatch, pathname, router]);

  // แสดง Loading เฉพาะตอนโหลดครั้งแรก หรือตอนกำลังตรวจสอบสิทธิ์
  if (status === "loading" || isInitializing) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#F8FAFC",
        }}
      >
        <Spin size="large">
          <div style={{ marginTop: 16, color: "#94A3B8" }}>
            กำลังตรวจสอบสิทธิ์...
          </div>
        </Spin>
      </div>
    );
  }

  return <>{children}</>;
}
