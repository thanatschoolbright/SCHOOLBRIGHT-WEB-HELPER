import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Issue, OptionItem} from '@components/backlog/issue-drawer/types';
import {Dayjs} from 'dayjs';

type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

interface IssuesState {
    issues: Issue[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    optionsLoading: boolean;
    statusOptions: OptionItem[];
    priorityOptions: OptionItem[];
    issueTypeOptions: OptionItem[];
    milestoneOptions: OptionItem[];
    categoryOptions: OptionItem[];
    filters: {
        keyword: string;
        statusIds: number[];
        priorityIds: number[];
        issueTypeIds: number[];
        dateRange: DateRangeValue;
    };
    selectedRowKeys: React.Key[];
}

const initialState: IssuesState = {
    issues: [],
    total: 0,
    page: 1,
    pageSize: 50,
    loading: false,
    optionsLoading: true,
    statusOptions: [],
    priorityOptions: [],
    issueTypeOptions: [],
    milestoneOptions: [],
    categoryOptions: [],
    filters: {
        keyword: '',
        statusIds: [],
        priorityIds: [],
        issueTypeIds: [],
        dateRange: null,
    },
    selectedRowKeys: [],
};

const issuesSlice = createSlice({
    name: 'issues',
    initialState,
    reducers: {
        setIssues: (state, action: PayloadAction<{ issues: Issue[]; total: number }>) => {
            state.issues = action.payload.issues;
            state.total = action.payload.total;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setOptionsLoading: (state, action: PayloadAction<boolean>) => {
            state.optionsLoading = action.payload;
        },
        setPagination: (state, action: PayloadAction<{ page: number; pageSize: number }>) => {
            state.page = action.payload.page;
            state.pageSize = action.payload.pageSize;
        },
        setFilters: (state, action: PayloadAction<Partial<IssuesState['filters']>>) => {
            state.filters = {...state.filters, ...action.payload};
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
        },
        setOptions: (state, action: PayloadAction<Partial<Pick<IssuesState, 'statusOptions' | 'priorityOptions' | 'issueTypeOptions' | 'milestoneOptions' | 'categoryOptions'>>>) => {
            state.statusOptions = action.payload.statusOptions ?? state.statusOptions;
            state.priorityOptions = action.payload.priorityOptions ?? state.priorityOptions;
            state.issueTypeOptions = action.payload.issueTypeOptions ?? state.issueTypeOptions;
            state.milestoneOptions = action.payload.milestoneOptions ?? state.milestoneOptions;
            state.categoryOptions = action.payload.categoryOptions ?? state.categoryOptions;
        },
        setSelectedRowKeys: (state, action: PayloadAction<React.Key[]>) => {
            state.selectedRowKeys = action.payload;
        }
    },
});

export const {
    setIssues,
    setLoading,
    setOptionsLoading,
    setPagination,
    setFilters,
    resetFilters,
    setOptions,
    setSelectedRowKeys,
} = issuesSlice.actions;

export default issuesSlice.reducer;

