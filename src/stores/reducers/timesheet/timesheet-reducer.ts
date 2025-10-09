import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Project, SubProject, TimesheetEntry} from '@/stores/type';

interface TimesheetState {
    //** ข้อมูลรายการ Timesheet */
    entries: TimesheetEntry[];
    //** สถานะการโหลด */
    loading: boolean;
    //** ข้อมูลโปรเจ็กต์ */
    projects: Project[];
    //** ข้อมูลโปรเจ็กต์ย่อย */
    subProjects: SubProject[];
    //** การจัดการ Modal */
    modalType: 'form' | 'detail' | 'delete' | null;
    //** โหมดฟอร์ม */
    formMode: 'create' | 'edit' | 'copy';
    //** รายการที่เลือก */
    activeRecord: TimesheetEntry | null;
    //** รายการที่ถูกเลือกในตาราง */
    selectedRowKeys: React.Key[];
    //** การแบ่งหน้า */
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
}

const initialState: TimesheetState = {
    entries: [],
    loading: false,
    projects: [],
    subProjects: [],
    modalType: null,
    formMode: 'create',
    activeRecord: null,
    selectedRowKeys: [],
    pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
    },
};

const timesheetSlice = createSlice({
    name: 'timesheet',
    initialState,
    reducers: {
        //** ตั้งค่าสถานะการโหลด */
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        //** ตั้งค่ารายการ Timesheet */
        setEntries: (state, action: PayloadAction<TimesheetEntry[]>) => {
            state.entries = action.payload;
        },
        //** ตั้งค่าโปรเจ็กต์ */
        setProjects: (state, action: PayloadAction<Project[]>) => {
            state.projects = action.payload;
        },
        //** ตั้งค่าโปรเจ็กต์ย่อย */
        setSubProjects: (state, action: PayloadAction<SubProject[]>) => {
            state.subProjects = action.payload;
        },
        //** ตั้งค่า Modal Type */
        setModalType: (state, action: PayloadAction<'form' | 'detail' | 'delete' | null>) => {
            state.modalType = action.payload;
        },
        //** ตั้งค่าโหมดฟอร์ม */
        setFormMode: (state, action: PayloadAction<'create' | 'edit' | 'copy'>) => {
            state.formMode = action.payload;
        },
        //** ตั้งค่ารายการที่ใช้งาน */
        setActiveRecord: (state, action: PayloadAction<TimesheetEntry | null>) => {
            state.activeRecord = action.payload;
        },
        //** ตั้งค่ารายการที่เลือก */
        setSelectedRowKeys: (state, action: PayloadAction<React.Key[]>) => {
            state.selectedRowKeys = action.payload;
        },
        //** ตั้งค่าการแบ่งหน้า */
        setPagination: (state, action: PayloadAction<Partial<TimesheetState['pagination']>>) => {
            state.pagination = {...state.pagination, ...action.payload};
        },
        //** รีเซ็ตสถานะ */
        reset: (state) => {
            Object.assign(state, initialState);
        },
    },
});

export const {
    setLoading,
    setEntries,
    setProjects,
    setSubProjects,
    setModalType,
    setFormMode,
    setActiveRecord,
    setSelectedRowKeys,
    setPagination,
    reset,
} = timesheetSlice.actions;

export default timesheetSlice.reducer;
