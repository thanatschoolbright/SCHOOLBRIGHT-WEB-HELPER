"use client";

import axios from "axios";
import { create } from "zustand";

import {
  DELETE_APPLICATION_VERSION,
  GET_APPLICATION_LIST,
  GET_APPLICATION_VERSION_BY_APPID,
} from "@/app/hardware/canteen/canteen-api.helper";
import type {
  ApplicationRecord,
  VersionDataset,
  VersionRecord,
} from "@/types/canteen.type";

interface CanteenStore {
  applicationList: ApplicationRecord[];
  isApplicationLoading: boolean;
  schoolList: any[];
  selectedApplication: ApplicationRecord | null;
  versionDataset: VersionDataset;
  deleteTargetRecord: VersionRecord | null;

  setSelectedApplication: (app: ApplicationRecord | null) => void;
  setDeleteTargetRecord: (record: VersionRecord | null) => void;

  fetchApplications: () => Promise<void>;
  fetchSchools: () => Promise<void>;
  fetchApplicationVersions: (appId: string | number) => Promise<void>;
  deleteApplicationVersion: (versionId: string | number) => Promise<void>;
}

// ✨ Zustand store สำหรับจัดการ state และ API ของหน้า Canteen App Manager
export const useCanteenStore = create<CanteenStore>((set, get) => ({
  applicationList: [],
  isApplicationLoading: false,
  schoolList: [],
  selectedApplication: null,
  versionDataset: { data: [], loading: false, curl: "" },
  deleteTargetRecord: null,

  setSelectedApplication: (app) => set({ selectedApplication: app }),
  setDeleteTargetRecord: (record) => set({ deleteTargetRecord: record }),

  // ✨ โหลดรายการแอปพลิเคชันทั้งหมดจาก API
  fetchApplications: async () => {
    set({ isApplicationLoading: true });
    try {
      const apiResponse = await GET_APPLICATION_LIST();
      set({ applicationList: apiResponse?.data?.data ?? [] });
    } finally {
      set({ isApplicationLoading: false });
    }
  },

  // ✨ โหลดรายชื่อโรงเรียนจาก API
  fetchSchools: async () => {
    try {
      const response = await axios.get("/api/v1/school/get-detail", {
        timeout: 10000,
      });
      set({ schoolList: response.data?.data?.data ?? [] });
    } catch {
      // ไม่ block การทำงานหากโหลดโรงเรียนไม่ได้
    }
  },

  // ✨ โหลดประวัติเวอร์ชันตาม app_id
  fetchApplicationVersions: async (appId) => {
    set((state) => ({
      versionDataset: { ...state.versionDataset, loading: true },
    }));
    try {
      const apiResponse = await GET_APPLICATION_VERSION_BY_APPID(appId);
      set({
        versionDataset: {
          data: apiResponse?.data?.data ?? [],
          loading: false,
          curl: apiResponse?.curl ?? "",
        },
      });
    } catch {
      set((state) => ({
        versionDataset: { ...state.versionDataset, loading: false },
      }));
    }
  },

  // ✨ ลบเวอร์ชันตาม version_id
  deleteApplicationVersion: async (versionId) => {
    const apiResponse = await DELETE_APPLICATION_VERSION(versionId);
    if (apiResponse?.data?.status === "failed") {
      throw new Error("ไม่สามารถลบข้อมูลได้");
    }
    const { selectedApplication, fetchApplicationVersions } = get();
    if (selectedApplication) {
      await fetchApplicationVersions(selectedApplication.app_id);
    }
  },
}));
