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
} from "antd";
import { useRouter } from "next/navigation";
import React, { useState, useRef } from "react";
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
}

const BulkUpdateSection: React.FC<BulkUpdateSectionProps> = ({
  elevatedCardStyle,
  projectName,
  projectId,
  space,
  onUpdateComplete,
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
  const [autoDescriptionEnabled, setAutoDescriptionEnabled] = useState(false);
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
    selectedIssueMap: Map<string, Issue>
  ) => {
    const issue = selectedIssueMap.get(String(payload.issueKeyOrId));
    try {
      if (!issue) throw new Error("ไม่พบข้อมูลงาน");
      const response = await axios.post("/api/v1/ai/gemini/summarize", {
        summary: issue.summary,
        description: issue.description,
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
            : r
        )
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
            : r
        )
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

  const handleAutoDescriptionToggle = (checked: boolean) => {
    setAutoDescriptionEnabled(checked);
  };

  const clearBulkForm = () => {
    setBulkStatusId(undefined);
    setBulkPriorityId(undefined);
    setBulkStartDate(undefined);
    setBulkDueDate(undefined);
    setBulkMilestoneIds(undefined);
    setBulkCategoryIds(undefined);
    setAutoCategoryEnabled(false);
    setAutoDescriptionEnabled(false);
  };

  const hasBulkUpdates =
    autoCategoryEnabled ||
    autoDescriptionEnabled ||
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
      !autoDescriptionEnabled &&
      !Object.keys(sharedUpdates).length
    ) {
      toast.error("กรุณาเลือกข้อมูลที่จะอัปเดต");
      return;
    }

    setBulkUpdating(true);
    const toastId = toast.loading("กำลังอัปเดตงานแบบกลุ่ม...");

    try {
      if (autoCategoryEnabled || autoDescriptionEnabled) {
        // AI-assisted update
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
          throw new Error("ไม่พบข้อมูลงานที่เลือก");
        }

        let perIssuePayloads = selectedIssues.map((issue) => ({
          issueKeyOrId: issue.issueKey || issue.id,
          updates: { ...sharedUpdates },
        }));

        if (autoCategoryEnabled) {
          toast.message("กำลังวิเคราะห์ Category ด้วย Gemini...", {
            id: toastId,
          });
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
          const suggestions = autoCategoryResponse?.data?.suggestions || [];
          const suggestionMap = new Map(
            suggestions.map((s: any) => [s.issueKey, s.categoryIds])
          );
          perIssuePayloads.forEach((p) => {
            const categoryIds = suggestionMap.get(p.issueKeyOrId);
            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
              p.updates.categoryId = categoryIds;
            }
          });
        }

        if (autoDescriptionEnabled) {
          // Prepare processing results and open modal
          perIssuePayloadsRef.current = perIssuePayloads;

          setProcessingResults(
            perIssuePayloads.map((p, i) => ({
              issueKeyOrId: p.issueKeyOrId,
              title: String(p.issueKeyOrId),
              status: "queue" as const,
              index: i,
            }))
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
                  : r
              )
            );

            await processSingle(payload, selectedIssueMap);

            if (i < perIssuePayloads.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          const successCount = perIssuePayloads.filter(
            (p) => p.updates && p.updates.description
          ).length;
          const failureCount = perIssuePayloads.length - successCount;
          toast.message(
            `สรุปรายการเสร็จสิ้น: สำเร็จ ${successCount} รายการ, ล้มเหลว ${failureCount} รายการ`
          );
        }

        const entries = perIssuePayloads.filter(
          (p) => Object.keys(p.updates).length > 0
        );
        if (entries.length > 0) {
          await axios.post("/api/v1/backlog/issues/bulk-update", {
            space,
            entries,
          });
        }
      } else {
        // Manual update
        await axios.post("/api/v1/backlog/issues/bulk-update", {
          space,
          issues: selectedRowKeys,
          updates: sharedUpdates,
        });
      }

      toast.success("อัปเดตงานสำเร็จ", { id: toastId });
      onUpdateComplete();
      clearBulkForm();
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
      styles={{ body: { padding: 16 } }}
      style={{
        ...elevatedCardStyle,
        border: "none",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        borderRadius: 12,
      }}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Space align="center" size={10}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Bulk Actions
            </Typography.Title>
            <Tag
              color="blue"
              bordered={false}
              style={{ borderRadius: 12, fontSize: 12 }}
            >
              Selected: {selectedRowKeys.length} items
            </Tag>
          </Space>
        </div>
      }
    >
      <Skeleton
        active
        loading={optionsLoading}
        paragraph={{ rows: 6 }}
        title={false}
      >
        <Tabs
          activeKey={bulkTabKey}
          onChange={(key) => setBulkTabKey(key as "ai" | "manual")}
          type="card"
          items={[
            {
              key: "ai",
              label: (
                <Space>
                  <RobotOutlined />
                  AI Update
                </Space>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  {/* Flattened Layout: Control Header + Form */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: token.colorFillAlter,
                      borderRadius: token.borderRadiusLG,
                      marginBottom: 16,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Space direction="vertical" size={2}>
                      <Space>
                        <RobotOutlined style={{ color: "#1677ff" }} />
                        <Typography.Text strong>Smart Filters</Typography.Text>
                      </Space>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13, maxWidth: 400 }}
                      >
                        Automatically categorize and summarize issues using
                        Gemini AI. Enable the options below.
                      </Typography.Text>
                    </Space>

                    <Space size={16}>
                      <AutoCategoryToggle
                        disabled={
                          autoCategoryLoading ||
                          bulkUpdating ||
                          !categoryOptions.length
                        }
                        enabled={autoCategoryEnabled}
                        onChange={handleAutoCategoryToggle}
                      />
                      <AutoAiDescriptionToggle
                        enabled={autoDescriptionEnabled}
                        onChange={handleAutoDescriptionToggle}
                        disabled={bulkUpdating}
                      />
                    </Space>
                  </div>

                  {/* Clean Form Panel */}
                  <div style={{ padding: "0 8px" }}>
                    <BulkUpdatePanel
                      autoCategoryEnabled={autoCategoryEnabled}
                      autoAiDescriptionEnabled={autoDescriptionEnabled}
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
                      onCategoryChange={(values) =>
                        setBulkCategoryIds(
                          values && values.length ? values : []
                        )
                      }
                      onClear={clearBulkForm}
                      onDueDateChange={(value) => setBulkDueDate(value ?? null)}
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
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Skeleton>

      {/* Results Modal - Cleaned up */}
      <Modal
        title={
          <Space>
            <div
              style={{ padding: 6, background: "#e6f4ff", borderRadius: "50%" }}
            >
              <RobotOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            </div>
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                AI Processing Results
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Status of AI summary generation
              </Typography.Text>
            </div>
          </Space>
        }
        open={resultsModalVisible}
        onCancel={() => setResultsModalVisible(false)}
        footer={null}
        width={900}
        styles={{ body: { padding: "20px 24px" } }}
        centered
      >
        <div style={{ marginBottom: 24 }}>
          {/* Progress Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Typography.Text strong>Processing issues...</Typography.Text>
            <Typography.Text type="secondary">
              {processingResults.filter((r) => r.status === "success").length} /{" "}
              {processingResults.length} Completed
            </Typography.Text>
          </div>

          <Progress
            percent={Math.round(
              (processingResults.filter(
                (r) => r.status === "success" || r.status === "error"
              ).length /
                processingResults.length) *
                100
            )}
            status="active"
            strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
            showInfo={false}
          />
        </div>

        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <Table
            dataSource={processingResults}
            rowKey={(r) => String(r.issueKeyOrId)}
            pagination={false}
            scroll={{ y: 360 }}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: "12px 20px", background: "#fafafa" }}>
                  {record.status === "error" && (
                    <div style={{ marginBottom: 8 }}>
                      <Typography.Text type="danger" strong>
                        <CloseCircleOutlined /> Error:
                      </Typography.Text>
                      <Typography.Paragraph type="danger" style={{ margin: 0 }}>
                        {record.message}
                      </Typography.Paragraph>
                    </div>
                  )}
                  {record.summary && (
                    <div>
                      <Typography.Text type="secondary">
                        Generated Markdown:
                      </Typography.Text>
                      <div
                        style={{
                          marginTop: 4,
                          padding: 8,
                          background: "#fff",
                          border: "1px solid #eee",
                          borderRadius: 4,
                          maxHeight: 100,
                          overflow: "auto",
                          fontSize: 12,
                        }}
                      >
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
                title: "Issue",
                dataIndex: "title",
                key: "title",
                width: 150,
                render: (text) => (
                  <Typography.Text strong>{text}</Typography.Text>
                ),
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (status) => {
                  const config = {
                    queue: {
                      color: "default",
                      icon: <ClockCircleOutlined />,
                      text: "Queue",
                    },
                    pending: {
                      color: "processing",
                      icon: <LoadingOutlined />,
                      text: "Processing",
                    },
                    success: {
                      color: "success",
                      icon: <CheckCircleOutlined />,
                      text: "Success",
                    },
                    error: {
                      color: "error",
                      icon: <CloseCircleOutlined />,
                      text: "Error",
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
                      bordered={false}
                    >
                      {config.text}
                    </Tag>
                  );
                },
              },
              {
                title: "Preview",
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
                        Waiting...
                      </Typography.Text>
                    );
                  return (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {md.replace(/<[^>]*>?/gm, "").slice(0, 60)}...
                    </Typography.Text>
                  );
                },
              },
            ]}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            icon={<ReloadOutlined />}
            onClick={async () => {
              // Retry logic reused from original but simplified trigger
              const failedRows = processingResults.filter(
                (r) => r.status === "error"
              );
              if (!failedRows.length) return;

              const payloads = perIssuePayloadsRef.current || [];
              const targets = failedRows
                .map((fr) =>
                  payloads.find(
                    (p) => String(p.issueKeyOrId) === String(fr.issueKeyOrId)
                  )
                )
                .filter(Boolean);

              if (!targets.length) return;

              // Reset status
              setProcessingResults((prev) =>
                prev.map((r) =>
                  failedRows.some(
                    (fr) => String(fr.issueKeyOrId) === String(r.issueKeyOrId)
                  )
                    ? { ...r, status: "pending", message: undefined }
                    : r
                )
              );

              // Simple sequential retry
              for (const payload of targets) {
                await processSingle(
                  payload,
                  new Map(issues.map((i) => [i.issueKey || String(i.id), i]))
                );
              }

              // Resave automatically if desired, or let user click save
              toast.success("Retry completed");
            }}
            disabled={!processingResults.some((r) => r.status === "error")}
          >
            Retry Failed
          </Button>

          <Space>
            <Button onClick={() => setResultsModalVisible(false)}>Close</Button>
            <Button
              type="primary"
              onClick={async () => {
                const entries = (perIssuePayloadsRef.current || []).filter(
                  (p) => p.updates?.description
                );
                if (!entries.length) return;
                setSaving(true);
                try {
                  await axios.post("/api/v1/backlog/issues/bulk-update", {
                    space,
                    entries,
                  });
                  toast.success(`Saved ${entries.length} items successfully`);
                  setResultsModalVisible(false);
                  onUpdateComplete();
                  clearBulkForm();
                } catch (e: any) {
                  toast.error(e.message || "Save failed");
                } finally {
                  setSaving(false);
                }
              }}
              loading={saving}
              disabled={
                saving || !processingResults.some((r) => r.status === "success")
              }
            >
              Save Changes
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Error Detail Modal - Simplified */}
      <Modal
        open={detailModal.open}
        footer={null}
        width={600}
        onCancel={() => setDetailModal({ open: false })}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>
              Error Details{" "}
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
