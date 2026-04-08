"use client";

import { create } from "zustand";

interface ForgotPasswordStore {
  loading: boolean;
  isSuccess: boolean;
  error: string | null;

  setLoading: (v: boolean) => void;
  setIsSuccess: (v: boolean) => void;
  setError: (v: string | null) => void;
  reset: () => void;
}

export const useForgotPasswordStore = create<ForgotPasswordStore>((set) => ({
  loading: false,
  isSuccess: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setIsSuccess: (isSuccess) => set({ isSuccess }),
  setError: (error) => set({ error }),
  reset: () => set({ loading: false, isSuccess: false, error: null }),
}));
