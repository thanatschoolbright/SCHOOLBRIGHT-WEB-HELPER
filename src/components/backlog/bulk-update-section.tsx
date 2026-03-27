"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  RobotOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Modal,
  Progress,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import ColoredBadge from "@/components/ant-design/table/table-badge-color";
import AutoCategoryToggle from "@components/backlog/auto-category-toggle";
import AutoAiDescriptionToggle from "@components/backlog/auto-description-toggle";
import BulkUpdatePanel from "@components/backlog/issue-drawer/bulk-update-panel";
import { Issue } from "@components/backlog/issue-drawer/types";
import { setSelectedRowKeys } from "@stores/reducers/issues-slice";
import { RootState } from "@stores/store";

interface BulkUpdateSectionProps {
  elevatedCardStyle: React.CSSProperties;
  projectName: string;
  projectId: number;
  space: string;
  onUpdateComplete: () => void;
  // New props for minimize/progress capabilities
  onProgressUpdate?: (progress: {
    percent: number;
    success: number;
    total: number;
    status: "idle" | "processing" | "completed" | "error";
  }) => void;
  onRequestMinimize?: () => void;
  minimized?: boolean; // ** Prop for minimization state
}

const BulkUpdateSection: React.FC<BulkUpdateSectionProps> = ({
  elevatedCardStyle,
  projectName,
  projectId,
  space,
  onUpdateComplete,
  onProgressUpdate,
}) => {
  const { token } = theme.useToken();
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    optionsLoading,
    categoryOptions,
    milestoneOptions,
    priorityOptions,
    statusOptions,
    selectedRowKeys,
    issues,
  } = useSelector((state: RootState) => state.issues);

  // ! กองรายการงานเฉพาะที่ถูกเลือกไว้
  const selectedIssuesData = useMemo(() => {
    return issues.filter((issue) =>
      selectedRowKeys.some((key) => String(key) === String(issue.id)),
    );
  }, [issues, selectedRowKeys]);

  const [autoCategoryEnabled, setAutoCategoryEnabled] = useState(false);
  const [autoGeminiEnabled, setAutoGeminiEnabled] = useState(false);
  const [autoChatGptEnabled, setAutoChatGptEnabled] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [processingResults, setProcessingResults] = useState<
    Array<{
      issueKeyOrId: string | number;
      title?: string;
      summary?: string; // Markdown description
      aiSummary?: string; // New summary/title with tag
      status: "pending" | "success" | "error" | "queue";
      message?: string;
      detail?: string;
      statusCode?: number;
      index: number;
    }>
  >([]);
  const perIssuePayloadsRef = useRef<any[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title?: string;
    content?: string;
    statusCode?: number;
  }>({ open: false });

  // * Report Progress to Parent
  useEffect(() => {
    if (!onProgressUpdate) return;
    const total = processingResults.length;
    if (total === 0) {
      onProgressUpdate({ percent: 0, success: 0, total: 0, status: "idle" });
      return;
    }
    const successList = processingResults.filter(
      (r) => r.status === "success" || r.status === "error",
    );
    const success = successList.length;
    const percent = Math.round((success / total) * 100);
    const hasError = processingResults.some((r) => r.status === "error");
    const isCompleted = success === total;

    let status: "idle" | "processing" | "completed" | "error" = "processing";
    if (isCompleted) {
      status = hasError ? "error" : "completed";
    }

    onProgressUpdate({ percent, success, total, status });
  }, [processingResults, onProgressUpdate]);

  const formatErrorDetail = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const extractErrorMessage = (error: any) => {
    const data = error?.response?.data;
    const message =
      data?.message_th ||
      data?.message_en ||
      data?.message ||
      data?.error?.message ||
      error?.message ||
      "เกิดข้อผิดพลาด";
    const detailSource = data?.error ?? data ?? error?.response ?? error;
    const detail = formatErrorDetail(detailSource);
    const statusCode = error?.response?.status || data?.status;

    return { message, detail, statusCode };
  };

  const processSingle = async (
    payload: any,
    selectedIssueMap: Map<string, Issue>,
  ) => {
    if (!payload) return { success: false, error: "ไม่พบข้อมูลงาน" };
    const issue = selectedIssueMap.get(String(payload.issueKeyOrId));
    try {
      if (!issue) throw new Error("ไม่พบข้อมูลงาน");
      const endpoint = autoChatGptEnabled
        ? "/api/v1/ai/chatgpt/summarize"
        : "/api/v1/ai/gemini/summarize";

      const response = await axios.post(endpoint, {
        summary: issue.summary,
        description: issue.description,
        // Send full issue details for better Context
        details: issue,
        issueKey: issue.issueKey || String(issue.id),
      });

      const markdown = response?.data?.data?.markdown || "";
      const aiSummary = response?.data?.data?.summary;

      payload.updates.description = markdown;

      // * อัปเดต Summary หากมีการสรุปเนื้อหาใหม่ (และมี Tag [สรุปด้วย LIGHT AI])
      if (aiSummary) {
        payload.updates.summary = aiSummary;
      }

      setProcessingResults((prev) =>
        prev.map((r) =>
          String(r.issueKeyOrId) === String(payload?.issueKeyOrId)
            ? {
                ...r,
                status: "success",
                summary: markdown,
                aiSummary: aiSummary, // เพิ่ม aiSummary ใน Result State เพื่อนำไปแสดงในตาราง
                message: undefined,
                detail: undefined,
                statusCode: undefined,
              }
            : r,
        ),
      );
      return { success: true, payload };
    } catch (err: any) {
      const { message, detail, statusCode } = extractErrorMessage(err);
      setProcessingResults((prev) =>
        prev.map((r) =>
          String(r.issueKeyOrId) === String(payload?.issueKeyOrId)
            ? {
                ...r,
                status: "error",
                message,
                detail,
                statusCode,
              }
            : r,
        ),
      );
      return { success: false, error: message, detail };
    }
  };

  const [bulkStatusId, setBulkStatusId] = useState<number | undefined>();
  const [bulkPriorityId, setBulkPriorityId] = useState<number | undefined>();
  const [bulkStartDate, setBulkStartDate] = useState<any>();
  const [bulkDueDate, setBulkDueDate] = useState<any>();
  const [bulkMilestoneIds, setBulkMilestoneIds] = useState<
    number[] | undefined
  >();
  const [bulkCategoryIds, setBulkCategoryIds] = useState<
    number[] | undefined
  >();

  const handleAutoCategoryToggle = (checked: boolean) => {
    setAutoCategoryEnabled(checked);
    if (checked) setBulkCategoryIds(undefined);
  };

  const handleAutoGeminiToggle = (checked: boolean) => {
    setAutoGeminiEnabled(checked);
    if (checked) setAutoChatGptEnabled(false);
  };

  const handleAutoChatGptToggle = (checked: boolean) => {
    setAutoChatGptEnabled(checked);
    if (checked) setAutoGeminiEnabled(false);
  };

  const clearBulkForm = () => {
    setBulkStatusId(undefined);
    setBulkPriorityId(undefined);
    setBulkStartDate(undefined);
    setBulkDueDate(undefined);
    setBulkMilestoneIds(undefined);
    setBulkCategoryIds(undefined);
    setAutoCategoryEnabled(false);
    setAutoGeminiEnabled(false);
    setAutoChatGptEnabled(false);
    setProcessingResults([]); // Clear results
  };

  const hasBulkUpdates =
    autoCategoryEnabled ||
    autoGeminiEnabled ||
    autoChatGptEnabled ||
    bulkStatusId !== undefined ||
    bulkPriorityId !== undefined ||
    bulkStartDate !== undefined ||
    bulkDueDate !== undefined ||
    bulkMilestoneIds !== undefined ||
    bulkCategoryIds !== undefined;

  const handleBulkUpdate = async () => {
    if (!space || !selectedRowKeys.length) return;

    const sharedUpdates: any = {};
    if (bulkStatusId !== undefined) sharedUpdates.statusId = bulkStatusId;
    if (bulkPriorityId !== undefined) sharedUpdates.priorityId = bulkPriorityId;
    if (bulkStartDate)
      sharedUpdates.startDate = bulkStartDate.format("YYYY-MM-DD");
    if (bulkDueDate) sharedUpdates.dueDate = bulkDueDate.format("YYYY-MM-DD");
    if (bulkMilestoneIds !== undefined)
      sharedUpdates.milestoneId = bulkMilestoneIds;
    if (!autoCategoryEnabled && bulkCategoryIds !== undefined)
      sharedUpdates.categoryId = bulkCategoryIds;

    if (
      !autoCategoryEnabled &&
      !(autoGeminiEnabled || autoChatGptEnabled) &&
      !Object.keys(sharedUpdates).length
    ) {
      toast.error("กรุณาเลือกข้อมูลที่จะอัปเดต");
      return;
    }

    setBulkUpdating(true);
    const toastId = toast.loading("กำลังอัปเดตงานแบบกลุ่ม...");

    try {
      if (autoCategoryEnabled || autoGeminiEnabled || autoChatGptEnabled) {
        // AI-assisted update
        // ! สร้าง Map ที่รองรับทั้ง id (สำหรับ selectedRowKeys) และ issueKey (สำหรับ payload)
        const selectedIssueMap = new Map<string, Issue>();
        issues.forEach((issueItem) => {
          selectedIssueMap.set(String(issueItem.id), issueItem);
          if (issueItem.issueKey) {
            selectedIssueMap.set(issueItem.issueKey, issueItem);
          }
        });

        const selectedIssues = selectedRowKeys
          .map((key) => selectedIssueMap.get(String(key)))
          .filter((item): item is Issue => Boolean(item));

        if (!selectedIssues.length) {
          throw new Error(
            "ไม่พบข้อมูลงานที่เลือกในหน้านี้ กรุณาเลือกงานจากตารางก่อน",
          );
        }

        const perIssuePayloads = selectedIssues.map((issue) => ({
          issueKeyOrId: issue.issueKey || issue.id,
          updates: { ...sharedUpdates },
        }));

        if (autoCategoryEnabled) {
          setAutoCategoryLoading(true);
          toast.message(`กำลังวิเคราะห์หมวดหมู่ด้วย Gemini...`, {
            id: toastId,
          });
          try {
            // Note: auto-category is currently only implemented for Gemini in the backend.
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
              },
            );
            const suggestions = autoCategoryResponse?.data?.suggestions || [];
            const suggestionMap = new Map(
              suggestions.map((s: any) => [s.issueKey, s.categoryIds]),
            );
            perIssuePayloads.forEach((p) => {
              const categoryIds = suggestionMap.get(p.issueKeyOrId);
              if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                p.updates.categoryId = categoryIds;
              }
            });
          } finally {
            setAutoCategoryLoading(false);
          }
        }

        if (autoGeminiEnabled || autoChatGptEnabled) {
          // Prepare processing results and open modal
          perIssuePayloadsRef.current = perIssuePayloads;

          setProcessingResults(
            perIssuePayloads.map((p, i) => ({
              issueKeyOrId: p.issueKeyOrId,
              title: String(p.issueKeyOrId),
              status: "queue" as const,
              index: i,
            })),
          );

          // Sequential runner with delay
          for (let i = 0; i < perIssuePayloads.length; i++) {
            const payload = perIssuePayloads[i];

            // mark pending
            setProcessingResults((prev) =>
              prev.map((r) =>
                String(r.issueKeyOrId) === String(payload?.issueKeyOrId)
                  ? {
                      ...r,
                      status: "pending",
                    }
                  : r,
              ),
            );

            await processSingle(payload, selectedIssueMap);

            if (i < perIssuePayloads.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          const successCount = perIssuePayloads.filter(
            (p) => p.updates && p.updates.description,
          ).length;
          const failureCount = perIssuePayloads.length - successCount;

          if (failureCount > 0) {
            toast.warning(
              `ประมวลผลเสร็จสิ้น: สำเร็จ ${successCount} รายการ, ล้มเหลว ${failureCount} รายการ`,
              { id: toastId, duration: 4000 },
            );
          } else {
            toast.success(
              `ประมวลผลเสร็จสิ้น: สำเร็จครบ ${successCount} รายการ`,
              { id: toastId, duration: 3000 },
            );
          }
        } else {
          // If manual only but autoCategory was on
          const entries = perIssuePayloads.filter(
            (p) => Object.keys(p.updates).length > 0,
          );
          if (entries.length > 0) {
            await axios.post("/api/v1/backlog/issues/bulk-update", {
              space,
              entries,
            });
          }
          toast.success("อัปเดตงานสำเร็จ", { id: toastId });
          onUpdateComplete();
          clearBulkForm();
        }
      } else {
        // Manual update
        await axios.post("/api/v1/backlog/issues/bulk-update", {
          space,
          issues: selectedRowKeys,
          updates: sharedUpdates,
        });
        toast.success("อัปเดตงานสำเร็จ", { id: toastId });
        onUpdateComplete();
        clearBulkForm();
      }
    } catch (error: any) {
      const { message } = extractErrorMessage(error);
      toast.error(message || "อัปเดตไม่สำเร็จ", { id: toastId });
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <Card
      styles={{ body: { padding: "32px 40px" } }}
      style={{
        ...elevatedCardStyle,
        border: "none",
        boxShadow: "none",
      }}
    >
      <Skeleton
        active
        loading={optionsLoading}
        paragraph={{ rows: 12 }}
        title={false}
      >
        <Row gutter={[48, 48]}>
          {/* Left Column: AI Power Tools */}
          <Col xs={24} lg={10}>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 32,
              }}
            >
              <div>
                <Typography.Title
                  level={4}
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <RobotOutlined
                    style={{ color: token.colorPrimary, fontSize: 24 }}
                  />
                  ระบบช่วยอัปเดต (AI)
                </Typography.Title>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 14, display: "block", marginTop: 8 }}
                >
                  เพิ่มความเร็วในการจัดกลุ่มและสรุปข้อมูลด้วยพลังของ AI
                </Typography.Text>
              </div>

              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                <AutoCategoryToggle
                  disabled={
                    autoCategoryLoading ||
                    bulkUpdating ||
                    !categoryOptions.length
                  }
                  enabled={autoCategoryEnabled}
                  onChange={handleAutoCategoryToggle}
                />

                <div
                  style={{
                    padding: "24px",
                    borderRadius: 20,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      color: token.colorTextDescription,
                    }}
                  >
                    สรุปเนื้อหางานอัตโนมัติ
                  </Typography.Text>

                  <AutoAiDescriptionToggle
                    label="Gemini Speed"
                    description="เน้นความเร็วและการสรุปเบื้องต้น"
                    enabled={autoGeminiEnabled}
                    onChange={handleAutoGeminiToggle}
                    disabled={bulkUpdating}
                  />

                  <AutoAiDescriptionToggle
                    label="ChatGPT Pro"
                    description="เน้นความละเอียดและบริบทที่ครบถ้วน"
                    activeColor="#10a37f"
                    enabled={autoChatGptEnabled}
                    onChange={handleAutoChatGptToggle}
                    disabled={bulkUpdating}
                  />
                </div>
              </Space>

              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: `1px solid #ffe7ba`,
                }}
              >
                <Flex gap={12}>
                  <InfoCircleOutlined
                    style={{ color: "#fa8c16", marginTop: 4, fontSize: 16 }}
                  />
                  <Typography.Text
                    style={{ fontSize: 13, lineHeight: 1.6, color: "#874d00" }}
                  >
                    ระบบ AI จะเริ่มทำงานหลังจากกดปุ่มอัปเดต
                    คุณสามารถตรวจสอบและแก้ไขผลลัพธ์จาก AI
                    ได้ทุกรายการก่อนบันทึกจริงลงฐานข้อมูล
                  </Typography.Text>
                </Flex>
              </div>
            </div>
          </Col>

          {/* Right Column: Manual Updates Fields */}
          <Col xs={24} lg={14}>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div>
                <Typography.Title
                  level={4}
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <EditOutlined style={{ color: "#faad14", fontSize: 24 }} />
                  ข้อมูลพื้นฐาน (Manual)
                </Typography.Title>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 14, display: "block", marginTop: 8 }}
                >
                  กําหนดค่าพื้นฐานให้มีผลกับทุกรายการงานที่เลือกไว้
                </Typography.Text>
              </div>

              <BulkUpdatePanel
                autoCategoryEnabled={autoCategoryEnabled}
                autoAiDescriptionEnabled={
                  autoGeminiEnabled || autoChatGptEnabled
                }
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
                onCategoryChange={(values) => setBulkCategoryIds(values || [])}
                onClear={clearBulkForm}
                onDueDateChange={(value) => setBulkDueDate(value ?? null)}
                onManageMilestone={() => {
                  router.push(
                    `/backlogs/projects/${projectId}/milestones?space=${encodeURIComponent(
                      space,
                    )}&name=${encodeURIComponent(projectName)}`,
                  );
                }}
                onMilestoneChange={(values) =>
                  setBulkMilestoneIds(values || [])
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
            </div>
          </Col>
        </Row>

        {/* ส่วนที่ 3 : รายการงานที่ถูกเลือก (ตารางย่อยใน Modal) */}
        {selectedRowKeys.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <Divider style={{ marginBlock: 32 }} />
            <Flex vertical gap={24}>
              <Flex align="center" gap={12}>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    background:
                      processingResults.length > 0
                        ? token.colorPrimaryBg
                        : "transparent",
                  }}
                >
                  {processingResults.length > 0 ? (
                    <RobotOutlined
                      style={{ color: token.colorPrimary, fontSize: 18 }}
                    />
                  ) : (
                    <UnorderedListOutlined
                      style={{ color: token.colorPrimary, fontSize: 18 }}
                    />
                  )}
                </div>
                <Typography.Title level={4} style={{ margin: 0, fontSize: 18 }}>
                  {processingResults.length > 0
                    ? `ผลลัพธ์การประมวลผล AI (${
                        processingResults.filter(
                          (r) => r.status === "success" || r.status === "error",
                        ).length
                      } / ${processingResults.length})`
                    : `รายการงานที่กำลังดำเนินการ (${selectedRowKeys.length} รายการ)`}
                </Typography.Title>
              </Flex>

              {processingResults.length > 0 && (
                <div style={{ padding: "8px 0" }}>
                  <Progress
                    percent={Math.round(
                      (processingResults.filter(
                        (r) => r.status === "success" || r.status === "error",
                      ).length /
                        processingResults.length) *
                        100,
                    )}
                    status="active"
                    strokeColor={{
                      "0%": token.colorPrimary,
                      "100%": token.colorSuccess,
                    }}
                    size={{ height: 10 }}
                  />
                </div>
              )}

              <Table<Issue>
                dataSource={selectedIssuesData}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ y: 560 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="ยังไม่มีรายการงานที่กําลังดำเนินการ"
                    />
                  ),
                }}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
                expandable={
                  processingResults.length > 0
                    ? {
                        expandedRowRender: (record) => {
                          const result = processingResults.find(
                            (r) =>
                              String(r.issueKeyOrId) === String(record.id) ||
                              (record.issueKey &&
                                String(r.issueKeyOrId) ===
                                  String(record.issueKey)),
                          );
                          if (!result) return null;
                          return (
                            <div
                              style={{
                                padding: 24,
                                borderRadius: 12,
                                margin: "16px 24px",
                                border: `1px solid ${token.colorBorderSecondary}`,
                                background: token.colorBgLayout,
                                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
                              }}
                            >
                              {result.status === "error" && (
                                <Space
                                  direction="vertical"
                                  size={12}
                                  style={{ marginBottom: 20, width: "100%" }}
                                >
                                  <Typography.Text type="danger" strong>
                                    <CloseCircleOutlined /> ข้อผิดพลาดทางเทคนิค:
                                  </Typography.Text>
                                  <div
                                    style={{
                                      padding: "12px 16px",
                                      borderLeft: `4px solid ${token.colorError}`,
                                      fontSize: 13,
                                      borderRadius: "0 8px 8px 0",
                                      background: token.colorBgContainer,
                                    }}
                                  >
                                    {result.message}
                                  </div>
                                </Space>
                              )}
                              {result.summary && (
                                <Space
                                  direction="vertical"
                                  size={12}
                                  style={{ width: "100%" }}
                                >
                                  <Typography.Text
                                    style={{
                                      color: token.colorTextSecondary,
                                      fontWeight: 600,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <RobotOutlined
                                      style={{ color: token.colorPrimary }}
                                    />
                                    ตัวอย่างคําอธิบายที่สร้างใหม่:
                                  </Typography.Text>
                                  <div
                                    style={{
                                      padding: 20,
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                      borderRadius: 12,
                                      maxHeight: 400,
                                      overflow: "auto",
                                      fontSize: 14,
                                      lineHeight: 1.8,
                                      whiteSpace: "pre-wrap",
                                      background: token.colorBgContainer,
                                      color: token.colorText,
                                    }}
                                  >
                                    {result.summary}
                                  </div>
                                </Space>
                              )}
                            </div>
                          );
                        },
                        rowExpandable: (record) => {
                          const result = processingResults.find(
                            (r) =>
                              String(r.issueKeyOrId) === String(record.id) ||
                              (record.issueKey &&
                                String(r.issueKeyOrId) ===
                                  String(record.issueKey)),
                          );
                          return (
                            result?.status === "success" ||
                            result?.status === "error"
                          );
                        },
                      }
                    : undefined
                }
                columns={[
                  {
                    title: "รหัสงาน",
                    dataIndex: "issueKey",
                    key: "issueKey",
                    width: 120,
                    render: (val) => (
                      <Tag
                        color="blue"
                        style={{
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        {val}
                      </Tag>
                    ),
                  },
                  ...(processingResults.length > 0
                    ? [
                        {
                          title: "สถานะ AI",
                          key: "aiStatus",
                          width: 180,
                          render: (_: any, record: Issue) => {
                            const result = processingResults.find(
                              (r) =>
                                String(r.issueKeyOrId) === String(record.id) ||
                                (record.issueKey &&
                                  String(r.issueKeyOrId) ===
                                    String(record.issueKey)),
                            );
                            if (!result) return <Tag>รอดำเนินการ</Tag>;

                            const config = {
                              queue: {
                                color: "default",
                                icon: <ClockCircleOutlined />,
                                text: "ในคิว",
                              },
                              pending: {
                                color: "processing",
                                icon: <LoadingOutlined />,
                                text: "กำลังสรุป",
                              },
                              success: {
                                color: "success",
                                icon: <CheckCircleOutlined />,
                                text: "สำเร็จ",
                              },
                              error: {
                                color: "error",
                                icon: <CloseCircleOutlined />,
                                text: "ล้มเหลว",
                              },
                            }[result.status as string] || {
                              color: "default",
                              icon: null,
                              text: result.status,
                            };
                            return (
                              <Tag
                                color={config.color}
                                icon={config.icon}
                                style={{ borderRadius: 20, paddingInline: 12 }}
                              >
                                {config.text}
                              </Tag>
                            );
                          },
                        },
                        {
                          title: "หัวข้อใหม่",
                          key: "aiSummary",
                          width: 250,
                          render: (_: any, record: Issue) => {
                            const result = processingResults.find(
                              (r) =>
                                String(r.issueKeyOrId) === String(record.id) ||
                                (record.issueKey &&
                                  String(r.issueKeyOrId) ===
                                    String(record.issueKey)),
                            );
                            if (!result || result.status === "error")
                              return "-";
                            return (
                              <Typography.Text
                                strong
                                style={{
                                  fontSize: 13,
                                  color: token.colorSuccess,
                                }}
                              >
                                {result.aiSummary || "-"}
                              </Typography.Text>
                            );
                          },
                        },
                      ]
                    : [
                        {
                          title: "หัวข้อนาน",
                          dataIndex: "summary",
                          key: "summary",
                          ellipsis: true,
                          render: (val: any) => (
                            <Typography.Text strong style={{ fontSize: 13 }}>
                              {val}
                            </Typography.Text>
                          ),
                        },
                      ]),
                  {
                    title: "สถานะ",
                    dataIndex: ["status", "name"],
                    key: "status",
                    width: 140,
                    render: (val, record) => (
                      <ColoredBadge text={val} color={record.status?.color} />
                    ),
                  },
                  {
                    title: "",
                    key: "action",
                    width: 60,
                    align: "center",
                    render: (_, record) => (
                      <Button
                        type="text"
                        danger
                        disabled={bulkUpdating}
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          dispatch(
                            setSelectedRowKeys(
                              selectedRowKeys.filter(
                                (k) => String(k) !== String(record.id),
                              ),
                            ),
                          );
                        }}
                      />
                    ),
                  },
                ]}
              />

              {processingResults.length > 0 && (
                <Flex
                  justify="space-between"
                  align="center"
                  style={{ marginTop: 24 }}
                >
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    onClick={async () => {
                      const failedRows = processingResults.filter(
                        (r) => r.status === "error",
                      );
                      if (!failedRows.length) return;

                      const payloads = perIssuePayloadsRef.current || [];
                      const targets = failedRows
                        .map((fr) =>
                          payloads.find(
                            (p) =>
                              String(p.issueKeyOrId) ===
                              String(fr.issueKeyOrId),
                          ),
                        )
                        .filter(Boolean);

                      if (!targets.length) return;

                      setProcessingResults((prev) =>
                        prev.map((r) =>
                          failedRows.some(
                            (fr) =>
                              String(fr.issueKeyOrId) ===
                              String(r.issueKeyOrId),
                          )
                            ? { ...r, status: "pending", message: undefined }
                            : r,
                        ),
                      );

                      const retryMap = new Map<string, Issue>();
                      issues.forEach((i) => {
                        retryMap.set(String(i.id), i);
                        if (i.issueKey) retryMap.set(i.issueKey, i);
                      });

                      for (const payload of targets) {
                        await processSingle(payload, retryMap);
                      }
                      toast.success("ลองใหม่สำเร็จ");
                    }}
                    disabled={
                      bulkUpdating ||
                      !processingResults.some((r) => r.status === "error")
                    }
                  >
                    ลองใหม่รายการที่ล้มเหลว
                  </Button>

                  <Space size={16}>
                    <Button
                      size="large"
                      onClick={() => setProcessingResults([])}
                      disabled={bulkUpdating}
                    >
                      ยกเลิกผลการประมวลผล
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      style={{ minWidth: 200, fontWeight: 600 }}
                      onClick={async () => {
                        const entries = (
                          perIssuePayloadsRef.current || []
                        ).filter((p) => p.updates?.description);
                        if (!entries.length) return;
                        setSaving(true);
                        try {
                          await axios.post(
                            "/api/v1/backlog/issues/bulk-update",
                            {
                              space,
                              entries,
                            },
                          );
                          toast.success(
                            `บันทึก ${entries.length} รายการสำเร็จ`,
                          );
                          onUpdateComplete();
                          clearBulkForm();
                        } catch (e: any) {
                          toast.error(e.message || "บันทึกไม่สำเร็จ");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      loading={saving}
                      disabled={
                        bulkUpdating ||
                        saving ||
                        !processingResults.some((r) => r.status === "success")
                      }
                    >
                      ยืนยันและบันทึกข้อมูล AI ทั้งหมด
                    </Button>
                  </Space>
                </Flex>
              )}
            </Flex>
          </div>
        )}
      </Skeleton>

      {/* Error Detail Modal */}
      <Modal
        open={detailModal.open}
        footer={null}
        width={600}
        onCancel={() => setDetailModal({ open: false })}
        title={
          <Space size={16}>
            <InfoCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>
              รายละเอียดข้อผิดพลาด{" "}
              {detailModal.statusCode ? `(${detailModal.statusCode})` : ""}
            </span>
          </Space>
        }
      >
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            maxHeight: 400,
            overflow: "auto",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {detailModal.content}
          </pre>
        </div>
      </Modal>
    </Card>
  );
};

export default BulkUpdateSection;
