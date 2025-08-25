"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/layouts/auth-layout";
import AuthTabs from "@/components/auth/auth-tabs";
import SignUpPanel from "@/components/auth/sign-up-panel";
import SignInPanel from "@/components/auth/sign-in-panel";
import Swal from "sweetalert2";

export default function AuthForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    Swal.fire({
      icon: "info",
      title: "โปรดอ่าน!",
      text: `โปรดใช้ username และ password เดียวกันกับ https://adminsystem.schoolbright.co/`,
    });
  }, []);

  return (
    <AuthLayout>
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-8 relative overflow-hidden">
        <AuthTabs tab={tab} setTab={setTab} />
        <div
          className={`relative ${tab === "signup" ? "h-[22rem]" : "h-[15rem]"}`}
        >
          <SignUpPanel visible={tab === "signup"} />
          <SignInPanel visible={tab === "signin"} />
        </div>
      </div>
    </AuthLayout>
  );
}
