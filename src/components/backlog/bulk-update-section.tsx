"use client";

import {
  Card,
  Skeleton,
  Space,
  Tabs,
  Typography,
  Modal,
  Table,
  Tag,
  Button,
  Progress,
  Divider,
  theme,
  Tooltip,
  Row,
  Col,
} from "antd";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  AppstoreAddOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

import AutoCategoryToggle from "@components/backlog/auto-category-toggle";
import AutoAiDescriptionToggle from "@components/backlog/auto-description-toggle";
import BulkUpdatePanel from "@components/backlog/issue-drawer/bulk-update-panel";
import { RootState } from "@stores/store";
import { Issue } from "@components/backlog/issue-drawer/types";

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
  onRequestMinimize,
  minimized = false,
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

  const [bulkTabKey, setBulkTabKey] = useState<"ai" | "manual">("ai");
  const [autoCategoryEnabled, setAutoCategoryEnabled] = useState(false);
  const [autoGeminiEnabled, setAutoGeminiEnabled] = useState(false);
  const [autoChatGptEnabled, setAutoChatGptEnabled] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [processingResults, setProcessingResults] = useState<
    Array<{
      issueKeyOrId: string | number;
      title?: string;
      summary?: string;
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
    const success = processingResults.filter(
      (r) => r.status === "success" || r.status === "error", // Count processed
    ).length;
    const percent = Math.round((success / total) * 100);
    const hasError = processingResults.some((r) => r.status === "error");
    const isCompleted = success === total;
    const status = isCompleted
      ? "completed"
      : hasError && isCompleted
        ? "error"
        : "processing";

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
      payload.updates.description = markdown;
      setProcessingResults((prev) =>
        prev.map((r) =>
          String(r.issueKeyOrId) === String(payload.issueKeyOrId)
            ? {
                ...r,
                status: "success",
                summary: markdown,
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
          String(r.issueKeyOrId) === String(payload.issueKeyOrId)
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
    setResultsModalVisible(false); // Close result modal on clear
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
        const selectedIssueMap = new Map(
          issues.map((issueItem) => {
            const key = issueItem.issueKey || String(issueItem.id);
            return [key, issueItem];
          }),
        );

        const selectedIssues = selectedRowKeys
          .map((key) => selectedIssueMap.get(String(key)))
          .filter((item): item is Issue => Boolean(item));

        if (!selectedIssues.length) {
          throw new Error("ไม่พบข้อมูลงานที่เลือก");
        }

        let perIssuePayloads = selectedIssues.map((issue) => ({
          issueKeyOrId: issue.issueKey || issue.id,
          updates: { ...sharedUpdates },
        }));

        if (autoCategoryEnabled) {
          toast.message(`กำลังวิเคราะห์หมวดหมู่ด้วย Gemini...`, {
            id: toastId,
          });
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
          setResultsModalVisible(true);

          // Sequential runner with delay
          for (let i = 0; i < perIssuePayloads.length; i++) {
            const payload = perIssuePayloads[i];

            // mark pending
            setProcessingResults((prev) =>
              prev.map((r) =>
                String(r.issueKeyOrId) === String(payload.issueKeyOrId)
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
      size="small"
      styles={{ body: { padding: 24 } }}
      style={{
        ...elevatedCardStyle,
        border: "none",
        boxShadow: "none",
        borderRadius: 24,
      }}
      title={
        <div className="flex items-center justify-between py-2">
          <Space align="center" size={16}>
            <div className="bg-blue-50 p-3 rounded-2xl">
              <AppstoreAddOutlined
                style={{ color: token.colorPrimary, fontSize: 24 }}
              />
            </div>
            <div>
              <Typography.Title
                level={4}
                style={{ margin: 0, fontWeight: 800 }}
              >
                จัดการหลายรายการพร้อมกัน
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                จัดการข้อมูลและใช้ AI ช่วยสรุปงานจำนวนมากในครั้งเดียว
              </Typography.Text>
            </div>
          </Space>
          <Tag
            color="blue"
            style={{
              borderRadius: 12,
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            เลือกแล้ว {selectedRowKeys.length} รายการ
          </Tag>
        </div>
      }
    >
      <Skeleton
        active
        loading={optionsLoading}
        paragraph={{ rows: 8 }}
        title={false}
      >
        <Row gutter={[40, 40]}>
          {/* Left Column: AI Power Tools */}
          <Col xs={24} lg={9}>
            <div className="flex flex-col gap-6">
              <Divider orientation="left" style={{ margin: "0 0 16px 0" }}>
                <Space>
                  <RobotOutlined style={{ color: token.colorPrimary }} />
                  <Typography.Text strong>
                    เครื่องมือ AI อัจฉริยะ
                  </Typography.Text>
                  <Tooltip title="ใช้ AI เพื่อประมวลผลข้อมูลอัตโนมัติ ช่วยลดเวลาการทำงานซ้ำ ๆ">
                    <InfoCircleOutlined className="text-gray-300" />
                  </Tooltip>
                </Space>
              </Divider>

              <div className="flex flex-col gap-8">
                <AutoCategoryToggle
                  disabled={
                    autoCategoryLoading ||
                    bulkUpdating ||
                    !categoryOptions.length
                  }
                  enabled={autoCategoryEnabled}
                  onChange={handleAutoCategoryToggle}
                />

                <div className="flex flex-col gap-4">
                  <AutoAiDescriptionToggle
                    label="สรุปด้วย Gemini"
                    description="เหมาะสำหรับการวิเคราะห์งานทั่วไปที่รวดเร็ว"
                    enabled={autoGeminiEnabled}
                    onChange={handleAutoGeminiToggle}
                    disabled={bulkUpdating}
                  />

                  <AutoAiDescriptionToggle
                    label="สรุปด้วย ChatGPT"
                    description="สรุปได้ลึกซึ้ง เหมาะสำหรับงานที่ซับซ้อน (GPT-4o)"
                    activeColor="#10a37f"
                    enabled={autoChatGptEnabled}
                    onChange={handleAutoChatGptToggle}
                    disabled={bulkUpdating}
                  />
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl mt-4">
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <InfoCircleOutlined className="mr-2" />* เมื่อเปิดใช้งาน AI
                  ระบบจะทำการประมวลผลทีละรายการอัตโนมัติหลังจากที่คุณกดปุ่ม
                  "อัปเดตงานทั้งหมด"
                </Typography.Text>
              </div>
            </div>
          </Col>

          {/* Right Column: Manual Updates Fields */}
          <Col xs={24} lg={15}>
            <div className="flex flex-col gap-6">
              <Divider orientation="left" style={{ margin: "0 0 16px 0" }}>
                <Space>
                  <EditOutlined style={{ color: "#faad14" }} />
                  <Typography.Text strong>ตั้งค่าข้อมูลพื้นฐาน</Typography.Text>
                  <Tooltip title="ใส่ข้อมูลที่ต้องการให้มีผลกับทุกรายการงานที่เลือก">
                    <InfoCircleOutlined className="text-gray-300" />
                  </Tooltip>
                </Space>
              </Divider>

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
      </Skeleton>

      {/* Results Modal */}
      <Modal
        title={null}
        open={resultsModalVisible && !minimized}
        onCancel={() => setResultsModalVisible(false)}
        footer={null}
        width={1400}
        styles={{ body: { padding: "40px" } }}
        centered
        maskClosable={false}
        destroyOnHidden={false}
      >
        <div style={{ marginBottom: 40 }}>
          <div className="flex justify-between items-center mb-10">
            <Space align="center" size={24}>
              <div className="bg-blue-50 p-2 rounded-xl">
                <RobotOutlined
                  style={{ color: token.colorPrimary, fontSize: 20 }}
                />
              </div>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  ผลลัพธ์การประมวลผลด้วย AI
                </Typography.Title>
                <Typography.Text type="secondary">
                  ประมวลผลเสร็จสิ้น{" "}
                  {
                    processingResults.filter(
                      (r) => r.status === "success" || r.status === "error",
                    ).length
                  }{" "}
                  / {processingResults.length} รายการ
                </Typography.Text>
              </div>
            </Space>
            {onRequestMinimize && (
              <Button
                type="text"
                icon={<MinusOutlined />}
                onClick={onRequestMinimize}
              />
            )}
          </div>

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
            strokeWidth={12}
            className="mb-0"
          />
        </div>

        <div className="border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <Table
            dataSource={processingResults}
            rowKey={(r) => String(r.issueKeyOrId)}
            pagination={false}
            scroll={{ y: 500 }}
            size="middle"
            expandable={{
              expandedRowRender: (record) => (
                <div className="p-4 bg-gray-50/50 rounded-xl m-2 border border-gray-100">
                  {record.status === "error" && (
                    <div className="mb-4">
                      <Typography.Text
                        type="danger"
                        strong
                        className="flex items-center gap-2"
                      >
                        <CloseCircleOutlined /> ข้อผิดพลาดทางเทคนิค:
                      </Typography.Text>
                      <Typography.Paragraph
                        type="danger"
                        className="mt-1 mb-0 border-l-4 border-red-200 pl-4 py-1 italic"
                      >
                        {record.message}
                      </Typography.Paragraph>
                    </div>
                  )}
                  {record.summary && (
                    <div>
                      <Typography.Text type="secondary" strong>
                        ตัวอย่างคําอธิบายที่สร้างใหม่:
                      </Typography.Text>
                      <div className="mt-2 p-3 bg-white border border-gray-100 rounded-lg max-h-[150px] overflow-auto text-sm leading-relaxed">
                        {record.summary}
                      </div>
                    </div>
                  )}
                </div>
              ),
              rowExpandable: (record) =>
                record.status === "success" || record.status === "error",
            }}
            columns={[
              {
                title: "รหัสงาน",
                dataIndex: "title",
                key: "title",
                width: 180,
                render: (text) => (
                  <Typography.Text strong className="text-blue-600">
                    {text}
                  </Typography.Text>
                ),
              },
              {
                title: "สถานะประมวลผล",
                dataIndex: "status",
                key: "status",
                width: 200,
                render: (status) => {
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
                  }[status as string] || {
                    color: "default",
                    icon: null,
                    text: status,
                  };
                  return (
                    <Tag
                      color={config.color}
                      icon={config.icon}
                      className="rounded-full px-3"
                    >
                      {config.text}
                    </Tag>
                  );
                },
              },
              {
                title: "ตัวอย่างเนื้อหา",
                dataIndex: "summary",
                key: "summary",
                render: (md, row) => {
                  if (row.status === "error")
                    return (
                      <Typography.Text type="danger" style={{ fontSize: 12 }}>
                        {row.message}
                      </Typography.Text>
                    );
                  if (!md)
                    return (
                      <Typography.Text
                        type="secondary"
                        italic
                        style={{ fontSize: 12 }}
                      >
                        กําลังวิเคราะห์ข้อมูล...
                      </Typography.Text>
                    );
                  return (
                    <Typography.Text
                      type="secondary"
                      ellipsis
                      style={{ fontSize: 12, maxWidth: 300 }}
                    >
                      {md.replace(/<[^>]*>?/gm, "").slice(0, 80)}...
                    </Typography.Text>
                  );
                },
              },
            ]}
          />
        </div>

        <div className="flex justify-between items-center">
          <Button
            icon={<ReloadOutlined />}
            onClick={async () => {
              // Retry logic
              const failedRows = processingResults.filter(
                (r) => r.status === "error",
              );
              if (!failedRows.length) return;

              const payloads = perIssuePayloadsRef.current || [];
              const targets = failedRows
                .map((fr) =>
                  payloads.find(
                    (p) => String(p.issueKeyOrId) === String(fr.issueKeyOrId),
                  ),
                )
                .filter(Boolean);

              if (!targets.length) return;

              setProcessingResults((prev) =>
                prev.map((r) =>
                  failedRows.some(
                    (fr) => String(fr.issueKeyOrId) === String(r.issueKeyOrId),
                  )
                    ? { ...r, status: "pending", message: undefined }
                    : r,
                ),
              );

              for (const payload of targets) {
                await processSingle(
                  payload,
                  new Map(issues.map((i) => [i.issueKey || String(i.id), i])),
                );
              }
              toast.success("ลองใหม่สำเร็จ");
            }}
            disabled={!processingResults.some((r) => r.status === "error")}
          >
            ลองใหม่รายการที่ล้มเหลว
          </Button>

          <Space>
            <Button onClick={() => setResultsModalVisible(false)}>
              ปิดหน้าต่าง
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                const entries = (perIssuePayloadsRef.current || []).filter(
                  (p) => p.updates?.description,
                );
                if (!entries.length) return;
                setSaving(true);
                try {
                  await axios.post("/api/v1/backlog/issues/bulk-update", {
                    space,
                    entries,
                  });
                  toast.success(`บันทึก ${entries.length} รายการสำเร็จ`);
                  setResultsModalVisible(false);
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
                saving || !processingResults.some((r) => r.status === "success")
              }
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </Space>
        </div>
      </Modal>

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
            background: "#f5f5f5",
            padding: 12,
            borderRadius: 8,
            maxHeight: 400,
            overflow: "auto",
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
