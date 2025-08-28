"use client";

import { useState } from "react";
import AuthLayout from "@/components/layouts/auth-layout";
import AuthTabs from "@/components/auth/auth-tabs";
import SignUpPanel from "@/components/auth/sign-up-panel";
import SignInPanel from "@/components/auth/sign-in-panel";
import { Toaster } from "sonner";

export default function AuthForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <AuthLayout>
      <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 p-[4rem] relative overflow-hidden transform transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.2)] scale-105">
        <AuthTabs tab={tab} setTab={setTab} />
        <div
          className={`relative flex items-center justify-center transition-all duration-500 ease-in-out ${
            tab === "signup" ? "h-[28rem]" : "h-[20rem]"
          }`}
        >
          <SignUpPanel visible={tab === "signup"} />
          <SignInPanel visible={tab === "signin"} />
        </div>
      </div>
    </AuthLayout>
  );
}
