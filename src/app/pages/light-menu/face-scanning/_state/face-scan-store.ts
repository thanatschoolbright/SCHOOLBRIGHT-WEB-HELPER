import { toast } from "sonner";
import { create } from "zustand";
import { fetchScanLightFace } from "../_services/face-scan-service";

interface FaceScanState {
  isLoading: boolean;
  scanResult: any | null;
  /** ฟังก์ชันสำหรับเรียก API แสกนใบหน้า (Request Data) */
  requestFaceScan: (payload: {
    school_id: string;
    user_code: string;
    s_id: string;
  }) => Promise<void>;
  /** รีเซ็ตข้อมูลใน Store ทั้งหมด */
  resetStore: () => void;
}

export const useFaceScanStore = create<FaceScanState>((set) => ({
  isLoading: false,
  scanResult: null,

  requestFaceScan: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await fetchScanLightFace(payload);
      // ตรวจสอบ status_code จาก API response (มาตรฐาน Backend API Master Prompt)
      if (response.status_code === 200 || response.status === 200) {
        set({ scanResult: response });
        toast.success(response.message_th || "แสกนใบหน้าสำเร็จ");
      } else {
        toast.error(response.message_th || "แสกนใบหน้าไม่สำเร็จ");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message_th || "เกิดข้อผิดพลาดในการแสกนใบหน้า",
      );
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => set({ scanResult: null, isLoading: false }),
}));
