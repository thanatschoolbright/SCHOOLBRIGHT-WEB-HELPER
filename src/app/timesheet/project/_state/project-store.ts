import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import { create } from "zustand";

import type { PaginationState, Project, ProjectStatus } from "../types/project.types";

interface ProjectStore {
  // State
  loading: boolean;
  projects: Project[];
  statuses: ProjectStatus[];
  backendStats: any;
  pagination: PaginationState;
  adminId: number;

  // Actions
  setAdminId: (id: number) => void;
  setPagination: (pagination: PaginationState) => void;
  fetchProjects: () => Promise<void>;
  createProject: (values: any) => Promise<boolean>;
  updateProject: (id: number, values: any) => Promise<boolean>;
  deleteProject: (id: number) => Promise<boolean>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial State
  loading: false,
  projects: [],
  statuses: [],
  backendStats: null,
  adminId: 0,
  pagination: { current: 1, pageSize: 1000, total: 0 },

  setAdminId: (id) => set({ adminId: id }),

  setPagination: (pagination) => set({ pagination }),

  // ดึงข้อมูลโครงการ สถานะ และสถิติพร้อมกัน
  fetchProjects: async () => {
    const { pagination } = get();
    set({ loading: true });
    try {
      const [projectRes, statusRes, statsRes] = await Promise.all([
        axios.post("/api/v1/timesheet/project/read/", {
          limit: pagination.pageSize,
          page: pagination.current,
        }),
        axios.post("/api/v1/timesheet/project/status/read/"),
        axios.post("/api/v1/timesheet/project/stats/"),
      ]);

      set({
        projects: projectRes.data.data || [],
        pagination: {
          ...pagination,
          total: projectRes.data.pagination?.total || 0,
        },
      });

      if (statusRes.data.status === 200) {
        set({ statuses: statusRes.data.data });
      }

      if (statsRes.data.status === 200) {
        set({ backendStats: statsRes.data.data });
      }
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการได้");
      set({ projects: [] });
    } finally {
      set({ loading: false });
    }
  },

  // สร้างโครงการใหม่
  createProject: async (values) => {
    const { adminId, fetchProjects } = get();
    try {
      await axios.post("/api/v1/timesheet/project/insert/", { ...values, by: adminId });
      toast.success("สร้างโครงการสำเร็จ");
      await fetchProjects();
      return true;
    } catch {
      toast.error("ทำรายการล้มเหลว กรุณาลองใหม่");
      return false;
    }
  },

  // อัปเดตโครงการ
  updateProject: async (id, values) => {
    const { adminId, fetchProjects } = get();
    try {
      await axios.post("/api/v1/timesheet/project/insert/", { ...values, id, by: adminId });
      toast.success("อัปเดตโครงการสำเร็จ");
      await fetchProjects();
      return true;
    } catch {
      toast.error("ทำรายการล้มเหลว กรุณาลองใหม่");
      return false;
    }
  },

  // ลบโครงการ
  deleteProject: async (id) => {
    const { adminId, fetchProjects } = get();
    try {
      await axios.post("/api/v1/timesheet/project/delete/", { id, by: adminId });
      toast.success("ลบโครงการเรียบร้อยแล้ว");
      await fetchProjects();
      return true;
    } catch {
      toast.error("ลบข้อมูลล้มเหลว");
      return false;
    }
  },
}));
