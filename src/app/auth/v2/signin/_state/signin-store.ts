"use client";

import { create } from "zustand";

// ประเภทข้อมูล debug สำหรับการล็อกอิน
export interface SignInDebugData {
  timestamp: string;
  username?: string;
  errorCode?: string;
  serverMessage?: string;
  error?: string;
  digest?: string;
  stack?: string;
}

// สถานะของการล็อกอิน
export type LoginStatus = "idle" | "process" | "finish" | "error";

// ค่าฟอร์มล็อกอิน
export interface SignInFormValues {
  username: string;
  password: string;
}

interface SignInStore {
  // สถานะหลัก
  loading: boolean;
  isModalVisible: boolean;
  currentStep: number;
  loginStatus: LoginStatus;
  errorMessage: string | null;
  errorCode: string | null;
  debugData: SignInDebugData | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setIsModalVisible: (visible: boolean) => void;
  setCurrentStep: (step: number) => void;
  setLoginStatus: (status: LoginStatus) => void;
  setErrorMessage: (msg: string | null) => void;
  setErrorCode: (code: string | null) => void;
  setDebugData: (data: SignInDebugData | null) => void;
  resetLoginState: () => void;
}

export const useSignInStore = create<SignInStore>((set) => ({
  // ค่าเริ่มต้น
  loading: false,
  isModalVisible: false,
  currentStep: 0,
  loginStatus: "idle",
  errorMessage: null,
  errorCode: null,
  debugData: null,

  setLoading: (loading) => set({ loading }),
  setIsModalVisible: (visible) => set({ isModalVisible: visible }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setLoginStatus: (status) => set({ loginStatus: status }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  setErrorCode: (code) => set({ errorCode: code }),
  setDebugData: (data) => set({ debugData: data }),

  // รีเซ็ตสถานะการล็อกอินทั้งหมด
  resetLoginState: () =>
    set({
      loading: false,
      isModalVisible: false,
      currentStep: 0,
      loginStatus: "idle",
      errorMessage: null,
      errorCode: null,
      debugData: null,
    }),
}));
