import dayjs, { Dayjs } from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import {
  responseDepartmentList,
  responseTimesheetDailyReport,
} from "../_api/description-api";

export interface TimesheetEntry {
  date: string;
  description: string;
  hours: number;
  project_name: string;
  feature_name: string;
  date_str: string;
  backlogDescription: {
    note: string;
    backlogs?: { link: string; title: string }[];
  };
}

export interface TimesheetRecord {
  admin_id: number;
  full_name: string;
  nickname: string;
  employee_code: string;
  position: string;
  department: string;
  image_profile: string | null;
  total_hours: number;
  required_hours: number;
  hours_gap: number;
  status_label: string;
  completion_rate: number;
  progress_text: string;
  entries: TimesheetEntry[];
  rank: number;
}

export interface TimesheetMetadata {
  range: { label_th: string };
  working_days: number;
  expected_hours_per_member: number;
  total_expected_hours_all_members: number;
}

interface DescriptionStore {
  // State
  records: TimesheetRecord[];
  metadata: TimesheetMetadata | null;
  departments: any[];
  loading: boolean;
  keyword: string;
  dateRange: [Dayjs, Dayjs];
  departmentIds: number[];

  // Actions
  fetchDailyReport: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  setKeyword: (keyword: string) => void;
  setDateRange: (range: [Dayjs, Dayjs]) => void;
  setDepartmentIds: (ids: number[]) => void;
  resetFilters: () => void;
}

export const useDescriptionStore = create<DescriptionStore>((set, get) => ({
  // Initial State
  records: [],
  metadata: null,
  departments: [],
  loading: false,
  keyword: "",
  dateRange: [dayjs(), dayjs()],
  departmentIds: [7, 9],

  // ดึงข้อมูลรายงานการลงเวลาประจำวัน
  fetchDailyReport: async () => {
    const { dateRange, departmentIds } = get();
    set({ loading: true });
    try {
      const data = await responseTimesheetDailyReport({
        start_date: dateRange[0].format("YYYY-MM-DD"),
        end_date: dateRange[1].format("YYYY-MM-DD"),
        department_ids: departmentIds,
      });
      if (data.status === 200) {
        set({ records: data.data.records, metadata: data.data.metadata });
      } else {
        toast.error(data.message_th || "ไม่สามารถดึงข้อมูลได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      set({ loading: false });
    }
  },

  // ดึงรายชื่อแผนกทั้งหมด
  fetchDepartments: async () => {
    try {
      const data = await responseDepartmentList();
      set({ departments: data });
    } catch {
      console.error("[DescriptionStore][fetchDepartments]");
    }
  },

  setKeyword: (keyword) => set({ keyword }),
  setDateRange: (dateRange) => set({ dateRange }),
  setDepartmentIds: (departmentIds) => set({ departmentIds }),

  // รีเซ็ต filter กลับค่าเริ่มต้น (departmentIds คงไว้ที่ 7, 9)
  resetFilters: () =>
    set({ keyword: "", dateRange: [dayjs(), dayjs()], departmentIds: [7, 9] }),
}));

// Selector: กรองข้อมูลตาม keyword
export const selectFilteredRecords = (s: DescriptionStore) => {
  if (!s.keyword) return s.records;
  const term = s.keyword.toLowerCase();
  return s.records.filter(
    (rec) =>
      rec.full_name.toLowerCase().includes(term) ||
      rec.nickname.toLowerCase().includes(term) ||
      rec.employee_code.toLowerCase().includes(term) ||
      rec.department.toLowerCase().includes(term),
  );
};

// Selector: สรุปสถิติจาก raw records
export const selectSummaryStats = (s: DescriptionStore) => {
  const totalMembers = s.records.length;
  const completedMembers = s.records.filter((r) => r.hours_gap <= 0).length;
  const totalHours = s.records.reduce((sum, r) => sum + r.total_hours, 0);
  const requiredHours = s.records.reduce((sum, r) => sum + r.required_hours, 0);
  return {
    totalMembers,
    completedMembers,
    incompleteMembers: totalMembers - completedMembers,
    totalHours,
    requiredHours,
  };
};
