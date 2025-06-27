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

        dispatch(
          setResponse({
            status: 200,
            data: {
              id: stored?.id,
              admin_id: stored?.admin_id,
              username: stored?.username,
              name: stored?.name,
              lastname: stored?.lastname,
              token: stored?.token,
            },
          })
        );

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