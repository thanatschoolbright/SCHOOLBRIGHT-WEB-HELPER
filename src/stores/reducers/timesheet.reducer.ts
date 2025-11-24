import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { Project, SubProject, UserProfile } from "@/stores/type";
import type { TimesheetEntry } from "@/types/timesheet-table.types";

//** Interface สำหรับ State ของ Timesheet */
interface TimesheetState {
  //** ข้อมูลการลงเวลา */
  entries: TimesheetEntry[];
  projects: Project[];
  subProjects: SubProject[];
  users: UserProfile[];

  //** สถานะการโหลด */
  loading: boolean;
  entriesLoading: boolean;
  projectsLoading: boolean;
  subProjectsLoading: boolean;
  exportLoading: boolean;

  //** ข้อมูล Pagination */
  currentPage: number;
  pageSize: number;
  totalItems: number;

  //** สถานะ Modal */
  modalStates: {
    exportModal: boolean;
    exportModal2: boolean;
    exportModal3: boolean;
    exportModal4: boolean;
    graphModal: boolean;
    pieModal: boolean;
    detailModal: boolean;
  };

  //** รายการที่เลือก */
  selectedRowKeys: React.Key[];
  detailRecord: TimesheetEntry | null;

  //** สถานะการกรองข้อมูล */
  filteredInfo: Record<string, any>;
}

//** ค่าเริ่มต้นของ State */
const initialState: TimesheetState = {
  entries: [],
  projects: [],
  subProjects: [],
  users: [],

  loading: false,
  entriesLoading: false,
  projectsLoading: false,
  subProjectsLoading: false,
  exportLoading: false,

  currentPage: 1,
  pageSize: 100,
  totalItems: 0,

  modalStates: {
    exportModal: false,
    exportModal2: false,
    exportModal3: false,
    exportModal4: false,
    graphModal: false,
    pieModal: false,
    detailModal: false,
  },

  selectedRowKeys: [],
  detailRecord: null,
  filteredInfo: {},
};

//** สร้าง Slice สำหรับ Timesheet */
const timesheetSlice = createSlice({
  name: "timesheet",
  initialState,
  reducers: {
    //** อัพเดทข้อมูลการลงเวลา */
    setEntries: (state, action: PayloadAction<TimesheetEntry[]>) => {
      state.entries = action.payload;
    },

    //** อัพเดทข้อมูลโปรเจ็กต์ */
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },

    //** อัพเดทข้อมูลโปรเจ็กต์ย่อย */
    setSubProjects: (state, action: PayloadAction<SubProject[]>) => {
      state.subProjects = action.payload;
    },

    //** อัพเดทข้อมูลผู้ใช้ */
    setUsers: (state, action: PayloadAction<UserProfile[]>) => {
      state.users = action.payload;
    },

    //** อัพเดทสถานะการโหลดทั่วไป */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    //** อัพเดทสถานะการโหลดแยกตามประเภท */
    setEntriesLoading: (state, action: PayloadAction<boolean>) => {
      state.entriesLoading = action.payload;
    },

    setProjectsLoading: (state, action: PayloadAction<boolean>) => {
      state.projectsLoading = action.payload;
    },

    setSubProjectsLoading: (state, action: PayloadAction<boolean>) => {
      state.subProjectsLoading = action.payload;
    },

    setExportLoading: (state, action: PayloadAction<boolean>) => {
      state.exportLoading = action.payload;
    },

    //** อัพเดทข้อมูล Pagination */
    setPagination: (
      state,
      action: PayloadAction<{
        currentPage?: number;
        pageSize?: number;
        totalItems?: number;
      }>
    ) => {
      if (action.payload.currentPage !== undefined) {
        state.currentPage = action.payload.currentPage;
      }
      if (action.payload.pageSize !== undefined) {
        state.pageSize = action.payload.pageSize;
      }
      if (action.payload.totalItems !== undefined) {
        state.totalItems = action.payload.totalItems;
      }
    },

    //** อัพเดทสถานะ Modal */
    setModalState: (
      state,
      action: PayloadAction<{
        modal: keyof TimesheetState["modalStates"];
        isOpen: boolean;
      }>
    ) => {
      state.modalStates[action.payload.modal] = action.payload.isOpen;
    },

    //** รีเซ็ตสถานะ Modal ทั้งหมด */
    resetModalStates: (state) => {
      state.modalStates = {
        exportModal: false,
        exportModal2: false,
        exportModal3: false,
        exportModal4: false,
        graphModal: false,
        pieModal: false,
        detailModal: false,
      };
    },

    //** อัพเดทรายการที่เลือก */
    setSelectedRowKeys: (state, action: PayloadAction<React.Key[]>) => {
      state.selectedRowKeys = action.payload;
    },

    //** อัพเดทข้อมูลรายละเอียดที่เลือก */
    setDetailRecord: (state, action: PayloadAction<TimesheetEntry | null>) => {
      state.detailRecord = action.payload;
    },

    //** อัพเดทข้อมูลการกรอง */
    setFilteredInfo: (state, action: PayloadAction<Record<string, any>>) => {
      state.filteredInfo = action.payload;
    },

    //** รีเซ็ต State ทั้งหมด */
    resetTimesheetState: () => initialState,
  },
});

//** Export actions */
export const {
  setEntries,
  setProjects,
  setSubProjects,
  setUsers,
  setLoading,
  setEntriesLoading,
  setProjectsLoading,
  setSubProjectsLoading,
  setExportLoading,
  setPagination,
  setModalState,
  resetModalStates,
  setSelectedRowKeys,
  setDetailRecord,
  setFilteredInfo,
  resetTimesheetState,
} = timesheetSlice.actions;

//** Export reducer */
export default timesheetSlice.reducer;
