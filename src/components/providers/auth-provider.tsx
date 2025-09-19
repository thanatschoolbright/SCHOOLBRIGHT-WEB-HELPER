"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { setResponse } from "@stores/reducers/authentication/call-get-login-admin";
import { useRouter, usePathname } from "next/navigation";

export default function AuthenticationReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const router = useRouter();
  const pathname = usePathname(); // 👈 ใช้ตรวจ path ปัจจุบัน
  const dispatch = useDispatch<AppDispatch>();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("AUTH_USER");

    if (raw) {
      try {
        const stored = JSON.parse(raw);
        // * ใช้สำหรับตรวจสอบ Login V.2 แบบใหม่ มีการเปลี่ยน Response Body
        if (stored.user_data === undefined) {
          router.replace("/auth/signin");
          setLoading(false);
          return;
        }

        const response = {
          status: 200,
          data: {
            ...stored,
            token: stored.token,
          },
        };
        // console.log("[AUTH PROVIDER] setResponse:", response);
        dispatch(setResponse(response));

        // ✅ หาก login แล้ว และอยู่หน้า /auth/signin ให้เด้งไป /backend
        if (pathname === "/auth/signin") {
          router.replace("/backend");
        }
        setLoading(false);
      } catch {
        router.replace("/auth/signin");
        setLoading(false);
      }
    } else {
      router.replace("/auth/signin");
      setLoading(false);
    }
  }, [dispatch, pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large">
          <div style={{ marginTop: 16 }}>กำลังโหลด...</div>
        </Spin>
      </div>
    );
  }

  return <>{children}</>;
}
