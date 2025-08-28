"use client";

import React, { useState, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, store, useAppSelector } from "@stores/store";
import { CallAPI } from "@/stores/actions/authentication/call-get-login-admin";
import BaseLoadingComponent from "@components/loading/loading-component-1";
// ❌ ลบ SweetAlert2
// import Swal from "sweetalert2";
// ✅ ใช้ Sonner
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CallAPI as CallRefreshAPI } from "@/stores/actions/authentication/call-post-refresh-token";

export default function SignInPanel({ visible }: { visible: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const isLoading = [AUTHENTICATION.loading].some(Boolean);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  let newToken: string = "";

  const loginFailure = (message: string) => {
    try {
      toast.error("เข้าสู่ระบบล้มเหลว", {
        description: message,
        duration: 5000,
        position: "top-right",
      });
    } catch (error: any) {
      throw new Error("Login Error Function: " + error.message);
    }
  };

  const refreshToken = async () => {
    const state = store.getState();
    const { school_id, user_id, token } = state.callRefreshToken.draftValues;
    console.log("✅ [Refresh Token] Request:", {
      school_id,
      user_id,
      token,
    });

    try {
      const payload = await store
        .dispatch(CallRefreshAPI({ school_id, user_id, token }))
        .unwrap();

      console.log("👨🏻‍💻 [API-GATEWAY] Refresh Token Payload:", payload);

      if (payload?.data?.token) {
        console.log("✅ [API-GATEWAY] New Token:", payload.data.token);
        newToken = payload.data.token;
        return newToken;
      }
      return null;
    } catch (error) {
      console.error("❌ [API-GATEWAY] Error while refreshing token:", error);
      return null;
    }
  };

  const loginSuccess = async () => {
    try {
      toast.success("เข้าสู่ระบบสำเร็จ", {
        duration: 3000,
        position: "top-right",
      });
      setTimeout(() => {
        router.replace("/backend");
      }, 500);
    } catch (error: any) {
      throw new Error("Login Error Function: " + error.message);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await refreshToken();
      const response = await dispatch(CallAPI({ username, password })).unwrap();
      if (response?.data?.token === undefined) {
        return loginFailure(response?.data);
      } else if (response?.data?.token !== undefined) {
        localStorage.setItem("AUTH_USER", JSON.stringify(response?.data));
        return await loginSuccess();
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return (
    <div
      className={`absolute w-full max-w-md mx-auto left-0 right-0 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-x-0 z-10"
          : "opacity-0 translate-x-full z-0 pointer-events-none"
      }`}
    >
      {/* {isLoading && <BaseLoadingComponent />} */}

      <h2 className="text-xl font-bold text-center mb-1 text-gray-700">
        ยินดีต้อนรับ
      </h2>
      <p className="text-sm text-center text-gray-500 mb-6">
        โปรดใช้ username และ password เดียวกันกับ
        https://adminsystem.schoolbright.co/
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="กรอกอีเมลล์"
          className="w-full border border-gray-300 px-4 py-2 rounded-lg text-black"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="••••••••"
          className="w-full border border-gray-300 px-4 py-2 rounded-lg text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#0071e3] text-white py-3 rounded-xl font-semibold tracking-wide shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-99"
          disabled={isLoading}
        >
          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
