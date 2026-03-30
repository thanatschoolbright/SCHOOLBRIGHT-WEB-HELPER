import dayjs from "dayjs";
import { toast } from "sonner";
import { create } from "zustand";
import {
  fetchBacklogAnalytics,
  fetchIssueTimeline,
  fetchIssueTypes,
  fetchPriorities,
  fetchProjects,
  fetchProjectUsers,
  fetchStatuses,
} from "../_api/backlog-analytics-service";

interface Issue {
  key: string;
  summary: string;
  status: string;
  issueType?: string;
  priority?: string;
}

interface TimelineEvent {
  id: number;
  created_at: string;
  updated_by: {
    id: number;
    name: string;
    avatar_url: string;
  };
  from_user: string;
  to_user: string;
  content: string;
}

interface AnalyticsItem {
  id: number;
  name: string;
  total: number;
  closed: number;
  open: number;
  in_progress: number;
  efficiency: number;
  avatarUrl: string;
  issues?: Issue[];
  active_tasks: number;
  pending_tasks: number;
  load_value: number;
  capacity_status: string;
}

interface SelectOption {
  label: string;
  value: string | number;
}

interface BacklogDashboardState {
  loading: boolean;
  analyticsData: AnalyticsItem[];
  space: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  selectedAssigneeId: number | null;
  searchName: string;

  // Filter State
  selectedProjectIds: string[];
  selectedIssueTypeIds: string[];
  selectedPriorityIds: string[];
  selectedStatusIds: string[];
  selectedAssigneeIds: string[];

  // Metadata (options สำหรับ dropdowns)
  metaLoading: boolean;
  projectOptions: SelectOption[];
  issueTypeOptions: SelectOption[];
  priorityOptions: SelectOption[];
  statusOptions: SelectOption[];
  assigneeOptions: SelectOption[];

  // Timeline State
  timelineLoading: boolean;
  timelineData: TimelineEvent[];
  selectedIssueKey: string | null;

  // Actions
  setSpace: (space: string) => void;
  setDateRange: (range: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
  setSelectedAssigneeId: (id: number | null) => void;
  setSearchName: (name: string) => void;
  setSelectedProjectIds: (ids: string[]) => void;
  setSelectedIssueTypeIds: (ids: string[]) => void;
  setSelectedPriorityIds: (ids: string[]) => void;
  setSelectedStatusIds: (ids: string[]) => void;
  setSelectedAssigneeIds: (ids: string[]) => void;
  setTimelineData: (data: TimelineEvent[]) => void;
  resetFilters: () => void;

  // Async Actions
  loadProjectOptions: () => Promise<void>;
  loadIssueTypeOptions: (projectId: string) => Promise<void>;
  loadPriorityOptions: () => Promise<void>;
  loadStatusOptions: (projectId?: string) => Promise<void>;
  loadAssigneeOptions: (projectId: string) => Promise<void>;
  fetchTimeline: (issueKey: string) => Promise<void>;
  fetchAnalytics: () => Promise<void>;

  // Computed
  getTotalStats: () => { total: number; closed: number; open: number };
}

export const useBacklogDashboardStore = create<BacklogDashboardState>(
  (set, get) => ({
    loading: false,
    analyticsData: [],
    space: "jabjai",
    dateRange: [dayjs("2026-03-23"), dayjs("2026-03-27")],
    selectedAssigneeId: null,
    searchName: "",

    // Filter State
    selectedProjectIds: [],
    selectedIssueTypeIds: [],
    selectedPriorityIds: [],
    selectedStatusIds: [],
    selectedAssigneeIds: [],

    // Metadata
    metaLoading: false,
    projectOptions: [],
    issueTypeOptions: [],
    priorityOptions: [],
    statusOptions: [],
    assigneeOptions: [],

    // Timeline State
    timelineLoading: false,
    timelineData: [],
    selectedIssueKey: null,

    setSpace: (space) => set({ space }),
    setDateRange: (dateRange) => set({ dateRange }),
    setSelectedAssigneeId: (selectedAssigneeId) => set({ selectedAssigneeId }),
    setSearchName: (searchName) => set({ searchName }),
    setSelectedProjectIds: (selectedProjectIds) => set({ selectedProjectIds }),
    setSelectedIssueTypeIds: (selectedIssueTypeIds) => set({ selectedIssueTypeIds }),
    setSelectedPriorityIds: (selectedPriorityIds) => set({ selectedPriorityIds }),
    setSelectedStatusIds: (selectedStatusIds) => set({ selectedStatusIds }),
    setSelectedAssigneeIds: (selectedAssigneeIds) => set({ selectedAssigneeIds }),
    setTimelineData: (timelineData) => set({ timelineData }),

    resetFilters: () =>
      set({
        selectedProjectIds: [],
        selectedIssueTypeIds: [],
        selectedPriorityIds: [],
        selectedStatusIds: [],
        selectedAssigneeIds: [],
        issueTypeOptions: [],
        assigneeOptions: [],
        dateRange: null,
      }),

    loadProjectOptions: async () => {
      const { space } = get();
      set({ metaLoading: true });
      try {
        const res = await fetchProjects(space);
        const data = res.data || [];
        const options = data.map((p: any) => ({
          label: `[${p.projectKey}] ${p.name}`,
          value: String(p.id),
        }));
        set({
          projectOptions: options,
          // select all projects by default
          selectedProjectIds: options.map((o: SelectOption) => String(o.value)),
        });
      } catch {
        toast.error("ไม่สามารถดึงรายการโปรเจกต์ได้");
      } finally {
        set({ metaLoading: false });
      }
    },

    loadIssueTypeOptions: async (projectId) => {
      const { space } = get();
      try {
        const res = await fetchIssueTypes(space, projectId);
        const data = res.data || [];
        const options = data.map((t: any) => ({
          label: t.name,
          value: String(t.id),
        }));
        const bugOption = options.find((o: SelectOption) =>
          String(o.label).toLowerCase() === "bug",
        );
        set({
          issueTypeOptions: options,
          selectedIssueTypeIds: bugOption ? [String(bugOption.value)] : [],
        });
      } catch {
        toast.error("ไม่สามารถดึงประเภท Issue ได้");
      }
    },

    loadPriorityOptions: async () => {
      const { space } = get();
      try {
        const res = await fetchPriorities(space);
        const data = res.data || [];
        set({
          priorityOptions: data.map((p: any) => ({
            label: p.name,
            value: String(p.id),
          })),
        });
      } catch {
        toast.error("ไม่สามารถดึงลำดับความสำคัญได้");
      }
    },

    loadStatusOptions: async (projectId) => {
      const { space } = get();
      try {
        const res = await fetchStatuses(space, projectId);
        const data = res.data || [];
        set({
          statusOptions: data.map((s: any) => ({
            label: s.name,
            value: String(s.id),
          })),
        });
      } catch {
        toast.error("ไม่สามารถดึงสถานะงานได้");
      }
    },

    loadAssigneeOptions: async (projectId) => {
      const { space } = get();
      try {
        const res = await fetchProjectUsers(space, projectId);
        const data = res.data || [];
        set({
          assigneeOptions: data.map((u: any) => ({
            label: u.name,
            value: String(u.id),
          })),
        });
      } catch {
        toast.error("ไม่สามารถดึงรายชื่อพนักงานได้");
      }
    },

    fetchTimeline: async (issueKey) => {
      const { space } = get();
      set({ timelineLoading: true, selectedIssueKey: issueKey, timelineData: [] });
      try {
        const response = await fetchIssueTimeline(issueKey, space);
        set({ timelineData: response.data.timeline || [] });
      } catch (error) {
        toast.error(`ไม่สามารถดึง Timeline ของงาน ${issueKey} ได้`);
        console.error(error);
      } finally {
        set({ timelineLoading: false });
      }
    },

    fetchAnalytics: async () => {
      const {
        space,
        dateRange,
        selectedProjectIds,
        selectedIssueTypeIds,
        selectedPriorityIds,
        selectedStatusIds,
        selectedAssigneeIds,
      } = get();
      set({ loading: true });
      try {
        const params: any = { space };
        if (dateRange) {
          params.createdSince = dateRange[0].format("YYYY-MM-DD");
          params.createdUntil = dateRange[1].format("YYYY-MM-DD");
        }
        if (selectedProjectIds.length > 0) params["projectId[]"] = selectedProjectIds;
        if (selectedIssueTypeIds.length > 0) params["issueTypeId[]"] = selectedIssueTypeIds;
        if (selectedPriorityIds.length > 0) params["priorityId[]"] = selectedPriorityIds;
        if (selectedStatusIds.length > 0) params["statusId[]"] = selectedStatusIds;
        if (selectedAssigneeIds.length > 0) params["assigneeId[]"] = selectedAssigneeIds;

        const response = await fetchBacklogAnalytics(params);
        set({ analyticsData: response.data || [] });
        toast.success("ดึงข้อมูลการทำงานพนักงานสำเร็จ");
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูล Dashboard ได้");
        console.error(error);
      } finally {
        set({ loading: false });
      }
    },

    getTotalStats: () => {
      const { analyticsData } = get();
      return analyticsData.reduce(
        (acc, curr) => ({
          total: acc.total + curr.total,
          closed: acc.closed + curr.closed,
          open: acc.open + (curr.open || 0),
        }),
        { total: 0, closed: 0, open: 0 },
      );
    },
  }),
);
