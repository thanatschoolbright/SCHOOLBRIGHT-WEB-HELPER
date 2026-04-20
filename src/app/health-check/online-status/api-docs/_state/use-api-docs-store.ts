"use client";

import { create } from "zustand";

interface ApiDocsState {
  activeSection: string;
  setActiveSection: (section: string) => void;
  // เพิ่ม state สำหรับการทดสอบ API ถ้าจำเป็น
}

export const useApiDocsStore = create<ApiDocsState>((set) => ({
  activeSection: "overview",
  setActiveSection: (section) => set({ activeSection: section }),
}));
