"use client";

import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Layout,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import type { Dayjs } from "dayjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  BulkProgressStep,
  BulkStepStatus,
} from "@components/backlog/bulk-progress-modal";
import AiUpdateDrawer from "@components/backlog/issue-drawer/ai-update-drawer";
import BulkUpdatePanel from "@components/backlog/issue-drawer/bulk-update-panel";
import AutoCategoryToggle from "@components/backlog/auto-category-toggle";
import type {
  AiUpdateState,
  BulkProgressStatus,
  BulkUpdatePayload,
  Issue,
  Milestone,
  OptionItem,
  PerIssueUpdateEntry,
  ProjectMetadata,
} from "@components/backlog/issue-drawer/types";
import DashboardLayout from "@/components/layouts/backend-layout";

const { Content } = Layout;

//** กำหนดสไตล์สำหรับ Select ที่ต้องการความกว้างเพิ่ม **
const wideFilterItemStyle: CSSProperties = {
  flex: "1 1 320px",
  minWidth: 280,
};

type DateRangeValue = [Dayjs | null, Dayjs | null] | null;
type IssueFilterOverrides = {
  dateRange?: DateRangeValue;
  issueTypeIds?: number[];
  keyword?: string;
  priorityIds?: number[];
  statusIds?: number[];
};

export default function ProjectIssuesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const { token } = theme.useToken();
  const {
    colorBgLayout,
    colorBgContainer,
    colorBorderSecondary,
    colorPrimary,
    colorSuccess,
    colorError,
    colorBgBase,
  } = token;
  const isDarkMode = colorBgBase?.toLowerCase() === "#141414";
  const layoutStyle = useMemo(
    () => ({
      minHeight: "100vh",
      background: colorBgLayout,
    }),
    [colorBgLayout]
  );
  const elevatedCardStyle = useMemo(
    () => ({
      background: colorBgContainer,
      border: `1px solid ${colorBorderSecondary}`,
      borderRadius: 20,
      boxShadow: isDarkMode
        ? "0 12px 28px rgba(0,0,0,0.45)"
        : "0 12px 28px rgba(15, 23, 42, 0.05)",
    }),
    [colorBgContainer, colorBorderSecondary, isDarkMode]
  );
  const listCardStyle = useMemo(
    () => ({
      background: colorBgContainer,
      border: `1px solid ${colorBorderSecondary}`,
      borderRadius: 20,
    }),
    [colorBgContainer, colorBorderSecondary]
  );

  const projectIdParam = params?.projectId;
  const projectId =
    typeof projectIdParam === "string" ? Number(projectIdParam) : NaN;
  const space = searchParams?.get("space") ?? "";
  const projectName = searchParams?.get("name") ?? "";

  const projectReady =
    Number.isFinite(projectId) && projectId > 0 && Boolean(space);

  const [defaultStatusApplied, setDefaultStatusApplied] = useState(false);
  const [defaultPriorityApplied, setDefaultPriorityApplied] = useState(false);
  const [defaultIssueTypeApplied, setDefaultIssueTypeApplied] = useState(false);
  //** สถานะโหลดสำหรับข้อมูลตัวกรองและตัวเลือกต่าง ๆ **
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [aiModal, setAiModal] = useState<AiUpdateState>({
    generating: false,
    issue: null,
    newText: "",
    open: false,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [bulkStatusId, setBulkStatusId] = useState<number | undefined>();
  const [bulkPriorityId, setBulkPriorityId] = useState<number | undefined>();
  const [bulkStartDate, setBulkStartDate] = useState<
    Dayjs | null | undefined
  >();
  const [bulkDueDate, setBulkDueDate] = useState<Dayjs | null | undefined>();
  const [bulkMilestoneIds, setBulkMilestoneIds] = useState<
    number[] | undefined
  >();
  const [bulkCategoryIds, setBulkCategoryIds] = useState<
    number[] | undefined
  >();
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [autoCategoryEnabled, setAutoCategoryEnabled] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<
    Record<string, BulkProgressStatus>
  >({});
  const [, setBulkSteps] = useState<BulkProgressStep[]>([]);
  const [bulkTabKey, setBulkTabKey] = useState<"ai" | "manual">("ai");

  const [keyword, setKeyword] = useState("");
  const [statusIds, setStatusIds] = useState<number[]>([]);
  const [priorityIds, setPriorityIds] = useState<number[]>([]);
  const [issueTypeIds, setIssueTypeIds] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);

  const [statusOptions, setStatusOptions] = useState<OptionItem[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<OptionItem[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<OptionItem[]>([]);
  const [milestoneOptions, setMilestoneOptions] = useState<OptionItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<OptionItem[]>([]);

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "-";

  const handleAutoCategoryToggle = (checked: boolean) => {
    setAutoCategoryEnabled(checked);
    if (checked) setBulkCategoryIds(undefined);
  };

  const initializeBulkSteps = (useAI: boolean) => {
    const steps: BulkProgressStep[] = useAI
      ? [
          { key: "prepare", title: "ตรวจสอบข้อมูล", status: "process" },
          { key: "ai", title: "Gemini กำลังสรุป Category", status: "wait" },
          { key: "update", title: "กำลังอัปเดตไปยัง Backlog", status: "wait" },
        ]
      : [
          { key: "prepare", title: "ตรวจสอบข้อมูล", status: "process" },
          { key: "update", title: "กำลังอัปเดตไปยัง Backlog", status: "wait" },
        ];
    setBulkSteps(steps);
  };

  const updateStepStatus = (
    key: string,
    status: BulkStepStatus,
    description?: string
  ) => {
    setBulkSteps((prev) =>
      prev.map((step) =>
        step.key === key
          ? {
              ...step,
              status,
              ...(description !== undefined ? { description } : {}),
            }
          : step
      )
    );
  };

  const updateStepDescription = (key: string, description: string) => {
    setBulkSteps((prev) =>
      prev.map((step) => (step.key === key ? { ...step, description } : step))
    );
  };

  const handleKeywordSearch = () => {
    setPage(1);
    loadIssues(1, pageSize, { keyword });
  };

  const handleResetFilters = () => {
    setKeyword("");
    setStatusIds([]);
    setPriorityIds([]);
    setIssueTypeIds([]);
    setDateRange(null);
    setPage(1);
    loadIssues(1, pageSize, {
      keyword: "",
      statusIds: [],
      priorityIds: [],
      issueTypeIds: [],
      dateRange: null,
    });
  };

  const handleStatusFilterChange = (values: number[] | undefined) => {
    const nextValues = Array.isArray(values) ? values : [];
    setStatusIds(nextValues);
  };

  const handlePriorityFilterChange = (values: number[] | undefined) => {
    const nextValues = Array.isArray(values) ? values : [];
    setPriorityIds(nextValues);
  };

  const handleIssueTypeFilterChange = (values: number[] | undefined) => {
    const nextValues = Array.isArray(values) ? values : [];
    setIssueTypeIds(nextValues);
  };

  const handleDateRangeChange: RangePickerProps["onChange"] = (range) => {
    const normalizedRange: DateRangeValue =
      range && Array.isArray(range) && range.length === 2 ? range : null;
    setDateRange(normalizedRange);
  };

  const syncMilestoneSelection = (list: Milestone[]) => {
    const availableIds = new Set(list.map((item) => Number(item.id)));
    setBulkMilestoneIds((previous) => {
      if (previous === undefined) return previous;
      return previous.filter((milestoneId) => availableIds.has(milestoneId));
    });
  };

  const clearBulkForm = () => {
    setBulkStatusId(undefined);
    setBulkPriorityId(undefined);
    setBulkStartDate(undefined);
    setBulkDueDate(undefined);
    setBulkMilestoneIds(undefined);
    setBulkCategoryIds(undefined);
    setAutoCategoryEnabled(false);
    setBulkProgress({});
    setBulkSteps([]);
  };

  const hasBulkUpdates =
    autoCategoryEnabled ||
    bulkStatusId !== undefined ||
    bulkPriorityId !== undefined ||
    bulkStartDate !== undefined ||
    bulkDueDate !== undefined ||
    bulkMilestoneIds !== undefined ||
    bulkCategoryIds !== undefined;

  const onClickAI = async (issue: Issue) => {
    const toastId = toast.loading("กำลังเตรียมข้อมูลเพื่อสรุปด้วย AI...");
    setAiModal({ open: true, issue, generating: true, newText: "" });
    try {
      toast.message("ส่งคำขอไปยัง Gemini", { id: toastId });
      const response = await axios.post("/api/v1/ai/gemini/summarize", {
        summary: issue.summary,
        description: issue.description,
      });
      const markdown: string = response?.data?.data?.markdown || "";
      setAiModal((state) => ({
        ...state,
        newText: markdown,
        generating: false,
      }));
      toast.success("ได้รับผลจาก AI แล้ว", { id: toastId });
    } catch (error: any) {
      setAiModal((state) => ({ ...state, generating: false }));
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "เรียก AI ไม่สำเร็จ",
        { id: toastId }
      );
    }
  };

  const columns: ColumnsType<Issue> = useMemo(
    () => [
      {
        title: "",
        dataIndex: "progress",
        key: "progress",
        width: 48,
        render: (_, record) => {
          const key = record.issueKey || String(record.id);
          const status = bulkProgress[key];
          if (status === "processing") {
            return <LoadingOutlined style={{ color: colorPrimary }} />;
          }
          if (status === "success") {
            return <CheckCircleOutlined style={{ color: colorSuccess }} />;
          }
          if (status === "error") {
            return <CloseCircleOutlined style={{ color: colorError }} />;
          }
          return null;
        },
      },
      {
        title: "รหัสงาน",
        dataIndex: "issueKey",
        key: "issueKey",
        width: 140,
        fixed: "left",
        render: (key: string) => (
          <Tooltip title="เปิดงานนี้บน Backlog">
            <a
              href={`https://${space}.backlog.com/view/${key}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {key}
            </a>
          </Tooltip>
        ),
      },
      {
        title: "สรุป",
        dataIndex: "summary",
        key: "summary",
        ellipsis: true,
      },
      {
        title: "ผู้ช่วย AI",
        key: "ai",
        width: 80,
        render: (_, record) => (
          <Tooltip title="ใช้ AI สรุป/ปรับแต่งคำอธิบายเป็น .MD">
            <Button
              size="small"
              icon={<RobotOutlined />}
              onClick={() => onClickAI(record)}
            />
          </Tooltip>
        ),
      },
      {
        title: "ประเภท",
        dataIndex: ["issueType", "name"],
        key: "issueType",
        width: 140,
      },
      {
        title: "สถานะ",
        dataIndex: ["status", "name"],
        key: "status",
        width: 140,
        render: (v) => (v ? <Tag>{v}</Tag> : null),
      },
      {
        title: "ความสำคัญ",
        dataIndex: ["priority", "name"],
        key: "priority",
        width: 120,
      },
      {
        title: "หมวดหมู่",
        key: "category",
        dataIndex: "category",
        width: 180,
        render: (arr?: Array<{ name: string }>) =>
          arr && arr.length
            ? arr.map((c) => <Tag key={c.name}>{c.name}</Tag>)
            : null,
      },
      {
        title: "ไมล์สโตน",
        key: "milestone",
        dataIndex: "milestone",
        width: 180,
        render: (arr?: Array<{ name: string }>) =>
          arr && arr.length
            ? arr.map((m) => <Tag key={m.name}>{m.name}</Tag>)
            : null,
      },
      {
        title: "ผู้รับผิดชอบ",
        dataIndex: ["assignee", "name"],
        key: "assignee",
        width: 180,
      },
      {
        title: "วันเริ่ม",
        dataIndex: "startDate",
        key: "startDate",
        width: 160,
        render: (v) => formatDate(v),
      },
      {
        title: "วันครบกำหนด",
        dataIndex: "dueDate",
        key: "dueDate",
        width: 160,
        render: (v) => formatDate(v),
      },
      {
        title: "วันที่สร้าง",
        dataIndex: "created",
        key: "created",
        width: 180,
        render: (v) => formatDate(v),
      },
      {
        title: "อัปเดตล่าสุด",
        dataIndex: "updated",
        key: "updated",
        width: 180,
        render: (v) => formatDate(v),
      },
    ],
    [bulkProgress, colorError, colorPrimary, colorSuccess, space]
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
      preserveSelectedRowKeys: true,
    }),
    [selectedRowKeys]
  );

  const doApproveUpdate = async () => {
    if (!aiModal.issue) return;
    const toastId = toast.loading("กำลังอัปเดตคำอธิบายด้วย AI...");
    try {
      toast.message("กำลังส่งคำอธิบายใหม่ไปยัง Backlog", { id: toastId });
      await axios.post("/api/v1/backlog/issues/update", {
        space,
        issueKeyOrId: aiModal.issue.issueKey || aiModal.issue.id,
        description: aiModal.newText,
      });
      toast.success("อัปเดต Issue สำเร็จ", { id: toastId });
      setAiModal({ open: false, issue: null, generating: false, newText: "" });
      loadIssues(page, pageSize);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "อัปเดตไม่สำเร็จ",
        { id: toastId }
      );
    }
  };

  const loadIssues = async (
    targetPage = page,
    targetPageSize = pageSize,
    overrides: IssueFilterOverrides = {}
  ) => {
    if (!projectReady) return;

    const toastId = toast.loading("กำลังโหลดงาน...");
    setLoading(true);

    try {
      const effectiveKeyword = overrides.keyword ?? keyword;
      const effectiveStatusIds = overrides.statusIds ?? statusIds;
      const effectivePriorityIds = overrides.priorityIds ?? priorityIds;
      const effectiveIssueTypeIds = overrides.issueTypeIds ?? issueTypeIds;
      const effectiveDateRange = overrides.dateRange ?? dateRange;

      const params: Record<string, unknown> = {
        space,
        projectId,
        page: targetPage,
        count: targetPageSize,
        offset: Math.max(0, (targetPage - 1) * targetPageSize),
      };

      const keywordParam = effectiveKeyword?.trim();
      if (keywordParam) {
        params.q = keywordParam;
        const issueKeyCandidates =
          keywordParam.toUpperCase().match(/[A-Z0-9_]+-[0-9]+/gu) ?? [];
        if (issueKeyCandidates.length) {
          params["issueKey[]"] = Array.from(new Set(issueKeyCandidates));
        }
      }
      if (effectiveStatusIds?.length) params.statusId = effectiveStatusIds;
      if (effectivePriorityIds?.length)
        params.priorityId = effectivePriorityIds;
      if (effectiveIssueTypeIds?.length)
        params.issueTypeId = effectiveIssueTypeIds;
      if (
        effectiveDateRange &&
        effectiveDateRange[0] &&
        effectiveDateRange[1]
      ) {
        params.updatedSince = effectiveDateRange[0].toISOString();
        params.updatedUntil = effectiveDateRange[1].toISOString();
      }

      const response = await axios.get("/api/v1/backlog/issues", { params });
      const items = (response.data?.data?.items as Issue[]) || [];
      const totalItems = Number(response.data?.data?.total) || 0;

      setIssues(items);
      setTotal(totalItems);
      setSelectedRowKeys((previousKeys) =>
        previousKeys.filter((key) =>
          items.some(
            (issue) => (issue.issueKey || String(issue.id)) === String(key)
          )
        )
      );
      setBulkProgress((previousProgress) => {
        const next: Record<string, BulkProgressStatus> = {};
        items.forEach((issue) => {
          const issueKey = issue.issueKey || String(issue.id);
          if (previousProgress[issueKey]) {
            next[issueKey] = previousProgress[issueKey];
          }
        });
        return next;
      });

      toast.success("โหลดงานสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "โหลดงานไม่สำเร็จ",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!space || !selectedRowKeys.length) return;
    initializeBulkSteps(autoCategoryEnabled);
    const sharedUpdates: BulkUpdatePayload = {};
    if (bulkStatusId !== undefined) sharedUpdates.statusId = bulkStatusId;
    if (bulkPriorityId !== undefined) sharedUpdates.priorityId = bulkPriorityId;
    if (bulkStartDate !== undefined)
      sharedUpdates.startDate = bulkStartDate
        ? bulkStartDate.format("YYYY-MM-DD")
        : null;
    if (bulkDueDate !== undefined)
      sharedUpdates.dueDate = bulkDueDate
        ? bulkDueDate.format("YYYY-MM-DD")
        : null;
    if (bulkMilestoneIds !== undefined)
      sharedUpdates.milestoneId = bulkMilestoneIds;
    if (!autoCategoryEnabled && bulkCategoryIds !== undefined)
      sharedUpdates.categoryId = bulkCategoryIds;

    if (!autoCategoryEnabled && !Object.keys(sharedUpdates).length) {
      toast.error("กรุณาเลือกข้อมูลที่จะอัปเดต");
      updateStepStatus("prepare", "error", "กรุณาเลือกข้อมูลที่จะอัปเดต");
      return;
    }

    if (autoCategoryEnabled && !categoryOptions.length) {
      toast.error("ยังไม่มีรายการ Category สำหรับโปรเจ็กต์นี้");
      updateStepStatus(
        "prepare",
        "error",
        "ยังไม่มีรายการ Category สำหรับโปรเจ็กต์นี้"
      );
      return;
    }

    let toastId: string | number | undefined;
    setBulkUpdating(true);
    if (autoCategoryEnabled) setAutoCategoryLoading(true);
    setBulkProgress((prev) => {
      const next = { ...prev };
      selectedRowKeys.forEach((key) => {
        next[String(key)] = "processing";
      });
      return next;
    });
    updateStepStatus("prepare", "finish");

    try {
      toastId = toast.loading(
        autoCategoryEnabled
          ? "กำลังสรุป Category ด้วย Gemini..."
          : "กำลังอัปเดตงานแบบกลุ่ม..."
      );

      if (autoCategoryEnabled) {
        const selectedIssueMap = new Map(
          issues.map((issueItem) => {
            const key = issueItem.issueKey || String(issueItem.id);
            return [key, issueItem];
          })
        );

        const selectedIssues = selectedRowKeys
          .map((key) => selectedIssueMap.get(String(key)))
          .filter((item): item is Issue => Boolean(item));

        if (!selectedIssues.length) {
          updateStepStatus("ai", "error", "ไม่พบข้อมูลงานที่เลือก");
          throw new Error("ไม่พบข้อมูลงานที่เลือก");
        }

        updateStepStatus("ai", "process");
        toast.message("กำลังวิเคราะห์ Category ด้วย Gemini", { id: toastId });

        const { data: autoCategoryResponse } = await axios.post(
          "/api/v1/ai/gemini/auto-category",
          {
            issues: selectedIssues.map((item) => ({
              issueKey: item.issueKey || String(item.id),
              summary: item.summary,
              description: item.description,
            })),
            categories: categoryOptions.map((option) => ({
              id: option.value,
              name: option.label,
            })),
          }
        );

        const suggestions =
          (autoCategoryResponse?.data?.suggestions as Array<{
            issueKey: string;
            categoryIds: number[];
            reason?: string;
          }>) || [];

        const suggestionMap = new Map(
          suggestions.map((suggestion) => [suggestion.issueKey, suggestion])
        );
        updateStepStatus("ai", "finish", "Gemini วิเคราะห์สำเร็จ");

        const sharedEntriesUpdates: BulkUpdatePayload = { ...sharedUpdates };
        delete sharedEntriesUpdates.categoryId;

        const missingIssues: string[] = [];
        const perIssueEntries = selectedRowKeys
          .map<PerIssueUpdateEntry | null>((key) => {
            const keyStr = String(key);
            const target = selectedIssueMap.get(keyStr);
            if (!target) {
              missingIssues.push(keyStr);
              return null;
            }
            const suggestion = suggestionMap.get(keyStr);
            const categoryIds = (suggestion?.categoryIds || []).filter(
              (value) => !Number.isNaN(Number(value))
            );
            const updatesForIssue: BulkUpdatePayload = {
              ...sharedEntriesUpdates,
            };
            if (categoryIds.length) {
              updatesForIssue.categoryId = categoryIds;
            }
            if (!Object.keys(updatesForIssue).length) {
              missingIssues.push(keyStr);
              return null;
            }
            return {
              keyStr,
              payload: {
                space,
                entries: [
                  {
                    issueKeyOrId: target.issueKey || target.id,
                    updates: updatesForIssue,
                  },
                ],
              },
            };
          })
          .filter((item): item is PerIssueUpdateEntry => item !== null);

        if (missingIssues.length) {
          setBulkProgress((prev) => {
            const next = { ...prev };
            missingIssues.forEach((key) => {
              next[key] = "error";
            });
            return next;
          });
          toast.error(
            `Gemini ไม่ได้เสนอ Category สำหรับ ${missingIssues.length} งาน`,
            { id: toastId }
          );
        }

        if (!perIssueEntries.length) {
          throw new Error("Gemini ไม่ได้เสนอ Category สำหรับงานที่เลือก");
        }

        let successCount = 0;
        let failedCount = 0;

        updateStepStatus(
          "update",
          "process",
          `กำลังอัปเดต 0/${perIssueEntries.length} งาน`
        );

        for (let index = 0; index < perIssueEntries.length; index += 1) {
          const entry = perIssueEntries[index];
          const order = index + 1;
          toast.message(`กำลังอัปเดต ${entry.keyStr}`, { id: toastId });
          updateStepDescription(
            "update",
            `กำลังอัปเดต ${order}/${perIssueEntries.length} งาน`
          );
          try {
            await axios.post(
              "/api/v1/backlog/issues/bulk-update",
              entry.payload
            );
            successCount += 1;
            setBulkProgress((prev) => ({
              ...prev,
              [entry.keyStr]: "success",
            }));
          } catch (errorPerIssue: any) {
            failedCount += 1;
            setBulkProgress((prev) => ({
              ...prev,
              [entry.keyStr]: "error",
            }));
            toast.error(
              errorPerIssue?.response?.data?.message ||
                errorPerIssue?.message ||
                `อัปเดต ${entry.keyStr} ไม่สำเร็จ`,
              { id: toastId }
            );
          }
        }

        const totalFailed = failedCount + missingIssues.length;

        updateStepStatus(
          "update",
          totalFailed ? "error" : "finish",
          `สำเร็จ ${successCount}/${perIssueEntries.length} งาน (พลาด ${totalFailed} งาน)`
        );

        if (totalFailed === 0) {
          toast.success(`อัปเดต ${successCount} งานสำเร็จ`, { id: toastId });
        } else {
          toast.error(`สำเร็จ ${successCount} งาน, พลาด ${totalFailed} งาน`, {
            id: toastId,
          });
        }
        await loadIssues(page, pageSize);
        setSelectedRowKeys([]);
      } else {
        let successCount = 0;
        let failedCount = 0;

        updateStepStatus(
          "update",
          "process",
          `กำลังอัปเดต 0/${selectedRowKeys.length} งาน`
        );

        for (const key of selectedRowKeys) {
          const keyStr = String(key);
          const order = successCount + failedCount + 1;
          toast.message(`กำลังอัปเดต ${keyStr}`, { id: toastId });
          updateStepDescription(
            "update",
            `กำลังอัปเดต ${order}/${selectedRowKeys.length} งาน`
          );
          try {
            await axios.post("/api/v1/backlog/issues/bulk-update", {
              space,
              issues: [keyStr],
              updates: sharedUpdates,
            });
            successCount += 1;
            setBulkProgress((prev) => ({ ...prev, [keyStr]: "success" }));
          } catch (errorPerIssue: any) {
            failedCount += 1;
            setBulkProgress((prev) => ({ ...prev, [keyStr]: "error" }));
            toast.error(
              errorPerIssue?.response?.data?.message ||
                errorPerIssue?.message ||
                `อัปเดต ${keyStr} ไม่สำเร็จ`,
              { id: toastId }
            );
          }
        }

        updateStepStatus(
          "update",
          failedCount ? "error" : "finish",
          `สำเร็จ ${successCount}/${selectedRowKeys.length} งาน`
        );

        if (failedCount === 0) {
          toast.success(`อัปเดต ${successCount} งานสำเร็จ`, { id: toastId });
        } else {
          toast.error(
            `สำเร็จ ${successCount} งาน, ล้มเหลว ${failedCount} งาน`,
            {
              id: toastId,
            }
          );
        }
        await loadIssues(page, pageSize);
        setSelectedRowKeys([]);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "อัปเดตแบบกลุ่มไม่สำเร็จ";
      setBulkProgress((prev) => {
        const next = { ...prev };
        selectedRowKeys.forEach((key) => {
          const keyStr = String(key);
          if (next[keyStr] === "processing") {
            next[keyStr] = "error";
          }
        });
        return next;
      });
      if (toastId !== undefined) {
        toast.error(message, { id: toastId });
      } else {
        toast.error(message);
      }
    } finally {
      setBulkUpdating(false);
      setAutoCategoryLoading(false);
    }
  };

  const handleAiClose = () => {
    setAiModal({ generating: false, issue: null, newText: "", open: false });
  };

  const handleAiRegenerate = () => {
    if (aiModal.issue) {
      onClickAI(aiModal.issue);
    }
  };

  useEffect(() => {
    if (!projectReady) return;

    //** โหลดข้อมูลตัวกรองและเมตาดาตาโปรเจ็กต์ พร้อมแสดงสถานะผ่าน toast **
    const loadOptions = async () => {
      setOptionsLoading(true);
      const toastId = toast.loading("กำลังเตรียมข้อมูลประกอบ...");

      try {
        const [statusesResponse, prioritiesResponse, issueTypesResponse] =
          await Promise.all([
            projectId
              ? axios.get("/api/v1/backlog/project-statuses", {
                  params: { space, projectId },
                })
              : axios.get("/api/v1/backlog/statuses", { params: { space } }),
            axios.get("/api/v1/backlog/priorities", { params: { space } }),
            projectId
              ? axios.get("/api/v1/backlog/issue-types", {
                  params: { space, projectId },
                })
              : Promise.resolve({ data: { data: [] } }),
          ]);

        const rawStatuses: Array<{ id: number; name: string }> =
          statusesResponse?.data?.data || [];
        setStatusOptions(
          rawStatuses.map((statusItem) => ({
            label: statusItem.name,
            value: Number(statusItem.id),
          }))
        );

        if (!defaultStatusApplied) {
          const openStatusIds = rawStatuses
            .filter((statusItem) => !/closed/i.test(statusItem?.name ?? ""))
            .map((statusItem) => Number(statusItem.id));

          setStatusIds(openStatusIds);
          setDefaultStatusApplied(true);
          await loadIssues(1, pageSize, { statusIds: openStatusIds });
        }

        const priorityList: Array<{ id: number; name: string }> =
          prioritiesResponse?.data?.data || [];
        const priorityOptionList = priorityList.map((priorityItem) => ({
          label: priorityItem.name,
          value: Number(priorityItem.id),
        }));
        setPriorityOptions(priorityOptionList);
        if (!defaultPriorityApplied && priorityOptionList.length) {
          setPriorityIds(priorityOptionList.map((item) => Number(item.value)));
          setDefaultPriorityApplied(true);
        }

        const issueTypeList: Array<{ id: number; name: string }> =
          issueTypesResponse?.data?.data || [];
        const issueTypeOptionList = issueTypeList.map((typeItem) => ({
          label: typeItem.name,
          value: Number(typeItem.id),
        }));
        setIssueTypeOptions(issueTypeOptionList);
        if (!defaultIssueTypeApplied && issueTypeOptionList.length) {
          setIssueTypeIds(
            issueTypeOptionList.map((item) => Number(item.value))
          );
          setDefaultIssueTypeApplied(true);
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "โหลดตัวเลือกฟิลเตอร์ไม่สำเร็จ";
        toast.error(errorMessage, { id: toastId });
        setStatusOptions([]);
        setPriorityOptions([]);
        setIssueTypeOptions([]);
        setOptionsLoading(false);
        return;
      }

      if (!projectId) {
        setCategoryOptions([]);
        setMilestoneOptions([]);
        toast.success("โหลดข้อมูลประกอบสำเร็จ", { id: toastId });
        setOptionsLoading(false);
        return;
      }

      try {
        const metadataResponse = await axios.get(
          `/api/v1/backlog/projects/${projectId}/metadata`,
          {
            params: { space },
          }
        );
        const metadata = (metadataResponse?.data?.data || {
          categories: [],
          milestones: [],
        }) as ProjectMetadata;
        setCategoryOptions(
          (metadata.categories || []).map((categoryItem) => ({
            label: categoryItem.name,
            value: Number(categoryItem.id),
          }))
        );
        const milestoneList = metadata.milestones || [];
        setMilestoneOptions(
          milestoneList.map((milestoneItem) => ({
            label: milestoneItem.name,
            value: Number(milestoneItem.id),
          }))
        );
        syncMilestoneSelection(milestoneList);
        toast.success("โหลดข้อมูลประกอบสำเร็จ", { id: toastId });
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "โหลด Milestone/Category ไม่สำเร็จ";
        toast.error(errorMessage, { id: toastId });
        setCategoryOptions([]);
        setMilestoneOptions([]);
        syncMilestoneSelection([]);
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectReady, space, projectId, pageSize]);

  useEffect(() => {
    setBulkProgress((prev) => {
      const next: Record<string, BulkProgressStatus> = {};
      selectedRowKeys.forEach((key) => {
        const keyStr = String(key);
        next[keyStr] = prev[keyStr] ?? "idle";
      });
      return next;
    });
  }, [selectedRowKeys]);

  //** ปิดโหมด AI เมื่อสลับไปแท็บอัปเดตทั่วไป **
  useEffect(() => {
    if (bulkTabKey === "manual" && autoCategoryEnabled) {
      setAutoCategoryEnabled(false);
    }
  }, [autoCategoryEnabled, bulkTabKey]);

  useEffect(() => {
    setPage(1);
    setDefaultStatusApplied(false);
    setDefaultPriorityApplied(false);
    setDefaultIssueTypeApplied(false);
    setStatusIds([]);
    setPriorityIds([]);
    setIssueTypeIds([]);
  }, [projectId, space]);

  if (!projectReady) {
    return (
      <Layout style={layoutStyle}>
        <Content
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Space direction="vertical" size={12} align="center">
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              ไม่พบข้อมูลโปรเจ็กต์หรือ space
            </Typography.Title>
            <Typography.Text type="secondary">
              โปรดกลับไปเลือกโปรเจ็กต์อีกครั้งจากหน้า Backlog
            </Typography.Text>
            <Button
              type="primary"
              onClick={() => router.push("/backlogs/report")}
            >
              กลับไปหน้า Backlog
            </Button>
          </Space>
        </Content>
      </Layout>
    );
  }

  return (
    <DashboardLayout>
      <Layout style={layoutStyle}>
        <Content style={{ padding: 32 }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space align="center" size={12}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
              >
                ย้อนกลับ
              </Button>
              <div>
                <Typography.Title level={3} style={{ marginBottom: 0 }}>
                  งาน • {projectName || projectId}
                </Typography.Title>
                <Typography.Text type="secondary">
                  Space: {space}
                </Typography.Text>
              </div>
            </Space>

            <Card
              size="small"
              styles={{
                body: {
                  padding: 16,
                },
              }}
              style={elevatedCardStyle}
              title="ตัวกรองข้อมูล"
            >
              <Skeleton
                active
                loading={optionsLoading}
                paragraph={{ rows: 4 }}
                title={false}
              >
                <Tabs
                  defaultActiveKey="primary"
                  items={[
                    {
                      key: "primary",
                      label: "ตัวกรองหลัก",
                      children: (
                        <Space
                          direction="vertical"
                          size={12}
                          style={{ width: "100%" }}
                        >
                          <Space size={12} style={{ width: "100%" }} wrap>
                            <Space
                              direction="vertical"
                              size={6}
                              style={{ flex: "1 1 240px", minWidth: 200 }}
                            >
                              <Typography.Text type="secondary">
                                คำค้นหา
                              </Typography.Text>
                              <Input
                                placeholder="ค้นหา (คีย์เวิร์ด)"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onPressEnter={handleKeywordSearch}
                              />
                            </Space>
                            <Space
                              direction="vertical"
                              size={6}
                              style={{ flex: "1 1 260px", minWidth: 240 }}
                            >
                              <Typography.Text type="secondary">
                                สถานะ
                              </Typography.Text>
                              <Select
                                mode="multiple"
                                allowClear
                                placeholder="เลือกสถานะ"
                                value={statusIds}
                                onChange={handleStatusFilterChange}
                                options={statusOptions}
                              />
                            </Space>
                            <Space
                              direction="vertical"
                              size={6}
                              style={wideFilterItemStyle}
                            >
                              <Typography.Text type="secondary">
                                ความสำคัญ
                              </Typography.Text>
                              <Select
                                mode="multiple"
                                allowClear
                                placeholder="เลือกความสำคัญ"
                                value={priorityIds}
                                onChange={handlePriorityFilterChange}
                                options={priorityOptions}
                              />
                            </Space>
                          </Space>
                        </Space>
                      ),
                    },
                    {
                      key: "advanced",
                      label: "ตัวกรองเพิ่มเติม",
                      children: (
                        <Space
                          direction="vertical"
                          size={12}
                          style={{ width: "100%" }}
                        >
                          <Space size={12} style={{ width: "100%" }} wrap>
                            <Space
                              direction="vertical"
                              size={6}
                              style={wideFilterItemStyle}
                            >
                              <Typography.Text type="secondary">
                                ประเภทงาน
                              </Typography.Text>
                              <Select
                                mode="multiple"
                                allowClear
                                placeholder="เลือกประเภทงาน"
                                value={issueTypeIds}
                                onChange={handleIssueTypeFilterChange}
                                options={issueTypeOptions}
                              />
                            </Space>
                            <Space
                              direction="vertical"
                              size={6}
                              style={{ flex: "1 1 260px", minWidth: 200 }}
                            >
                              <Typography.Text type="secondary">
                                ช่วงวันที่อัปเดต
                              </Typography.Text>
                              <DatePicker.RangePicker
                                value={dateRange ?? null}
                                onChange={handleDateRangeChange}
                              />
                            </Space>
                          </Space>
                        </Space>
                      ),
                    },
                  ]}
                />
                {/* * ปุ่มล้างค่าและแสดงผล * */}
                <Space
                  align="center"
                  size={8}
                  style={{ marginLeft: "auto", marginTop: 12 }}
                >
                  <Button onClick={handleResetFilters}>ล้างค่า</Button>
                  <Button type="primary" onClick={handleKeywordSearch}>
                    แสดงผล
                  </Button>
                </Space>
              </Skeleton>
            </Card>

            <Card
              size="small"
              styles={{ body: { padding: 16 } }}
              style={elevatedCardStyle}
              title="การอัปเดตแบบกลุ่ม"
            >
              {/* * แท็บควบคุมการอัปเดตงานแบบกลุ่ม * */}
              <Skeleton
                active
                loading={optionsLoading}
                paragraph={{ rows: 6 }}
                title={false}
              >
                <Tabs
                  activeKey={bulkTabKey}
                  onChange={(key) => setBulkTabKey(key as "ai" | "manual")}
                  items={[
                    {
                      key: "ai",
                      label: "อัปเดตด้วย AI",
                      children: (
                        <Space
                          direction="vertical"
                          size={12}
                          style={{ width: "100%" }}
                        >
                          <Typography.Text type="secondary">
                            เปิดใช้งานเพื่อให้ Gemini
                            ช่วยเลือกหมวดหมู่ก่อนส่งคำสั่งอัปเดตแบบกลุ่ม
                          </Typography.Text>
                          <AutoCategoryToggle
                            disabled={
                              autoCategoryLoading ||
                              bulkUpdating ||
                              !categoryOptions.length
                            }
                            enabled={autoCategoryEnabled}
                            onChange={handleAutoCategoryToggle}
                          />
                          <BulkUpdatePanel
                            autoCategoryEnabled={autoCategoryEnabled}
                            autoCategoryLoading={autoCategoryLoading}
                            bulkCategoryIds={bulkCategoryIds}
                            bulkDueDate={bulkDueDate}
                            bulkMilestoneIds={bulkMilestoneIds}
                            bulkPriorityId={bulkPriorityId}
                            bulkStartDate={bulkStartDate}
                            bulkStatusId={bulkStatusId}
                            bulkUpdating={bulkUpdating}
                            categoryOptions={categoryOptions}
                            milestoneOptions={milestoneOptions}
                            onAutoCategoryChange={handleAutoCategoryToggle}
                            onCategoryChange={(values) =>
                              setBulkCategoryIds(
                                values && values.length ? values : []
                              )
                            }
                            onClear={clearBulkForm}
                            onDueDateChange={(value) =>
                              setBulkDueDate(value ?? null)
                            }
                            onManageMilestone={() => {
                              router.push(
                                `/backlogs/projects/${projectId}/milestones?space=${encodeURIComponent(
                                  space
                                )}&name=${encodeURIComponent(projectName)}`
                              );
                            }}
                            onMilestoneChange={(values) =>
                              setBulkMilestoneIds(
                                values && values.length ? values : []
                              )
                            }
                            onPriorityChange={(value) =>
                              setBulkPriorityId(value)
                            }
                            onStartDateChange={(value) =>
                              setBulkStartDate(value ?? null)
                            }
                            onStatusChange={(value) => setBulkStatusId(value)}
                            onSubmit={handleBulkUpdate}
                            priorityOptions={priorityOptions}
                            selectedCount={selectedRowKeys.length}
                            statusOptions={statusOptions}
                            submitDisabled={
                              !selectedRowKeys.length ||
                              !hasBulkUpdates ||
                              bulkUpdating
                            }
                            showAutoCategoryToggle={false}
                          />
                        </Space>
                      ),
                    },
                    {
                      key: "manual",
                      label: "อัปเดตแบบกลุ่ม",
                      children: (
                        <BulkUpdatePanel
                          autoCategoryEnabled={false}
                          autoCategoryLoading={false}
                          bulkCategoryIds={bulkCategoryIds}
                          bulkDueDate={bulkDueDate}
                          bulkMilestoneIds={bulkMilestoneIds}
                          bulkPriorityId={bulkPriorityId}
                          bulkStartDate={bulkStartDate}
                          bulkStatusId={bulkStatusId}
                          bulkUpdating={bulkUpdating}
                          categoryOptions={categoryOptions}
                          milestoneOptions={milestoneOptions}
                          onAutoCategoryChange={handleAutoCategoryToggle}
                          onCategoryChange={(values) =>
                            setBulkCategoryIds(
                              values && values.length ? values : []
                            )
                          }
                          onClear={clearBulkForm}
                          onDueDateChange={(value) =>
                            setBulkDueDate(value ?? null)
                          }
                          onManageMilestone={() => {
                            router.push(
                              `/backlogs/projects/${projectId}/milestones?space=${encodeURIComponent(
                                space
                              )}&name=${encodeURIComponent(projectName)}`
                            );
                          }}
                          onMilestoneChange={(values) =>
                            setBulkMilestoneIds(
                              values && values.length ? values : []
                            )
                          }
                          onPriorityChange={(value) => setBulkPriorityId(value)}
                          onStartDateChange={(value) =>
                            setBulkStartDate(value ?? null)
                          }
                          onStatusChange={(value) => setBulkStatusId(value)}
                          onSubmit={handleBulkUpdate}
                          priorityOptions={priorityOptions}
                          selectedCount={selectedRowKeys.length}
                          statusOptions={statusOptions}
                          submitDisabled={
                            !selectedRowKeys.length ||
                            !hasBulkUpdates ||
                            bulkUpdating
                          }
                          showAutoCategoryToggle={false}
                        />
                      ),
                    },
                  ]}
                />
              </Skeleton>
            </Card>

            <Card
              size="small"
              style={listCardStyle}
              styles={{ body: { padding: 0 } }}
              title="รายการงานทั้งหมด"
            >
              {loading ? (
                <Space direction="vertical" size={12} style={{ padding: 24 }}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton
                      key={`issues-skeleton-${index}`}
                      active
                      paragraph={{ rows: 1 }}
                      title={false}
                    />
                  ))}
                </Space>
              ) : (
                <Table<Issue>
                  bordered
                  columns={columns}
                  dataSource={issues}
                  rowKey={(r) => r.issueKey || String(r.id)}
                  rowSelection={rowSelection}
                  scroll={{ x: 1200 }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div style={{ whiteSpace: "pre-wrap", padding: 16 }}>
                        <Typography.Text strong>Description</Typography.Text>
                        <br />
                        <Typography.Text>
                          {record.description || "-"}
                        </Typography.Text>
                      </div>
                    ),
                  }}
                  pagination={{
                    total,
                    current: page,
                    pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ["20", "50", "100", "200", "500"],
                    onChange: (p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                      loadIssues(p, ps);
                    },
                  }}
                />
              )}
            </Card>
          </Space>

          <AiUpdateDrawer
            aiState={aiModal}
            onApprove={doApproveUpdate}
            onClose={handleAiClose}
            onRegenerate={handleAiRegenerate}
            onUpdateText={(value) =>
              setAiModal((prev) => ({ ...prev, newText: value }))
            }
          />
        </Content>
      </Layout>
    </DashboardLayout>
  );
}
