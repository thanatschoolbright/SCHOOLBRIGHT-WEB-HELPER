"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/layouts/auth-layout";
import AuthTabs from "@/components/auth/auth-tabs";
import SignUpPanel from "@/components/auth/sign-up-panel";
import SignInPanel from "@/components/auth/sign-in-panel";
import { Toaster, toast } from "sonner";

export default function AuthForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    toast.info("โปรดอ่าน!", {
      description:
        "โปรดใช้ username และ password เดียวกันกับ https://adminsystem.schoolbright.co/",
      duration: 6000,
      position: "top-right",
    });
  }, []);

  return (
    <AuthLayout>
      <Toaster richColors position="top-center" closeButton />
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
