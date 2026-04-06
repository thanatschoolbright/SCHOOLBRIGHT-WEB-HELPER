import dayjs, { Dayjs } from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import {
  postDailyNotify,
  postEmployeeNotify,
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
  notifyLoading: boolean;
  employeeNotifyLoading: boolean;
  // 0=idle 1=preparing 2=sending_email 3=sending_discord 4=done 5=error
  notifyStep: 0 | 1 | 2 | 3 | 4 | 5;
  keyword: string;
  dateRange: [Dayjs, Dayjs];
  departmentIds: number[];

  // Actions
  fetchDailyReport: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  sendNotify: (mode?: "all" | "email" | "discord") => Promise<void>;
  sendEmployeeNotify: (dryRun?: boolean) => Promise<void>;
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
  notifyLoading: false,
  employeeNotifyLoading: false,
  notifyStep: 0,
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

  // ส่งการแจ้งเตือนไทม์ชีทประจำวันพร้อม step tracking สำหรับ delivery tracker
  sendNotify: async (mode = "all") => {
    const { records, metadata } = get();
    if (!records.length) {
      toast.warning("ยังไม่มีข้อมูลที่จะส่งแจ้งเตือน");
      return;
    }

    set({ notifyLoading: true, notifyStep: 1 }); // preparing

    try {
      await new Promise((r) => setTimeout(r, 600)); // pause เล็กน้อยให้ UI แสดง step 1

      if (mode === "all" || mode === "email") set({ notifyStep: 2 }); // sending email
      else set({ notifyStep: 3 }); // sending discord

      const result = await postDailyNotify({
        records,
        date_label: metadata?.range?.label_th ?? dayjs().format("DD/MM/YYYY"),
        mode,
        recipients: ["sa@schoolbright.co", "thanat.light@schoolbright.co"],
      });

      if (mode === "all") set({ notifyStep: 3 }); // sending discord (after email)
      await new Promise((r) => setTimeout(r, 400));

      if (result.status === 200) {
        set({ notifyStep: 4 }); // done
        setTimeout(() => set({ notifyStep: 0, notifyLoading: false }), 3000);
      } else {
        set({ notifyStep: 5 }); // error
        toast.error(result.message_th || "ส่งแจ้งเตือนไม่สำเร็จ");
        setTimeout(() => set({ notifyStep: 0, notifyLoading: false }), 3000);
      }
    } catch {
      set({ notifyStep: 5 });
      toast.error("เกิดข้อผิดพลาดในการส่งแจ้งเตือน");
      setTimeout(() => set({ notifyStep: 0, notifyLoading: false }), 3000);
    }
  },

  // ส่งอีเมลแจ้งเตือนพนักงานที่ยังไม่กรอก/กรอกไม่ครบโดยดึงจาก DB โดยตรง
  sendEmployeeNotify: async (dryRun = false) => {
    const { departmentIds, metadata } = get();
    set({ employeeNotifyLoading: true });
    try {
      const result = await postEmployeeNotify({
        department_ids: departmentIds.length > 0 ? departmentIds : [],
        date_label: metadata?.range?.label_th ?? dayjs().format("D MMMM YYYY"),
        dry_run: dryRun,
      });

      if (result.status === 200) {
        const d = result.data;
        if (dryRun) {
          toast.info(`[Dry Run] พบพนักงานที่ต้องแจ้งเตือน ${d.total_targets} คน`);
        } else {
          toast.success(
            `ส่งอีเมลแจ้งเตือนพนักงานสำเร็จ ${d.sent}/${d.total_targets} คน` +
              (d.skipped_no_email > 0 ? ` (ข้าม ${d.skipped_no_email} คน — ไม่มีอีเมล)` : "") +
              (d.failed > 0 ? ` (ล้มเหลว ${d.failed} คน)` : ""),
          );
        }
      } else {
        toast.error(result.message_th || "ส่งแจ้งเตือนพนักงานไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งแจ้งเตือนพนักงาน");
    } finally {
      set({ employeeNotifyLoading: false });
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
