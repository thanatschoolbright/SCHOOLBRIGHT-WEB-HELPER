"use client";
import { setResponse } from "@stores/reducers/authentication/call-get-login-admin";
import { setDraftValues as setRefreshDraft } from "@stores/reducers/authentication/call-refresh-token";
import { AppDispatch } from "@stores/store";
import { Spin } from "antd";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

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

      // สร้าง Payload สำหรับ Redux โดยใช้ข้อมูลล่าสุดจาก Session
      const reduxAuthData = {
        status: 200,
        data: {
          success: true,
          token: "next-auth-session",
          user_data: {
            // --- Legacy Mapping ---
            admin_id: Number(user.admin_id) || 0,
            user_id: Number(user.id) || 0,
            employee_code: user.employee_code || "",
            firstname: user.firstname || user.firstname_th || "",
            lastname: user.lastname || user.lastname_th || "",
            nickname: user.nickname || "",
            email: user.email || "",
            tel: user.phone || "",
            position: user.position_name || user.role_name || "",

            // --- All DB Fields (Prisma matched) ---
            username: user.username || "",
            firstname_th: user.firstname_th || "",
            lastname_th: user.lastname_th || "",
            firstname_en: user.firstname_en || "",
            lastname_en: user.lastname_en || "",
            position_id: user.position_id || null,
            position_name: user.position_name || "",
            department_id: user.department_id || null,
            department_name: user.department_name || "",
            status: user.status || "ACTIVE",
            phone: user.phone || "",
            profile_image_path: user.profile_image_path || user.image || "",
            joined_date: user.joined_date || null,
            resigned_date: user.resigned_date || null,
            employment_type: user.employment_type || "FULL_TIME",
            last_login: user.last_login || null,
            failed_login_attempts: user.failed_login_attempts || 0,
            role_id: user.role_id || null,
            role_name: user.role_name || "",
            permissions: user.permissions || [],
            created_at: user.created_at || null,
            updated_at: user.updated_at || null,

            ...user, // Fallback spread สำหรับฟิลด์อื่นๆ
          },
        },
      };

      // ⚡ Dispatch ลง Redux เสมอเมื่อ Session มีการเปลี่ยนแปลง
      dispatch(setResponse(reduxAuthData as any));

      // ✅ ซิงค์ข้อมูลสำหรับ Legacy Refresh Token
      dispatch(
        setRefreshDraft({
          school_id: "0",
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
        suppressHydrationWarning
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#F8FAFC",
        }}
      >
        <Spin size="large">
          <div
            suppressHydrationWarning
            style={{ marginTop: 16, color: "#94A3B8" }}
          >
            กำลังตรวจสอบสิทธิ์...
          </div>
        </Spin>
      </div>
    );
  }

  return <>{children}</>;
}
