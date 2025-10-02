"use client";
//** Drawer แสดง Issue ของโปรเจ็กต์ พร้อมฟิลเตอร์และ Pagination
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import AutoCategoryToggle from "@components/backlog/auto-category-toggle";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Switch,
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

type Issue = {
  id: number;
  issueKey: string;
  summary: string;
  description?: string;
  created?: string;
  updated?: string;
  status?: { id: number; name: string };
  priority?: { id: number; name: string };
  assignee?: { id: number; name: string };
  issueType?: { id: number; name: string };
  category?: Array<{ id: number; name: string }>;
  versions?: Array<{ id: number; name: string }>;
  milestone?: Array<{ id: number; name: string }>;
  startDate?: string | null;
  dueDate?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  space: string;
  projectId: number | null;
  projectName?: string;
};

type OptionItem = {
  label: string;
  value: number;
};

type ProjectMetadata = {
  categories: Array<{ id: number; name: string }>;
  milestones: Milestone[];
};

type Milestone = {
  id: number;
  name: string;
  description?: string | null;
  startDate?: string | null;
  releaseDueDate?: string | null;
  archived?: boolean;
};

type MilestoneFormValues = {
  name: string;
  description?: string;
  startDate?: Dayjs | null;
  releaseDueDate?: Dayjs | null;
  archived?: boolean;
};

export default function IssueDrawer({
  open,
  onClose,
  space,
  projectId,
  projectName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [aiModal, setAiModal] = useState<{
    open: boolean;
    issue: Issue | null;
    generating: boolean;
    newText: string;
  }>({ open: false, issue: null, generating: false, newText: "" });
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
  const [bulkProgress, setBulkProgress] = useState<Record<
    string,
    "idle" | "processing" | "success" | "error"
  >>({});

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
    type BulkUpdatePayload = {
      statusId?: number;
      priorityId?: number;
      startDate?: string | null;
      dueDate?: string | null;
      milestoneId?: number[] | number;
      categoryId?: number[] | number;
    };
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

    try {
      toastId = toast.loading(
        autoCategoryEnabled
          ? "กำลังสรุป Category ด้วย Gemini..."
          : "กำลังอัปเดต Issues เป็นกลุ่ม..."
      );

      if (autoCategoryEnabled) {
        if (!categoryOptions.length) {
          throw new Error("ยังไม่มีรายการ Category สำหรับโปรเจ็กต์นี้");
        }

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
          throw new Error("ไม่พบข้อมูล Issue ที่เลือก");
        }

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

        const sharedEntriesUpdates: BulkUpdatePayload = { ...sharedUpdates };
        delete sharedEntriesUpdates.categoryId;

        const missingIssues: string[] = [];
        const perIssueEntries = selectedRowKeys
          .map((key) => {
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
          .filter((item): item is {
            keyStr: string,
            payload: {
              space: string;
              entries: Array<{ issueKeyOrId: string | number; updates: BulkUpdatePayload }>;
            };
          }>(() => true);

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

        for (const entry of perIssueEntries) {
          toast.message(`กำลังอัปเดต ${entry.keyStr}`, { id: toastId });
          try {
            await axios.post("/api/v1/backlog/issues/bulk-update", entry.payload);
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

        if (failedCount === 0) {
          toast.success(`อัปเดต ${successCount} งานสำเร็จ`, { id: toastId });
        } else {
          toast.error(
            `สำเร็จ ${successCount} งาน, ล้มเหลว ${failedCount} งาน`,
            { id: toastId }
          );
        }
        await loadIssues(page, pageSize);
      } else {
        let successCount = 0;
        let failedCount = 0;

        for (const key of selectedRowKeys) {
          const keyStr = String(key);
          toast.message(`กำลังอัปเดต ${keyStr}`, { id: toastId });
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

        if (failedCount === 0) {
          toast.success(`อัปเดต ${successCount} งานสำเร็จ`, { id: toastId });
        } else {
          toast.error(
            `สำเร็จ ${successCount} งาน, ล้มเหลว ${failedCount} งาน`,
            { id: toastId }
          );
        }
        await loadIssues(page, pageSize);
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

  const loadIssues = async (p = page, ps = pageSize) => {
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
      if (keyword) params.q = keyword;
      if (statusIds.length) params.statusId = statusIds;
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
        const next: Record<string, "idle" | "processing" | "success" | "error"> = {};
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
      loadIssues(1, pageSize);
    }
    if (!open) {
      setSelectedRowKeys([]);
      clearBulkForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

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

        setStatusOptions(
          (statusesResponse?.data?.data || []).map((statusItem: any) => ({
            label: statusItem.name,
            value: Number(statusItem.id),
          }))
        );
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
  }, [open, space, projectId]);

  useEffect(() => {
    setBulkProgress((prev) => {
      const next: Record<string, "idle" | "processing" | "success" | "error"> = {};
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

        <Card
          size="small"
          styles={{ body: { padding: 12 } }}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #f0f2f5",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          }}
          title={<Typography.Text strong>Bulk Update</Typography.Text>}
        >
          <Space wrap size={8} align="center">
            <Typography.Text type="secondary">
              เลือก Issue ด้วย Checkbox เพื่ออัปเดตแบบกลุ่ม (
              {selectedRowKeys.length})
            </Typography.Text>
            <Select
              allowClear
              placeholder="Status ใหม่"
              value={bulkStatusId}
              onChange={(value) => setBulkStatusId(value as number | undefined)}
              options={statusOptions}
              style={{ minWidth: 200 }}
            />
            <Select
              allowClear
              placeholder="Priority ใหม่"
              value={bulkPriorityId}
              onChange={(value) =>
                setBulkPriorityId(value as number | undefined)
              }
              options={priorityOptions}
              style={{ minWidth: 200 }}
            />
            <Space size={6} align="center">
              <Select
                mode="multiple"
                allowClear
                placeholder="Milestone ใหม่"
                value={
                  bulkMilestoneIds === undefined ? undefined : bulkMilestoneIds
                }
                onChange={(values) =>
                  setBulkMilestoneIds(() => {
                    const valueList = Array.isArray(values)
                      ? (values as Array<number | string>)
                      : [];
                    const normalizedValues = valueList.map((value) =>
                      Number(value)
                    );
                    return normalizedValues.length ? normalizedValues : [];
                  })
                }
                options={milestoneOptions}
                style={{ minWidth: 220 }}
              />
              <Button onClick={openMilestoneManagerPopup}>
                [จัดการ Milestone]
              </Button>
            </Space>
            <AutoCategoryToggle
              disabled={bulkUpdating || autoCategoryLoading || !categoryOptions.length}
              enabled={autoCategoryEnabled}
              onChange={(checked) => {
                setAutoCategoryEnabled(checked);
                if (checked) setBulkCategoryIds(undefined);
              }}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="Category ใหม่"
              value={
                bulkCategoryIds === undefined ? undefined : bulkCategoryIds
              }
              onChange={(values) =>
                setBulkCategoryIds(() => {
                  const valueList = Array.isArray(values)
                    ? (values as Array<number | string>)
                    : [];
                  const normalizedValues = valueList.map((value) =>
                    Number(value)
                  );
                  return normalizedValues.length ? normalizedValues : [];
                })
              }
              options={categoryOptions}
              style={{ minWidth: 220 }}
              disabled={autoCategoryEnabled}
            />
            <DatePicker
              allowClear
              placeholder="Start Date"
              value={bulkStartDate === undefined ? null : bulkStartDate}
              onChange={(value) => setBulkStartDate(value ?? null)}
              style={{ minWidth: 160 }}
            />
            <DatePicker
              allowClear
              placeholder="Due Date"
              value={bulkDueDate === undefined ? null : bulkDueDate}
              onChange={(value) => setBulkDueDate(value ?? null)}
              style={{ minWidth: 160 }}
            />
            <Space>
              <Button
                type="primary"
                onClick={handleBulkUpdate}
                disabled={
                  !selectedRowKeys.length ||
                  !hasBulkUpdates ||
                  bulkUpdating ||
                  (autoCategoryEnabled && !categoryOptions.length)
                }
                loading={bulkUpdating}
              >
                Bulk Update
              </Button>
              <Button onClick={clearBulkForm} disabled={bulkUpdating}>
                Clear
              </Button>
            </Space>
          </Space>
        </Card>

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

      <Modal
        title="จัดการ Milestone"
        open={milestoneManagerOpen}
        onCancel={closeMilestoneManagerPopup}
        footer={null}
        width={600}
        destroyOnHidden={false}
        styles={{ content: { borderRadius: 20, padding: 24 } }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          เพิ่ม แก้ไข หรือลบ Milestone
          เพื่อใช้กับการอัปเดตแบบกลุ่มและการกรองข้อมูล
        </Typography.Paragraph>

        <Form
          layout="vertical"
          form={milestoneForm}
          onFinish={handleSubmitMilestone}
          initialValues={{ archived: false }}
        >
          <Form.Item
            label="ชื่อ Milestone"
            name="name"
            rules={[{ required: true, message: "กรุณากรอกชื่อ Milestone" }]}
          >
            <Input placeholder="เช่น Sprint 01" />
          </Form.Item>
          <Form.Item label="รายละเอียด" name="description">
            <Input.TextArea
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            />
          </Form.Item>
          <Space size={12} style={{ width: "100%" }} wrap>
            <Form.Item label="วันเริ่ม" name="startDate">
              <DatePicker allowClear />
            </Form.Item>
            <Form.Item label="วันกำหนดส่ง" name="releaseDueDate">
              <DatePicker allowClear />
            </Form.Item>
            <Form.Item label="สถานะ" name="archived" valuePropName="checked">
              <Switch checkedChildren="Archived" unCheckedChildren="Active" />
            </Form.Item>
          </Space>
          <Space>
            <Button type="primary" htmlType="submit" loading={milestoneSaving}>
              {editingMilestone ? "บันทึกการแก้ไข" : "เพิ่ม Milestone"}
            </Button>
            {editingMilestone && (
              <Button
                onClick={handleCancelEditMilestone}
                disabled={milestoneSaving}
              >
                ยกเลิกการแก้ไข
              </Button>
            )}
          </Space>
        </Form>

        <Divider />

        <List
          loading={milestoneManagerLoading}
          dataSource={milestoneManagerItems}
          rowKey={(item) => String(item.id)}
          locale={{ emptyText: "ยังไม่มี Milestone" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  size="small"
                  onClick={() => handleEditMilestone(item)}
                >
                  แก้ไข
                </Button>,
                <Popconfirm
                  key="delete"
                  title="ยืนยันการลบ Milestone"
                  okText="ลบ"
                  cancelText="ยกเลิก"
                  onConfirm={() => handleDeleteMilestone(item.id)}
                >
                  <Button
                    danger
                    size="small"
                    loading={milestoneDeletingId === item.id}
                  >
                    ลบ
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space size={8} wrap>
                    <Typography.Text strong>{item.name}</Typography.Text>
                    {item.archived ? <Tag color="default">Archived</Tag> : null}
                  </Space>
                }
                description={
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Typography.Text>{item.description || "-"}</Typography.Text>
                    <Typography.Text type="secondary">
                      เริ่ม: {formatDate(item.startDate)} • กำหนดส่ง:{" "}
                      {formatDate(item.releaseDueDate)}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* AI Modal */}
      {aiModal.open && (
        <Drawer
          title={`AI Update • ${aiModal.issue?.issueKey || "-"}`}
          open={aiModal.open}
          onClose={() =>
            setAiModal({
              open: false,
              issue: null,
              generating: false,
              newText: "",
            })
          }
          width={900}
        >
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Typography.Text type="secondary">
              ระบบจะช่วยสรุป Task เป็น .MD ก่อนอนุมัติ (Minimal/อ่านง่าย)
            </Typography.Text>

            {/* Section 1: ข้อความเดิม */}
            <Card
              size="small"
              styles={{ body: { padding: 12 } }}
              title={<Typography.Text strong>ข้อความเดิม</Typography.Text>}
            >
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 200,
                  background: "#fafafa",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {aiModal.issue?.description || "-"}
              </div>
            </Card>

            {/* Section 2: สรุปโดย AI */}
            <Card
              size="small"
              styles={{ body: { padding: 12 } }}
              title={<Typography.Text strong>สรุปโดย AI (.MD)</Typography.Text>}
            >
              {aiModal.generating ? (
                <div
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <Skeleton active paragraph={{ rows: 10 }} />
                </div>
              ) : (
                <textarea
                  value={aiModal.newText}
                  onChange={(event) =>
                    setAiModal((state) => ({
                      ...state,
                      newText: event.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    minHeight: 240,
                    borderRadius: 10,
                    border: "1px solid #eee",
                    padding: 12,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                />
              )}
            </Card>

            {/* Actions */}
            <Divider style={{ margin: "8px 0 0" }} />
            <Space style={{ justifyContent: "flex-end", width: "100%" }}>
              <Button
                onClick={() => onClickAI(aiModal.issue!)}
                loading={aiModal.generating}
                disabled={aiModal.generating}
              >
                Regenerate
              </Button>
              <Button
                type="primary"
                onClick={doApproveUpdate}
                disabled={!aiModal.newText || aiModal.generating}
              >
                อนุมัติการแก้ไข
              </Button>
            </Space>
          </Space>
        </Drawer>
      )}
    </Drawer>
  );
}
