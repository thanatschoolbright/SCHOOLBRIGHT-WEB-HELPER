"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { setResponse } from "@stores/reducers/authentication/call-get-login-admin";
import { useRouter } from "next/navigation";

export default function AuthenticationReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const rounter = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  useEffect(() => {
    // อ่าน JSON string จาก localStorage
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
      } catch {
        rounter.replace("/auth/signin");
      }
    } else {
      rounter.replace("/auth/signin");
    }
  }, [dispatch]);

  return <>{children}</>;
}
