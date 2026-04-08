"use client";

import { create } from "zustand";

interface MainStore {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  clearSearch: () => void;
}

export const useMainStore = create<MainStore>((set) => ({
  searchKeyword: "",
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  clearSearch: () => set({ searchKeyword: "" }),
}));
