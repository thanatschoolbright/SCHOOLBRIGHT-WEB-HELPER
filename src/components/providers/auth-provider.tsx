"use client";
import { useEffect } from "react";
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

  useEffect(() => {
    const raw = localStorage.getItem("AUTH_USER");


    if (raw) {
      try {
        const stored = JSON.parse(raw);
        // * ใช้สำหรับตรวจสอบ Login V.2 แบบใหม่ มีการเปลี่ยน Response Body 
        if (stored.user_data === undefined)  {
          return router.replace("/auth/signin")
        }

        const response = {
          status: 200,
          data: {
            ...stored,
            token: stored.token,
          },
        };
        console.log("[AUTH PROVIDER] setResponse:", response);
        dispatch(setResponse(response));

        // ✅ หาก login แล้ว และอยู่หน้า /auth/signin ให้เด้งไป /backend
        if (pathname === "/auth/signin") {
          router.replace("/backend");
        }
      } catch {
        router.replace("/auth/signin");
      }
    } else {
      router.replace("/auth/signin");
    }
  }, [dispatch, pathname, router]);

  return <>{children}</>;
}
