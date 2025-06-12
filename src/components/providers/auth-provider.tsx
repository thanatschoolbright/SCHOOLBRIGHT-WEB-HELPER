"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { setResponse } from "@stores/reducers/authentication/call-get-login-admin";

export default function AuthenticationReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const dispatch = useDispatch<AppDispatch>();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  useEffect(() => {
    // อ่าน JSON string จาก localStorage
    const raw = localStorage.getItem("AUTH_USER");
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        console.log("STORE", stored);
        dispatch(
          setResponse({
            status: 200,
            data: {
              id: "xxx",
              admin_id: 1,
              username: "user",
              name: "ชื่อ",
              lastname: "สกุล",
              token: "tokenstring",
            },
          })
        );
      } catch {
        // ถ้า parse ไม่ได้ ก็ข้ามไปเลย
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}
