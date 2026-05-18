import { create } from "zustand";
import { BotItem, fetchBotList, toggleBot } from "../_api/bot-management-service";

interface StatusModal {
  open: boolean;
  type: "success" | "error" | "confirm";
  title: string;
  message?: string;
}

interface BotManagementStore {
  bots: BotItem[];
  isLoading: boolean;
  togglingKey: string | null;
  statusModal: StatusModal;
  loadBots: () => Promise<void>;
  handleToggle: (key: string, enabled: boolean, nameTh: string) => Promise<void>;
  closeStatusModal: () => void;
}

// Store สำหรับจัดการสถานะหน้า Bot Management
export const useBotManagementStore = create<BotManagementStore>((set) => ({
  bots: [],
  isLoading: false,
  togglingKey: null,
  statusModal: { open: false, type: "success", title: "" },

  // โหลดรายการ Bot ทั้งหมดจาก API
  loadBots: async () => {
    set({ isLoading: true });
    try {
      const bots = await fetchBotList();
      set({ bots });
    } catch {
      set({
        statusModal: {
          open: true,
          type: "error",
          title: "โหลดข้อมูล Bot ไม่สำเร็จ",
          message: "ไม่สามารถดึงรายการ Bot ได้ กรุณาลองใหม่อีกครั้ง",
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // เปิด/ปิด Bot และอัปเดต state ทันที
  handleToggle: async (key, enabled, nameTh) => {
    set({ togglingKey: key });
    try {
      const updated = await toggleBot(key, enabled);
      set((state) => ({
        bots: state.bots.map((b) =>
          b.key === key ? { ...b, enabled: updated.enabled, updated_at: updated.updated_at } : b,
        ),
        statusModal: {
          open: true,
          type: "success",
          title: enabled ? `เปิด ${nameTh} สำเร็จ` : `ปิด ${nameTh} สำเร็จ`,
          message: enabled
            ? "Bot จะเริ่มทำงานตามกำหนดเวลา"
            : "Bot จะหยุดทำงาน แม้ Kubernetes CronJob ยังคงทำงานอยู่",
        },
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message_th?: string } }; message?: string })?.response?.data?.message_th ??
        (err as { message?: string })?.message ??
        "ไม่สามารถบันทึกการตั้งค่าได้";
      set({
        statusModal: {
          open: true,
          type: "error",
          title: "เปลี่ยนสถานะ Bot ไม่สำเร็จ",
          message,
        },
      });
    } finally {
      set({ togglingKey: null });
    }
  },

  closeStatusModal: () =>
    set((state) => ({ statusModal: { ...state.statusModal, open: false } })),
}));
