import { create } from "zustand";
import * as UserEditService from "../_services/user-edit-service";

interface UserEditState {
  loading: boolean;
  submitting: boolean;
  userData: any;
  roles: any[];
  positions: any[];
  departments: any[];

  // Actions
  fetchInitialData: (
    userId: string,
    onError: (error: any) => void,
  ) => Promise<void>;
  updateUser: (payload: any) => Promise<any>;
  setUserData: (data: any) => void;
  setSubmitting: (status: boolean) => void;
}

/**
 * Zustand Store สำหรับจัดการ State ในหน้าแก้ไขข้อมูลผู้ใช้งาน
 */
export const useUserEditStore = create<UserEditState>((set, get) => ({
  loading: true,
  submitting: false,
  userData: null,
  roles: [],
  positions: [],
  departments: [],

  fetchInitialData: async (userId, onError) => {
    try {
      set({ loading: true });
      const [userRes, rolesRes, positionsRes, departmentsRes] =
        await Promise.all([
          UserEditService.requestUserByID(userId),
          UserEditService.requestUserConstants(),
          UserEditService.requestPositions(),
          UserEditService.requestDepartments(),
        ]);

      set({
        userData: userRes?.data?.data,
        roles: rolesRes?.data?.data?.roles || [],
        positions: positionsRes?.data?.data?.items || [],
        departments: departmentsRes?.data?.data?.items || [],
      });
    } catch (error: any) {
      onError(error);
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (payload) => {
    set({ submitting: true });
    try {
      const response = await UserEditService.requestUpdateUser(payload);
      return response;
    } finally {
      set({ submitting: false });
    }
  },

  setUserData: (userData) => set({ userData }),
  setSubmitting: (submitting) => set({ submitting }),
}));
