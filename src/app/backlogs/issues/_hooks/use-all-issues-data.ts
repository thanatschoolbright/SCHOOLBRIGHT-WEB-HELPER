"use client";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AllIssuesFilters, IssueOption, ProjectOption, SummaryStats } from "../_types/all-issues.types";

interface UseAllIssuesDataOptions {
  space: string;
  initialFilters?: Partial<AllIssuesFilters>;
}

const DEFAULT_FILTERS: AllIssuesFilters = {
  keyword: "",
  projectIds: [],
  issueTypeIds: [],
  statusIds: [],
  priorityIds: [],
  assigneeIds: [],
  dateRange: null,
  aiSummaryFilter: "all",
};

export function useAllIssuesData({ space, initialFilters }: UseAllIssuesDataOptions) {
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({ total: 0, closed: 0, progress: 0 });

  const [filters, setFiltersState] = useState<AllIssuesFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Options for selects
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<IssueOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<IssueOption[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<IssueOption[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<IssueOption[]>([]);

  const hasInitialized = useRef(false);

  const setFilters = useCallback((patch: Partial<AllIssuesFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Load all filter metadata in parallel
  const loadOptions = useCallback(async () => {
    if (!space) return;
    setOptionsLoading(true);
    const toastId = toast.loading("กำลังดาวน์โหลดข้อมูลตัวกรอง...");

    try {
      // Step 1: load projects + priorities (ไม่ต้องการ projectId)
      const [projectsRes, prioritiesRes] = await Promise.all([
        axios.get("/api/v1/backlog/projects", { params: { space } }),
        axios.get("/api/v1/backlog/priorities", { params: { space } }),
      ]);

      const projects: ProjectOption[] = (projectsRes.data?.data ?? []).map((p: any) => ({
        label: `[${p.projectKey}] ${p.name}`,
        value: p.id,
        projectKey: p.projectKey,
      }));
      const priorities: IssueOption[] = (prioritiesRes.data?.data ?? []).map((p: any) => ({
        label: p.name,
        value: p.id,
      }));

      setProjectOptions(projects);
      setPriorityOptions(priorities);

      if (projects.length === 0) {
        toast.success("ดาวน์โหลดข้อมูลตัวกรองสำเร็จ", { id: toastId });
        setOptionsLoading(false);
        return;
      }

      // Step 2: load issue-types, statuses, users จาก project แรก (สำหรับ dropdown)
      // ใช้ project แรกเป็น representative เพื่อให้ได้ options ที่สมเหตุสมผล
      const firstProjectId = projects[0].value;

      const [issueTypesRes, statusesRes, usersRes] = await Promise.all([
        axios.get("/api/v1/backlog/issue-types", {
          params: { space, projectId: firstProjectId },
        }),
        axios.get("/api/v1/backlog/project-statuses", {
          params: { space, projectId: firstProjectId },
        }),
        axios.get("/api/v1/backlog/users", {
          params: { space, projectId: firstProjectId },
        }),
      ]);

      const issueTypes: IssueOption[] = (issueTypesRes.data?.data ?? []).map((t: any) => ({
        label: t.name,
        value: t.id,
      }));
      const statuses: IssueOption[] = (statusesRes.data?.data ?? []).map((s: any) => ({
        label: s.name,
        value: s.id,
      }));
      const users: IssueOption[] = (usersRes.data?.data ?? []).map((u: any) => ({
        label: u.name,
        value: u.id,
      }));

      setIssueTypeOptions(issueTypes);
      setStatusOptions(statuses);
      setAssigneeOptions(users);

      // Default filters: เลือก project ทั้งหมด, status=Open, issueType=Bug
      const openStatusIds = statuses
        .filter((s) => /open/i.test(String(s.label)))
        .map((s) => Number(s.value));
      const bugTypeIds = issueTypes
        .filter((t) => /bug/i.test(String(t.label)))
        .map((t) => Number(t.value));

      setFiltersState((prev) => ({
        ...prev,
        projectIds: prev.projectIds.length > 0 ? prev.projectIds : projects.map((p) => p.value),
        statusIds: prev.statusIds.length > 0 ? prev.statusIds : openStatusIds,
        issueTypeIds: prev.issueTypeIds.length > 0 ? prev.issueTypeIds : bugTypeIds,
        priorityIds: prev.priorityIds.length > 0 ? prev.priorityIds : priorities.map((p) => Number(p.value)),
      }));

      toast.success("ดาวน์โหลดข้อมูลตัวกรองสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("ดาวน์โหลดข้อมูลตัวกรองไม่สำเร็จ", { id: toastId });
      console.error(error);
    } finally {
      setOptionsLoading(false);
    }
  }, [space]);

  // Reload users/issue-types when selected projects change
  const reloadOptionsForProjects = useCallback(
    async (selectedProjectIds: number[]) => {
      if (selectedProjectIds.length === 0 || !space) return;
      const firstId = selectedProjectIds[0];
      try {
        const [issueTypesRes, statusesRes, usersRes] = await Promise.all([
          axios.get("/api/v1/backlog/issue-types", {
            params: { space, projectId: firstId },
          }),
          axios.get("/api/v1/backlog/project-statuses", {
            params: { space, projectId: firstId },
          }),
          axios.get("/api/v1/backlog/users", {
            params: { space, projectId: firstId },
          }),
        ]);
        setIssueTypeOptions(
          (issueTypesRes.data?.data ?? []).map((t: any) => ({ label: t.name, value: t.id })),
        );
        setStatusOptions(
          (statusesRes.data?.data ?? []).map((s: any) => ({ label: s.name, value: s.id })),
        );
        setAssigneeOptions(
          (usersRes.data?.data ?? []).map((u: any) => ({ label: u.name, value: u.id })),
        );
      } catch {
        // ไม่แสดง toast เพื่อไม่รบกวน UX
      }
    },
    [space],
  );

  const loadIssues = useCallback(async () => {
    if (!space) return;
    setLoading(true);
    const toastId = toast.loading("กำลังค้นหาข้อมูลงานจาก Backlog...");

    try {
      const params: Record<string, any> = {
        space,
        page,
        count: pageSize,
        offset: (page - 1) * pageSize,
      };

      if (filters.keyword?.trim()) params.q = filters.keyword.trim();
      if (filters.projectIds?.length) params["projectId[]"] = filters.projectIds;
      if (filters.statusIds?.length) params["statusId[]"] = filters.statusIds;
      if (filters.issueTypeIds?.length) params["issueTypeId[]"] = filters.issueTypeIds;
      if (filters.priorityIds?.length) params["priorityId[]"] = filters.priorityIds;
      if (filters.assigneeIds?.length) params["assigneeId[]"] = filters.assigneeIds;
      if (filters.dateRange?.[0]) params.updatedSince = filters.dateRange[0].toISOString();
      if (filters.dateRange?.[1]) params.updatedUntil = filters.dateRange[1].toISOString();

      const response = await axios.get("/api/v1/backlog/issues", {
        params,
        paramsSerializer: (p) => {
          const parts: string[] = [];
          for (const [key, value] of Object.entries(p)) {
            if (Array.isArray(value)) {
              value.forEach((v) =>
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`),
              );
            } else if (value !== undefined && value !== null) {
              parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`);
            }
          }
          return parts.join("&");
        },
      });

      let items = response.data?.data?.items ?? [];
      const totalItems = Number(response.data?.data?.total) ?? 0;

      // Client-side AI filter
      if (filters.aiSummaryFilter === "with_ai") {
        items = items.filter((i: any) => i.description?.includes("AI"));
      } else if (filters.aiSummaryFilter === "without_ai") {
        items = items.filter((i: any) => !i.description?.includes("AI"));
      }

      setIssues(items);
      setTotal(totalItems);
      setSelectedRowKeys([]);
      toast.success("ดาวน์โหลดข้อมูล Backlog สำเร็จ", { id: toastId });

      // คำนวณ summary stats จากผลลัพธ์ที่ได้
      const closed = items.filter((i: any) =>
        /closed|done|completed|finish|สำเร็จ/i.test(i.status?.name ?? ""),
      ).length;
      setSummaryStats({
        total: totalItems,
        closed,
        progress: totalItems > 0 ? Math.round((closed / items.length) * 100) : 0,
      });
    } catch (error) {
      toast.error("ดาวน์โหลดข้อมูล Backlog ไม่สำเร็จ", { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [space, page, pageSize, filters]);

  // Init: load options แล้ว trigger loadIssues ผ่าน effect
  useEffect(() => {
    loadOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space]);

  // หลังจาก optionsLoading เสร็จครั้งแรก → loadIssues
  useEffect(() => {
    if (!optionsLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      loadIssues();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsLoading]);

  // Reload เมื่อ page/pageSize เปลี่ยน (หลัง init)
  useEffect(() => {
    if (hasInitialized.current) {
      loadIssues();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return {
    // Data
    issues,
    total,
    loading,
    optionsLoading,
    summaryStats,
    selectedRowKeys,
    setSelectedRowKeys,

    // Pagination
    page,
    pageSize,
    setPagination: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },

    // Filters
    filters,
    setFilters,
    resetFilters,

    // Options
    projectOptions,
    issueTypeOptions,
    statusOptions,
    priorityOptions,
    assigneeOptions,

    // Actions
    loadIssues,
    reloadOptionsForProjects,
  };
}
