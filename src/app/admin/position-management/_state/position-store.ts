import { toast } from "sonner";
import { create } from "zustand";
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from "../_services/position-service";
import { Position, TECH_ROLES } from "../_types/position-types";

interface PositionState {
  // Data
  positions: Position[];
  loading: boolean;
  search: string;

  // UI Control
  modalMode: "create" | "edit" | null;
  selectedPos: Position | null;
  deleteModalOpen: boolean;
  statusModal: {
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
  };

  // Auto Gen UI
  autoGenModalOpen: boolean;
  genStep: "generating" | "review" | "executing" | "summary";
  candidatePositions: any[];
  executionStatus: any[];
  currentExecutionIndex: number;

  // Actions
  setSearch: (search: string) => void;
  setModalMode: (mode: "create" | "edit" | null) => void;
  setSelectedPos: (pos: Position | null) => void;
  setDeleteModalOpen: (open: boolean) => void;
  setStatusModal: (config: any) => void;
  setAutoGenModalOpen: (open: boolean) => void;
  setGenStep: (step: any) => void;
  handleDeleteCandidate: (index: number) => void;

  // Business Logic Actions
  loadPositions: () => Promise<void>;
  submitPosition: (values: any) => Promise<void>;
  confirmDelete: () => Promise<void>;
  openAutoGen: () => Promise<void>;
  confirmAutoGen: () => Promise<void>;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  positions: [],
  loading: false,
  search: "",

  modalMode: null,
  selectedPos: null,
  deleteModalOpen: false,
  statusModal: {
    open: false,
    type: "success",
    title: "",
    message: "",
  },

  autoGenModalOpen: false,
  genStep: "generating",
  candidatePositions: [],
  executionStatus: [],
  currentExecutionIndex: 0,

  setSearch: (search) => set({ search }),
  setModalMode: (modalMode) => set({ modalMode }),
  setSelectedPos: (selectedPos) => set({ selectedPos }),
  setDeleteModalOpen: (deleteModalOpen) => set({ deleteModalOpen }),
  setStatusModal: (statusModal) =>
    set({ statusModal: { ...get().statusModal, ...statusModal } }),
  setAutoGenModalOpen: (autoGenModalOpen) => set({ autoGenModalOpen }),
  setGenStep: (genStep) => set({ genStep }),

  /**
   * ลบรายการ candidate
   */
  handleDeleteCandidate: (index: number) => {
    const { candidatePositions } = get();
    const newCandidates = [...candidatePositions];
    newCandidates.splice(index, 1);
    set({ candidatePositions: newCandidates });
  },

  /**
   * ดึงข้อมูลตำแหน่งงานทั้งหมด
   */
  loadPositions: async () => {
    set({ loading: true });
    try {
      const res = await fetchPositions(get().search);
      set({ positions: res?.data?.items || [] });
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลตำแหน่งได้");
    } finally {
      set({ loading: false });
    }
  },

  /**
   * บันทึกตำแหน่งงาน
   */
  submitPosition: async (values: any) => {
    const { modalMode, selectedPos, loadPositions } = get();
    try {
      if (modalMode === "create") {
        await createPosition(values);
        toast.success("สร้างตำแหน่งงานสำเร็จ");
      } else {
        await updatePosition({ ...values, id: selectedPos?.id });
        toast.success("แก้ไขตำแหน่งงานสำเร็จ");
      }
      set({ modalMode: null });
      await loadPositions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  },

  /**
   * ยืนยันการลบ
   */
  confirmDelete: async () => {
    const { selectedPos, loadPositions } = get();
    if (!selectedPos) return;
    try {
      await deletePosition(selectedPos.id);
      toast.success("ลบตำแหน่งเรียบร้อยแล้ว");
      set({ deleteModalOpen: false });
      await loadPositions();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  },

  /**
   * เปิดระบบ Auto Gen
   */
  openAutoGen: async () => {
    const { positions } = get();
    set({ autoGenModalOpen: true, genStep: "generating" });

    // Simulate analysis
    setTimeout(() => {
      const candidates = TECH_ROLES.map((role) => {
        const exists = positions.some((p) => p.name_th === role.name_th);
        return {
          ...role,
          status: exists ? "DUPLICATE" : "READY",
        };
      });
      set({ candidatePositions: candidates, genStep: "review" });
    }, 1500);
  },

  /**
   * ยืนยันการรัน Auto Gen
   */
  confirmAutoGen: async () => {
    set({ genStep: "executing" });
    const { candidatePositions, loadPositions } = get();

    set({
      executionStatus: candidatePositions.map((c) => ({
        ...c,
        execStatus: "pending",
      })),
      currentExecutionIndex: 0,
    });

    for (let i = 0; i < candidatePositions.length; i++) {
      const item = candidatePositions[i];
      set({ currentExecutionIndex: i });

      if (item.status === "DUPLICATE") {
        set((state) => {
          const next = [...state.executionStatus];
          next[i] = {
            ...item,
            execStatus: "skipped",
            message: "Already exists",
          };
          return { executionStatus: next };
        });
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      try {
        await new Promise((r) => setTimeout(r, 500));
        await createPosition({
          name_th: item.name_th,
          name_en: item.name_en,
          description: "Auto Generated Tech Role",
          is_active: true,
        });

        set((state) => {
          const next = [...state.executionStatus];
          next[i] = { ...item, execStatus: "success" };
          return { executionStatus: next };
        });
      } catch (err) {
        set((state) => {
          const next = [...state.executionStatus];
          next[i] = {
            ...item,
            execStatus: "error",
            message: "Failed to create",
          };
          return { executionStatus: next };
        });
      }
    }

    set({ genStep: "summary" });
    await loadPositions();
    set({
      statusModal: {
        open: true,
        type: "success",
        title: "ดำเนินการสำเร็จ",
        message: "ระบบได้ทำการสร้างตำแหน่งงานจากเทมเพลตเรียบร้อยแล้ว",
      },
    });
  },
}));
