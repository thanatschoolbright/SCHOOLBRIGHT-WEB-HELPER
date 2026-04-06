import { Modal } from "antd";
import { Dayjs } from "dayjs";
import React from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { responseTimesheetSummary } from "../_api/timesheet-all-api";
import { SummaryMetadata, SummaryRecord } from "../types/timesheet.types";
import { buildDefaultRange, filterRecords } from "../utils/timesheet.helpers";

// ประเภทสำหรับ Status Modal
type StatusModalState = {
  open: boolean;
  type: "success" | "error" | "confirm" | "delete";
  title?: string;
  message?: string;
  onConfirm?: () => void;
};

// ประเภทสำหรับ Modal Flags
type ModalFlags = {
  exportModal4: boolean;
  autoFillModal: boolean;
};

interface TimesheetAllStore {
  // State
  records: SummaryRecord[];
  metadata: SummaryMetadata | null;
  loading: boolean;
  keyword: string;
  dateRange: [Dayjs, Dayjs];
  departmentIds: number[];
  modalFlags: ModalFlags;
  statusModal: StatusModalState;

  // Actions
  fetchSummary: () => Promise<void>;
  setKeyword: (keyword: string) => void;
  setDateRange: (range: [Dayjs, Dayjs]) => void;
  setDepartmentIds: (ids: number[]) => void;
  openModal: (key: keyof ModalFlags) => void;
  closeModal: (key: keyof ModalFlags) => void;
  openStatusModal: (state: Omit<StatusModalState, "open">) => void;
  closeStatusModal: () => void;
  resetFilters: () => void;
}

export const useTimesheetAllStore = create<TimesheetAllStore>((set, get) => ({
  // Initial State
  records: [],
  metadata: null,
  loading: false,
  keyword: "",
  dateRange: buildDefaultRange(),
  departmentIds: [],
  modalFlags: { exportModal4: false, autoFillModal: false },
  statusModal: { open: false, type: "success" },

  // ดึงข้อมูลสรุปการบันทึกเวลาจาก API
  fetchSummary: async () => {
    const { dateRange, departmentIds } = get();
    const [start, end] = dateRange;

    set({ loading: true });
    try {
      const body = await responseTimesheetSummary({
        start_date: start.format("YYYY-MM-DD"),
        end_date: end.format("YYYY-MM-DD"),
        department_ids: departmentIds,
      });

      set({
        records: body.data?.records ?? [],
        metadata: body.data?.metadata ?? null,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message_th ||
        error?.message ||
        "ไม่สามารถโหลดข้อมูลได้";

      Modal.error({
        title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        content: React.createElement(
          "div",
          null,
          React.createElement("p", null, errorMessage),
          React.createElement(
            "details",
            { style: { marginTop: 12 } },
            React.createElement(
              "summary",
              { style: { cursor: "pointer", color: "#1890ff" } },
              "ดูรายละเอียดเพิ่มเติม",
            ),
            React.createElement(
              "pre",
              {
                style: {
                  marginTop: 8,
                  padding: 8,
                  background: "#f5f5f5",
                  borderRadius: 4,
                  fontSize: 12,
                  maxHeight: 200,
                  overflow: "auto",
                },
              },
              error?.stack || JSON.stringify(error, null, 2),
            ),
          ),
        ),
      });

      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  setKeyword: (keyword) => set({ keyword }),
  setDateRange: (dateRange) => set({ dateRange }),
  setDepartmentIds: (departmentIds) => set({ departmentIds }),

  openModal: (key) =>
    set((state) => ({
      modalFlags: { ...state.modalFlags, [key]: true },
    })),

  closeModal: (key) =>
    set((state) => ({
      modalFlags: { ...state.modalFlags, [key]: false },
    })),

  openStatusModal: (state) => set({ statusModal: { open: true, ...state } }),

  closeStatusModal: () =>
    set((state) => ({
      statusModal: { ...state.statusModal, open: false },
    })),

  // รีเซ็ตค่า Filter ทั้งหมดกลับสู่ค่าเริ่มต้น
  resetFilters: () =>
    set({
      keyword: "",
      dateRange: buildDefaultRange(),
      departmentIds: [],
    }),
}));

// Selector: กรองข้อมูลตาม keyword (คำนวณจาก raw data ใน store โดยตรง)
export const selectFilteredRecords = (state: TimesheetAllStore) =>
  filterRecords(state.records, state.keyword);

// Selector: สรุปผลรวมเวลาทำงาน (คำนวณจาก filtered records)
export const selectTotalSummary = (state: TimesheetAllStore) => {
  const filtered = filterRecords(state.records, state.keyword);
  return filtered.reduce(
    (acc, rec) => {
      acc.total += rec.total_hours || 0;
      acc.required += rec.required_hours || 0;
      return acc;
    },
    { total: 0, required: 0 },
  );
};
