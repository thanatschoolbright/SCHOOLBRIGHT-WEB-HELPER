import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Project, SubProject, TimesheetEntry} from '@/types/timesheet';

//** ประเภทของโหมดในฟอร์ม (สร้าง, แก้ไข, คัดลอก) */
type FormMode = "create" | "edit" | "copy";

//** ประเภทของ Modal ที่จะแสดง */
type ModalType = "form" | "detail" | "delete" | null;

//** State αρχικός สำหรับ Timesheet */
interface TimesheetState {
    entries: TimesheetEntry[];
    projects: Project[];
    subProjects: SubProject[];
    loading: boolean;
    actionLoading: boolean;
    totalItems: number;
    currentPage: number;
    pageSize: number;
    modalType: ModalType;
    formMode: FormMode;
    activeRecord: TimesheetEntry | null;
    selectedRowKeys: React.Key[];
}

const initialState: TimesheetState = {
    entries: [],
    projects: [],
    subProjects: [],
    loading: true,
    actionLoading: false,
    totalItems: 0,
    currentPage: 1,
    pageSize: 10,
    modalType: null,
    formMode: 'create',
    activeRecord: null,
    selectedRowKeys: [],
};

//** การสร้าง Slice สำหรับจัดการ State ของ Timesheet */
const timesheetSlice = createSlice({
    name: 'timesheet',
    initialState,
    reducers: {
        //** ตั้งค่าข้อมูล Timesheet ที่โหลดมา */
        setEntries: (state, action: PayloadAction<{ entries: TimesheetEntry[], total: number }>) => {
            state.entries = action.payload.entries;
            state.totalItems = action.payload.total;
        },
        //** ตั้งค่าโปรเจ็กต์ */
        setProjects: (state, action: PayloadAction<Project[]>) => {
            state.projects = action.payload;
        },
        //** ตั้งค่าโปรเจ็กต์ย่อย */
        setSubProjects: (state, action: PayloadAction<SubProject[]>) => {
            state.subProjects = action.payload;
        },
        //** ตั้งค่าสถานะการโหลดข้อมูลหลัก */
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        //** ตั้งค่าสถานะการโหลดของ Action (เช่น บันทึก, ลบ) */
        setActionLoading: (state, action: PayloadAction<boolean>) => {
            state.actionLoading = action.payload;
        },
        //** ตั้งค่าหน้าและขนาดของตาราง */
        setPagination: (state, action: PayloadAction<{ page: number, pageSize: number }>) => {
            state.currentPage = action.payload.page;
            state.pageSize = action.payload.pageSize;
        },
        //** เปิด Modal */
        openModal: (state, action: PayloadAction<{ type: ModalType, mode?: FormMode, record?: TimesheetEntry }>) => {
            state.modalType = action.payload.type;
            if (action.payload.type === 'form') {
                state.formMode = action.payload.mode || 'create';
                state.activeRecord = action.payload.record || null;
                if (action.payload.mode !== 'edit') {
                    state.subProjects = [];
                }
            } else if (action.payload.type === 'detail') {
                state.activeRecord = action.payload.record || null;
            }
        },
        //** ปิด Modal ทั้งหมด */
        closeModal: (state) => {
            state.modalType = null;
            state.activeRecord = null;
            state.formMode = 'create';
        },
        //** ตั้งค่ารายการที่เลือกในตาราง */
        setSelectedRowKeys: (state, action: PayloadAction<React.Key[]>) => {
            state.selectedRowKeys = action.payload;
        },
    },
});

export const {
    setEntries,
    setProjects,
    setSubProjects,
    setLoading,
    setActionLoading,
    setPagination,
    openModal,
    closeModal,
    setSelectedRowKeys,
} = timesheetSlice.actions;

export default timesheetSlice.reducer;

