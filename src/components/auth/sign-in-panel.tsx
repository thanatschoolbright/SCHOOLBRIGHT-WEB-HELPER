"use client";

import React, {useState, FormEvent} from "react";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState, store, useAppSelector} from "@stores/store";
import {CallAPI} from "@/stores/actions/authentication/call-get-login-admin";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import Swal from "sweetalert2";
import {useRouter} from "next/navigation";
import {CallAPI as CallRefreshAPI} from "@/stores/actions/authentication/call-post-refresh-token";

export default function SignInPanel({visible}: { visible: boolean }) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    // ดึงสถานะ loading / error จาก Redux store (ถ้าต้องการ)
    const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
    const isLoading = [AUTHENTICATION.loading].some(Boolean);

    // local state เก็บค่า input
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    let newToken: string = "";

    const loginFailure = (message: string) => {
        try {
            Swal.fire({
                icon: "error",
                title: "เข้าสู่ระบบล้มเหลว",
                text: message,
            });
        } catch (error: any) {
            throw new Error("Login Error Function", error.message);
        }
    };

    const refreshToken = async () => {
        const state = store.getState();
        const {school_id, user_id, token} = state.callRefreshToken.draftValues;
        console.log("✅ [Refresh Token] Request:", {
            school_id,
            user_id,
            token,
        });

        try {
            const payload = await store
                .dispatch(CallRefreshAPI({school_id, user_id, token}))
                .unwrap(); // ✅ รอผลลัพธ์จริง

            console.log('👨🏻‍💻 [API-GATEWAY] Refresh Token Payload:', payload);

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
            Swal.fire({
                icon: "success",
                title: "เข้าสู่ระบบสำเร็จ",
                text: "",
            });

            setTimeout(() => {
                router.replace("/backend");
            }, 500);
        } catch (error: any) {
            throw new Error("Login Error Function", error.message);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await refreshToken();
            const response = await dispatch(CallAPI({username, password})).unwrap();
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
                    className="w-full bg-blue-900 text-white py-2 rounded-full font-semibold"
                    disabled={isLoading}
                >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
            </form>

            {/* แสดง error ถ้ามี */}
        </div>
    );
}
