import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiLogItem, ApiLogFilters, ApiLogPagination } from '@/types/api-log.type';

interface ApiLogState {
  logs: ApiLogItem[];
  loading: boolean;
  pagination: ApiLogPagination;
  filters: ApiLogFilters;
  selectedLog: ApiLogItem | null;
  modalVisible: boolean;
  modalMode: 'create' | 'edit' | 'view';
}

const initialState: ApiLogState = {
  logs: [],
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'request_time',
    sortOrder: 'desc',
  },
  selectedLog: null,
  modalVisible: false,
  modalMode: 'create',
};

const apiLogSlice = createSlice({
  name: 'apiLog',
  initialState,
  reducers: {
    //** การทำงาน: ตั้งค่าสถานะ loading */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    //** การทำงาน: อัปเดตรายการ logs */
    setLogs: (state, action: PayloadAction<ApiLogItem[]>) => {
      state.logs = action.payload;
    },

    //** การทำงาน: อัปเดตข้อมูล pagination */
    setPagination: (state, action: PayloadAction<ApiLogPagination>) => {
      state.pagination = action.payload;
    },

    //** การทำงาน: อัปเดต filters */
    setFilters: (state, action: PayloadAction<Partial<ApiLogFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    //** การทำงาน: รีเซ็ต filters */
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        sortBy: 'request_time',
        sortOrder: 'desc',
      };
    },

    //** การทำงาน: เลือก log สำหรับ modal */
    setSelectedLog: (state, action: PayloadAction<ApiLogItem | null>) => {
      state.selectedLog = action.payload;
    },

    //** การทำงาน: เปิด/ปิด modal */
    setModalVisible: (state, action: PayloadAction<boolean>) => {
      state.modalVisible = action.payload;
      if (!action.payload) {
        state.selectedLog = null;
      }
    },

    //** การทำงาน: ตั้งค่าโหมด modal */
    setModalMode: (state, action: PayloadAction<'create' | 'edit' | 'view'>) => {
      state.modalMode = action.payload;
    },

    //** การทำงาน: เพิ่ม log ใหม่ */
    addLog: (state, action: PayloadAction<ApiLogItem>) => {
      state.logs.unshift(action.payload);
      state.pagination.total += 1;
    },

    //** การทำงาน: อัปเดต log */
    updateLog: (state, action: PayloadAction<ApiLogItem>) => {
      const index = state.logs.findIndex(log => log.id === action.payload.id);
      if (index !== -1) {
        state.logs[index] = action.payload;
      }
    },

    //** การทำงาน: ลบ log */
    removeLog: (state, action: PayloadAction<string>) => {
      state.logs = state.logs.filter(log => log.id !== action.payload);
      state.pagination.total -= 1;
    },
  },
});

export const {
  setLoading,
  setLogs,
  setPagination,
  setFilters,
  resetFilters,
  setSelectedLog,
  setModalVisible,
  setModalMode,
  addLog,
  updateLog,
  removeLog,
} = apiLogSlice.actions;

export default apiLogSlice.reducer;