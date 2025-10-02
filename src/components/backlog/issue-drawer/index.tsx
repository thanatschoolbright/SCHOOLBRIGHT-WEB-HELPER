"use client";
//** Drawer แสดง Issue ของโปรเจ็กต์ พร้อมฟิลเตอร์และ Pagination
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import AiUpdateDrawer from "./ai-update-drawer";
import BulkProgressModal, {
  BulkProgressStep,
  BulkStepStatus,
} from "@components/backlog/bulk-progress-modal";
import BulkUpdatePanel from "./bulk-update-panel";
import MilestoneManagerModal from "./milestone-manager-modal";
import type {
  AiUpdateState,
  BulkProgressStatus,
  BulkUpdatePayload,
  Issue,
  Milestone,
  MilestoneFormValues,
  OptionItem,
  PerIssueUpdateEntry,
  ProjectMetadata,
} from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  space: string;
  projectId: number | null;
  projectName?: string;
};

export default function IssueDrawer({
  open,
  onClose,
  space,
  projectId,
  projectName,
}: Props) {
  const [defaultStatusApplied, setDefaultStatusApplied] = useState(false);
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
  const [bulkStatusId, setBulkStatusId] = useState<number | undefined>(
    undefined
  );
  const [bulkPriorityId, setBulkPriorityId] = useState<number | undefined>(
    undefined
  );
  const [bulkStartDate, setBulkStartDate] = useState<Dayjs | null | undefined>(
    undefined
  );
  const [bulkDueDate, setBulkDueDate] = useState<Dayjs | null | undefined>(
    undefined
  );
  const [bulkMilestoneIds, setBulkMilestoneIds] = useState<
    number[] | undefined
  >(undefined);
  const [bulkCategoryIds, setBulkCategoryIds] = useState<number[] | undefined>(
    undefined
  );
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [milestoneManagerOpen, setMilestoneManagerOpen] = useState(false);
  const [milestoneManagerLoading, setMilestoneManagerLoading] = useState(false);
  const [milestoneManagerItems, setMilestoneManagerItems] = useState<
    Milestone[]
  >([]);
  const [milestoneSaving, setMilestoneSaving] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [milestoneDeletingId, setMilestoneDeletingId] = useState<number | null>(
    null
  );
  const [milestoneForm] = Form.useForm<MilestoneFormValues>();
  const [autoCategoryEnabled, setAutoCategoryEnabled] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<
    Record<string, BulkProgressStatus>
  >({});
  const [bulkSteps, setBulkSteps] = useState<BulkProgressStep[]>([]);

  //** เตรียมขั้นตอนแสดงผลบนโมดอล Progress
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

  const handleCloseBulkModal = () => {
    setBulkSteps([]);
  };

  // ฟิลเตอร์พื้นฐาน
  const [keyword, setKeyword] = useState("");
  const [statusIds, setStatusIds] = useState<string[]>([]);
  const [priorityIds, setPriorityIds] = useState<string[]>([]);
  const [issueTypeIds, setIssueTypeIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<any>();

  // options
  const [statusOptions, setStatusOptions] = useState<OptionItem[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<OptionItem[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<OptionItem[]>([]);
  const [milestoneOptions, setMilestoneOptions] = useState<OptionItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<OptionItem[]>([]);

  const formatDate = (s?: string | null) =>
    s ? new Date(s).toLocaleString() : "-";

  //** เรียก AI: แสดง toast loading เป็นขั้นตอน + เปิด Skeleton ระหว่างรอ
  const onClickAI = async (issue: Issue) => {
    const toastId = toast.loading("กำลังเตรียมข้อมูลเพื่อสรุปด้วย AI...");
    setAiModal({ open: true, issue, generating: true, newText: "" });
    try {
      // ขั้นตอน 1: ส่งคำขอไปยัง Gemini
      toast.message("ส่งคำขอไปยัง Gemini", { id: toastId });
      const response = await axios.post("/api/v1/ai/gemini/summarize", {
        summary: issue.summary,
        description: issue.description,
      });
      // ขั้นตอน 2: รับผลลัพธ์และแสดงตัวอย่าง
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

  //** อนุมัติการแก้ไข: แสดงสถานะทุกช่วง เพื่อให้ผู้ใช้ทราบขั้นตอน
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
      // reload issues
      loadIssues(page, pageSize);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "อัปเดตไม่สำเร็จ",
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
            return <LoadingOutlined style={{ color: "#1677ff" }} />;
          }
          if (status === "success") {
            return <CheckCircleOutlined style={{ color: "#30a46c" }} />;
          }
          if (status === "error") {
            return <CloseCircleOutlined style={{ color: "#d83b3b" }} />;
          }
          return null;
        },
      },
      {
        title: "Key",
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
        title: "Summary",
        dataIndex: "summary",
        key: "summary",
        ellipsis: true,
      },
      {
        title: "AI",
        key: "ai",
        width: 80,
        fixed: undefined,
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
        title: "Type",
        dataIndex: ["issueType", "name"],
        key: "issueType",
        width: 140,
      },
      {
        title: "Status",
        dataIndex: ["status", "name"],
        key: "status",
        width: 140,
        render: (v) => (v ? <Tag>{v}</Tag> : null),
      },
      {
        title: "Priority",
        dataIndex: ["priority", "name"],
        key: "priority",
        width: 120,
      },
      {
        title: "Category",
        key: "category",
        dataIndex: "category",
        width: 180,
        render: (arr?: Array<{ name: string }>) =>
          arr && arr.length
            ? arr.map((c) => <Tag key={c.name}>{c.name}</Tag>)
            : null,
      },
      {
        title: "Milestone",
        key: "milestone",
        dataIndex: "milestone",
        width: 180,
        render: (arr?: Array<{ name: string }>) =>
          arr && arr.length
            ? arr.map((m) => <Tag key={m.name}>{m.name}</Tag>)
            : null,
      },
      {
        title: "Assignee",
        dataIndex: ["assignee", "name"],
        key: "assignee",
        width: 180,
      },
      {
        title: "Start",
        dataIndex: "startDate",
        key: "startDate",
        width: 160,
        render: (v) => formatDate(v),
      },
      {
        title: "Due",
        dataIndex: "dueDate",
        key: "dueDate",
        width: 160,
        render: (v) => formatDate(v),
      },
      {
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 180,
        render: (v) => formatDate(v),
      },
      {
        title: "Updated",
        dataIndex: "updated",
        key: "updated",
        width: 180,
        render: (v) => formatDate(v),
      },
    ],
    [bulkProgress]
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
      preserveSelectedRowKeys: true,
    }),
    [selectedRowKeys]
  );

  const hasBulkUpdates =
    autoCategoryEnabled ||
    bulkStatusId !== undefined ||
    bulkPriorityId !== undefined ||
    bulkStartDate !== undefined ||
    bulkDueDate !== undefined ||
    bulkMilestoneIds !== undefined ||
    bulkCategoryIds !== undefined;

  //** รีเซ็ตค่าที่ใช้ในแบบฟอร์มอัปเดตเป็นกลุ่ม
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

  //** แปลงค่า Dayjs เป็นรูปแบบวันที่สตริงเพื่อส่งต่อให้ Backlog
  const toISODate = (value?: Dayjs | null) =>
    value ? value.format("YYYY-MM-DD") : null;

  //** คัดกรองค่า Milestone ที่เลือกไว้ให้ตรงกับรายการปัจจุบัน
  const syncMilestoneSelection = (list: Milestone[]) => {
    const availableIds = new Set(list.map((item) => Number(item.id)));
    setBulkMilestoneIds((previous) => {
      if (previous === undefined) return previous;
      return previous.filter((milestoneId) => availableIds.has(milestoneId));
    });
  };

  //** ดึงรายการ Milestone จาก Backlog เพื่อใช้ในทั้ง Dropdown และ Modal
  const fetchMilestones = async (showLoader = true) => {
    if (!projectId) return;
    if (showLoader) setMilestoneManagerLoading(true);
    try {
      const { data } = await axios.get(
        `/api/v1/backlog/projects/${projectId}/milestones`,
        {
          params: { space },
        }
      );
      const items = (data?.data as Milestone[]) || [];
      setMilestoneManagerItems(items);
      setMilestoneOptions(
        items.map((milestoneItem) => ({
          label: milestoneItem.name,
          value: Number(milestoneItem.id),
        }))
      );
      syncMilestoneSelection(items);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "โหลดรายการ Milestone ไม่สำเร็จ"
      );
    } finally {
      if (showLoader) setMilestoneManagerLoading(false);
    }
  };

  //** เปิด Modal จัดการ Milestone พร้อมเตรียมค่าเริ่มต้น
  const openMilestoneManagerPopup = () => {
    if (!projectId) {
      toast.error("กรุณาเลือกโปรเจ็กต์ก่อนจัดการ Milestone");
      return;
    }
    milestoneForm.resetFields();
    milestoneForm.setFieldsValue({
      archived: false,
    } as Partial<MilestoneFormValues>);
    setEditingMilestone(null);
    setMilestoneManagerOpen(true);
    fetchMilestones();
  };

  //** ปิด Modal จัดการ Milestone และคืนค่าแบบฟอร์ม
  const closeMilestoneManagerPopup = () => {
    setMilestoneManagerOpen(false);
    setEditingMilestone(null);
    milestoneForm.resetFields();
    milestoneForm.setFieldsValue({
      archived: false,
    } as Partial<MilestoneFormValues>);
  };

  //** จัดการบันทึกข้อมูล Milestone ที่เพิ่มหรือแก้ไข
  const handleSubmitMilestone = async (values: MilestoneFormValues) => {
    if (!projectId) return;
    setMilestoneSaving(true);
    const payload: Record<string, unknown> = {};
    if (values.name !== undefined) payload.name = values.name;
    if (values.description !== undefined)
      payload.description = values.description;
    if (values.startDate !== undefined)
      payload.startDate = toISODate(values.startDate);
    if (values.releaseDueDate !== undefined)
      payload.releaseDueDate = toISODate(values.releaseDueDate);
    if (values.archived !== undefined) payload.archived = values.archived;

    const isEdit = Boolean(editingMilestone);

    try {
      if (isEdit && editingMilestone) {
        await axios.patch(
          `/api/v1/backlog/projects/${projectId}/milestones/${editingMilestone.id}`,
          payload,
          { params: { space } }
        );
        toast.success("อัปเดต Milestone สำเร็จ");
      } else {
        await axios.post(
          `/api/v1/backlog/projects/${projectId}/milestones`,
          payload,
          { params: { space } }
        );
        toast.success("สร้าง Milestone สำเร็จ");
      }
      milestoneForm.resetFields();
      milestoneForm.setFieldsValue({
        archived: false,
      } as Partial<MilestoneFormValues>);
      setEditingMilestone(null);
      await fetchMilestones();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          (isEdit ? "อัปเดต Milestone ไม่สำเร็จ" : "สร้าง Milestone ไม่สำเร็จ")
      );
    } finally {
      setMilestoneSaving(false);
    }
  };

  //** เตรียมข้อมูล Milestone เข้าแบบฟอร์มเพื่อแก้ไข
  const handleEditMilestone = (milestoneItem: Milestone) => {
    setEditingMilestone(milestoneItem);
    milestoneForm.setFieldsValue({
      name: milestoneItem.name,
      description: milestoneItem.description ?? "",
      startDate: milestoneItem.startDate
        ? dayjs(milestoneItem.startDate)
        : null,
      releaseDueDate: milestoneItem.releaseDueDate
        ? dayjs(milestoneItem.releaseDueDate)
        : null,
      archived: Boolean(milestoneItem.archived),
    });
  };

  //** ยกเลิกการแก้ไขและคืนค่าฟอร์มให้เป็นค่าเริ่มต้น
  const handleCancelEditMilestone = () => {
    setEditingMilestone(null);
    milestoneForm.resetFields();
    milestoneForm.setFieldsValue({
      archived: false,
    } as Partial<MilestoneFormValues>);
  };

  //** ลบ Milestone ตามที่ผู้ใช้เลือกออกจาก Backlog
  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!projectId) return;
    setMilestoneDeletingId(milestoneId);
    try {
      await axios.delete(
        `/api/v1/backlog/projects/${projectId}/milestones/${milestoneId}`,
        { params: { space } }
      );
      if (editingMilestone?.id === milestoneId) {
        handleCancelEditMilestone();
      }
      toast.success("ลบ Milestone สำเร็จ");
      await fetchMilestones();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "ลบ Milestone ไม่สำเร็จ"
      );
    } finally {
      setMilestoneDeletingId(null);
    }
  };

  //** ส่งคำขออัปเดตแบบกลุ่มไปยัง Backlog
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
          : "กำลังอัปเดต Issues เป็นกลุ่ม..."
      );

      if (autoCategoryEnabled) {
        const selectedIssueMap = new Map(
          issues.map((issueItem) => {
            const key = issueItem.issueKey || String(issueItem.id);
            return [key, issueItem];
          })
        );

        const selectedIssues = selectedRowKeys
          .map((key) => {
            const issueKey = String(key);
            return selectedIssueMap.get(issueKey);
          })
          .filter((item): item is Issue => Boolean(item));

        if (!selectedIssues.length) {
          updateStepStatus("ai", "error", "ไม่พบข้อมูล Issue ที่เลือก");
          throw new Error("ไม่พบข้อมูล Issue ที่เลือก");
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
            { id: toastId }
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

  const loadIssues = async (
    p = page,
    ps = pageSize,
    override?: {
      statusIds?: string[];
    }
  ) => {
    if (!space || !projectId) return;
    const id = toast.loading("กำลังโหลด Issues...");
    setLoading(true);
    try {
      const params: Record<string, any> = {
        space,
        projectId,
        page: p,
        count: ps,
      };
      const effectiveStatusIds = override?.statusIds ?? statusIds;
      if (keyword) params.q = keyword;
      if (effectiveStatusIds.length) params.statusId = effectiveStatusIds;
      if (priorityIds.length) params.priorityId = priorityIds;
      if (issueTypeIds.length) params.issueTypeId = issueTypeIds;
      if (dateRange?.length === 2) {
        params.updatedSince = dateRange[0]?.toISOString();
        params.updatedUntil = dateRange[1]?.toISOString();
      }

      const { data } = await axios.get("/api/v1/backlog/issues", { params });
      const items = (data?.data?.items as Issue[]) || [];
      setIssues(items);
      setTotal(Number(data?.data?.total) || 0);
      setSelectedRowKeys((prev) =>
        prev.filter((key) =>
          items.some(
            (issue) => (issue.issueKey || String(issue.id)) === String(key)
          )
        )
      );
      setBulkProgress((prev) => {
        const next: Record<
          string,
          "idle" | "processing" | "success" | "error"
        > = {};
        items.forEach((issue) => {
          const key = issue.issueKey || String(issue.id);
          if (prev[key]) {
            next[key] = prev[key];
          }
        });
        return next;
      });
      toast.success("โหลด Issues สำเร็จ", { id });
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e.message || "โหลด Issues ไม่สำเร็จ",
        { id }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      if (defaultStatusApplied) {
        loadIssues(1, pageSize);
      }
    }
    if (!open) {
      setSelectedRowKeys([]);
      clearBulkForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, defaultStatusApplied]);

  useEffect(() => {
    if (open) {
      setDefaultStatusApplied(false);
      setStatusIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // โหลดตัวเลือกฟิลเตอร์เมื่อเปิด Drawer
  useEffect(() => {
    const loadOptions = async () => {
      if (!open || !space) return;

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
            .map((statusItem) => String(statusItem.id));

          setStatusIds(openStatusIds);
          setDefaultStatusApplied(true);
          await loadIssues(1, pageSize, { statusIds: openStatusIds });
        }

        setPriorityOptions(
          (prioritiesResponse?.data?.data || []).map((priorityItem: any) => ({
            label: priorityItem.name,
            value: Number(priorityItem.id),
          }))
        );
        setIssueTypeOptions(
          (issueTypesResponse?.data?.data || []).map((typeItem: any) => ({
            label: typeItem.name,
            value: Number(typeItem.id),
          }))
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "โหลดตัวเลือกฟิลเตอร์ไม่สำเร็จ"
        );
        setStatusOptions([]);
        setPriorityOptions([]);
        setIssueTypeOptions([]);
      }

      if (!projectId) {
        setCategoryOptions([]);
        setMilestoneOptions([]);
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
        setMilestoneManagerItems(milestoneList);
        syncMilestoneSelection(milestoneList);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "โหลด Milestone/Category ไม่สำเร็จ"
        );
        setCategoryOptions([]);
        setMilestoneOptions([]);
        setMilestoneManagerItems([]);
        syncMilestoneSelection([]);
      }
    };

    loadOptions();
  }, [open, space, projectId, defaultStatusApplied, pageSize]);

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

  return (
    <Drawer
      title={`Issues • ${projectName ?? projectId ?? "-"}`}
      open={open}
      onClose={onClose}
      width="90vw"
    >
      {/* แถบฟิลเตอร์ */}
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <Space wrap size={8}>
          <Input
            placeholder="ค้นหา (keyword)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="Status"
            value={statusIds}
            onChange={(values) => {
              setStatusIds(values as string[]);
              loadIssues(1, pageSize);
            }}
            options={statusOptions}
            style={{ minWidth: 220 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="Priority"
            value={priorityIds}
            onChange={(values) => {
              setPriorityIds(values as string[]);
              loadIssues(1, pageSize);
            }}
            options={priorityOptions}
            style={{ minWidth: 220 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="Issue Type"
            value={issueTypeIds}
            onChange={(values) => {
              setIssueTypeIds(values as string[]);
              loadIssues(1, pageSize);
            }}
            options={issueTypeOptions}
            style={{ minWidth: 220 }}
          />
          <DatePicker.RangePicker
            onChange={(range) => {
              setDateRange(range);
              loadIssues(1, pageSize);
            }}
          />
          <Button type="primary" onClick={() => loadIssues(1, pageSize)}>
            Apply
          </Button>
          <Button
            onClick={() => {
              setKeyword("");
              setStatusIds([]);
              setPriorityIds([]);
              setIssueTypeIds([]);
              setDateRange(null);
              loadIssues(1, pageSize);
            }}
          >
            Reset
          </Button>
        </Space>

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
          onAutoCategoryChange={(checked) => {
            setAutoCategoryEnabled(checked);
            if (checked) setBulkCategoryIds(undefined);
          }}
          onCategoryChange={(values) =>
            setBulkCategoryIds(values && values.length ? values : [])
          }
          onClear={clearBulkForm}
          onDueDateChange={(value) => setBulkDueDate(value ?? null)}
          onManageMilestone={openMilestoneManagerPopup}
          onMilestoneChange={(values) =>
            setBulkMilestoneIds(values && values.length ? values : [])
          }
          onPriorityChange={(value) => setBulkPriorityId(value)}
          onStartDateChange={(value) => setBulkStartDate(value ?? null)}
          onStatusChange={(value) => setBulkStatusId(value)}
          onSubmit={handleBulkUpdate}
          priorityOptions={priorityOptions}
          selectedCount={selectedRowKeys.length}
          statusOptions={statusOptions}
          submitDisabled={
            !selectedRowKeys.length || !hasBulkUpdates || bulkUpdating
          }
        />

        <Table<Issue>
          bordered
          loading={loading}
          columns={columns}
          dataSource={issues}
          rowKey={(r) => r.issueKey || String(r.id)}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ whiteSpace: "pre-wrap" }}>
                <Typography.Text strong>Description</Typography.Text>
                <br />
                <Typography.Text>{record.description || "-"}</Typography.Text>
              </div>
            ),
          }}
          pagination={{
            total,
            current: page,
            pageSize,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              loadIssues(p, ps);
            },
          }}
        />
      </Space>

      <MilestoneManagerModal
        editingMilestone={editingMilestone}
        form={milestoneForm}
        loading={milestoneManagerLoading}
        milestones={milestoneManagerItems}
        onCancel={closeMilestoneManagerPopup}
        onDelete={handleDeleteMilestone}
        onEdit={handleEditMilestone}
        onFinish={handleSubmitMilestone}
        onResetEdit={handleCancelEditMilestone}
        open={milestoneManagerOpen}
        saving={milestoneSaving}
        selectedDeletingId={milestoneDeletingId}
      />

      <AiUpdateDrawer
        aiState={aiModal}
        onApprove={doApproveUpdate}
        onClose={handleAiClose}
        onRegenerate={handleAiRegenerate}
        onUpdateText={(value) =>
          setAiModal((prev) => ({ ...prev, newText: value }))
        }
      />
    </Drawer>
  );
}
