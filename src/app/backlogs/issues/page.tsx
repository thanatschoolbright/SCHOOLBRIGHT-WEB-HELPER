"use client";

import AiUpdateModal from "@/components/backlog/issue-drawer/ai-update-modal";
import type { Issue } from "@/components/backlog/issue-drawer/types";
import DashboardLayout from "@/components/layouts/backend-layout";
import AIProcessingModal from "@/components/modal/ai-processing-modal";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  AppstoreAddOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FileTextOutlined,
  LoadingOutlined,
  RobotOutlined,
  RocketOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Flex,
  Modal,
  Progress,
  Radio,
  Space,
  Spin,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { Suspense, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

import { FilterPanel } from "./_components/filter-panel";
import { IssuesTable } from "./_components/issues-table";
import { SummaryCards } from "./_components/summary-cards";
import { useAllIssuesData } from "./_hooks/use-all-issues-data";

const { Text } = Typography;

// ==========================================
// * Main Content
// ==========================================

function AllIssuesContent() {
  const { token } = theme.useToken();
  const searchParams = useSearchParams();

  const space = searchParams?.get("space") ?? "jabjai";
  const initialAssigneeParam = searchParams?.get("assigneeId");

  const {
    issues,
    total,
    loading,
    optionsLoading,
    summaryStats,
    selectedRowKeys,
    setSelectedRowKeys,
    page,
    pageSize,
    setPagination,
    filters,
    setFilters,
    resetFilters,
    projectOptions,
    issueTypeOptions,
    statusOptions,
    priorityOptions,
    assigneeOptions,
    loadIssues,
    reloadOptionsForProjects,
  } = useAllIssuesData({
    space,
    initialFilters: initialAssigneeParam
      ? { assigneeIds: [Number(initialAssigneeParam)] }
      : undefined,
  });

  // AI Modal State
  const [aiModal, setAiModal] = useState<{
    open: boolean;
    issue: Issue | null;
    generating: boolean;
    newText: string;
    newSummary?: string;
  }>({ open: false, issue: null, generating: false, newText: "" });

  const [aiProcessing, setAiProcessing] = useState<{
    open: boolean;
    currentStep: number;
    processingTime: number;
  }>({ open: false, currentStep: 0, processingTime: 0 });

  const [aiEngine, setAiEngine] = useState<"gemini" | "chatgpt">("gemini");

  const [engineSelectModal, setEngineSelectModal] = useState<{
    open: boolean;
    issue: Issue | null;
  }>({ open: false, issue: null });

  const [detailModalIssue, setDetailModalIssue] = useState<Issue | null>(null);

  // ── Bulk AI state ──────────────────────────────────────────────
  const [showBulk, setShowBulk] = useState(false);
  const [bulkEngine, setBulkEngine] = useState<"gemini" | "chatgpt">("gemini");
  const [bulkRunning, setBulkRunning] = useState(false);
  const bulkAbortRef = useRef(false);
  type BulkResult = {
    issueKey: string;
    title: string;
    status: "queue" | "pending" | "success" | "error";
    message?: string;
  };
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);

  const selectedIssues: Issue[] = issues.filter((i) =>
    selectedRowKeys.some((k) => String(k) === String(i.id)),
  );

  const handleStartBulkAi = async () => {
    if (!selectedIssues.length) {
      toast.error("กรุณาเลือกงานในตารางก่อน");
      return;
    }
    bulkAbortRef.current = false;
    setBulkRunning(true);
    setBulkResults(
      selectedIssues.map((i) => ({
        issueKey: i.issueKey || String(i.id),
        title: i.summary,
        status: "queue",
      })),
    );

    const endpoint =
      bulkEngine === "chatgpt"
        ? "/api/v1/ai/chatgpt/summarize"
        : "/api/v1/ai/gemini/summarize";

    for (let idx = 0; idx < selectedIssues.length; idx++) {
      if (bulkAbortRef.current) break;
      const issue = selectedIssues[idx];
      const key = issue.issueKey || String(issue.id);

      setBulkResults((prev) =>
        prev.map((r) => (r.issueKey === key ? { ...r, status: "pending" } : r)),
      );

      try {
        const res = await axios.post(endpoint, {
          summary: issue.summary,
          description: issue.description,
          details: issue,
          issueKey: key,
        });
        const markdown = res?.data?.data?.markdown || "";
        const aiSummary = res?.data?.data?.summary || "";
        const finalSummary = aiSummary || `${issue.summary} [สรุปด้วย LIGHT AI]`;

        await axios.post("/api/v1/backlog/issues/update", {
          space,
          issueKeyOrId: key,
          description: markdown,
          summary: finalSummary,
        });

        setBulkResults((prev) =>
          prev.map((r) => (r.issueKey === key ? { ...r, status: "success" } : r)),
        );
      } catch (err: any) {
        const msg =
          err?.response?.data?.message_th ||
          err?.response?.data?.message ||
          err?.message ||
          "เกิดข้อผิดพลาด";
        setBulkResults((prev) =>
          prev.map((r) =>
            r.issueKey === key ? { ...r, status: "error", message: msg } : r,
          ),
        );
      }

      // delay ระหว่างแต่ละรายการ
      if (idx < selectedIssues.length - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setBulkRunning(false);
    toast.success(`สรุปด้วย AI เสร็จสิ้น`);
    loadIssues();
  };

  const bulkDoneCount = bulkResults.filter(
    (r) => r.status === "success" || r.status === "error",
  ).length;
  const bulkPercent =
    bulkResults.length > 0
      ? Math.round((bulkDoneCount / bulkResults.length) * 100)
      : 0;
  // ── end Bulk AI ────────────────────────────────────────────────

  const handleAiAnalyze = async (issue: Issue, engine: "gemini" | "chatgpt") => {
    setAiEngine(engine);
    setAiProcessing({ open: true, currentStep: 0, processingTime: 0 });

    const startTime = Date.now();
    const timer = setInterval(() => {
      setAiProcessing((prev) => ({
        ...prev,
        processingTime: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    try {
      setAiProcessing((prev) => ({ ...prev, currentStep: 2 }));
      const endpoint =
        engine === "chatgpt"
          ? "/api/v1/ai/chatgpt/summarize"
          : "/api/v1/ai/gemini/summarize";

      const response = await axios.post(endpoint, {
        summary: issue.summary,
        description: issue.description,
        details: issue,
        issueKey: issue.issueKey || String(issue.id),
      });

      clearInterval(timer);
      setAiProcessing({ open: false, currentStep: 0, processingTime: 0 });
      setAiModal({
        open: true,
        issue,
        generating: false,
        newText: response?.data?.data?.markdown || "",
        newSummary: response?.data?.data?.summary || "",
      });
      toast.success("ประมวลผลสรุปงานด้วย AI สำเร็จ");
    } catch {
      clearInterval(timer);
      setAiProcessing({ open: false, currentStep: 0, processingTime: 0 });
      toast.error("เรียกใช้งาน AI เพื่อสรุปงานไม่สำเร็จ");
    }
  };

  const handleApplyAiUpdate = async () => {
    if (!aiModal.issue) return;
    const toastId = toast.loading("กำลังอัปเดตข้อมูลไปยัง Backlog...");
    try {
      const finalSummary =
        aiModal.newSummary ||
        (aiModal.issue.summary.includes("AI")
          ? aiModal.issue.summary
          : `${aiModal.issue.summary} [สรุปด้วย LIGHT AI]`);

      await axios.post("/api/v1/backlog/issues/update", {
        space,
        issueKeyOrId: aiModal.issue.issueKey || aiModal.issue.id,
        description: aiModal.newText,
        summary: finalSummary,
      });
      toast.success("อัปเดตข้อมูลบน Backlog สำเร็จ", { id: toastId });
      setAiModal({ open: false, issue: null, generating: false, newText: "" });
      loadIssues();
    } catch {
      toast.error("อัปเดตข้อมูลบน Backlog ไม่สำเร็จ", { id: toastId });
    }
  };

  return (
    <DashboardLayout>
      <Flex vertical gap={24}>
        {/* Header */}
        <HeaderBar
          icon={<RocketOutlined />}
          title="รายการงานทุกโปรเจกต์"
          subTitle={`พื้นที่ทำงาน: ${space} — แสดงงานรวมจากทุกโปรเจกต์ในครั้งเดียว`}
          showBackButton
          extra={
            <Tag
              color={loading ? "processing" : "success"}
              icon={loading ? <Spin size="small" /> : <CheckCircleOutlined />}
            >
              {loading ? "กำลังโหลด..." : "ข้อมูลล่าสุด"}
            </Tag>
          }
        />

        {/* Summary Cards */}
        <SummaryCards stats={summaryStats} loading={loading} />

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          onSearch={loadIssues}
          onReset={resetFilters}
          loading={loading}
          optionsLoading={optionsLoading}
          projectOptions={projectOptions}
          issueTypeOptions={issueTypeOptions}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          assigneeOptions={assigneeOptions}
          onProjectChange={reloadOptionsForProjects}
        />

        {/* Issues Table */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
            background: "transparent",
          }}
          title={
            <Flex align="center" gap={12}>
              <UnorderedListOutlined style={{ color: token.colorPrimary }} />
              <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                รายการงาน (ทุกโปรเจกต์)
              </span>
            </Flex>
          }
          extra={
            <Space>
              <Button
                icon={<AppstoreAddOutlined />}
                onClick={() => setShowBulk(true)}
                style={{ fontWeight: 600 }}
              >
                Bulk Action
              </Button>
            </Space>
          }
        >
          <IssuesTable
            issues={issues}
            total={total}
            page={page}
            pageSize={pageSize}
            loading={loading}
            selectedRowKeys={selectedRowKeys}
            space={space}
            onPaginationChange={setPagination}
            onSelectChange={setSelectedRowKeys}
            onViewDetail={(issue) => setDetailModalIssue(issue)}
            onAiAnalyze={(issue) => setEngineSelectModal({ open: true, issue })}
          />
        </Card>
      </Flex>

      {/* AI Engine Select Modal */}
      <Modal
        title="เลือกเครื่องมือประมวลผล AI"
        open={engineSelectModal.open}
        onCancel={() => setEngineSelectModal({ open: false, issue: null })}
        footer={null}
        centered
      >
        <Flex vertical gap={12} style={{ paddingBlock: 12 }}>
          <Button
            size="large"
            type="primary"
            className="h-16"
            onClick={() => {
              if (engineSelectModal.issue)
                handleAiAnalyze(engineSelectModal.issue, "gemini");
              setEngineSelectModal({ open: false, issue: null });
            }}
          >
            Google Gemini (รวดเร็ว)
          </Button>
          <Button
            size="large"
            className="h-16"
            onClick={() => {
              if (engineSelectModal.issue)
                handleAiAnalyze(engineSelectModal.issue, "chatgpt");
              setEngineSelectModal({ open: false, issue: null });
            }}
          >
            OpenAI ChatGPT (ละเอียด)
          </Button>
        </Flex>
      </Modal>

      {/* AI Update Modal */}
      <AiUpdateModal
        aiState={aiModal}
        onApprove={handleApplyAiUpdate}
        onClose={() => setAiModal({ open: false, issue: null, generating: false, newText: "" })}
        onRegenerate={() =>
          aiModal.issue && handleAiAnalyze(aiModal.issue, aiEngine)
        }
        onUpdateText={(val) => setAiModal((prev) => ({ ...prev, newText: val }))}
      />

      {/* AI Processing Modal */}
      <AIProcessingModal
        open={aiProcessing.open}
        currentStep={aiProcessing.currentStep}
        processingTime={aiProcessing.processingTime}
        onCancel={() =>
          setAiProcessing({ open: false, currentStep: 0, processingTime: 0 })
        }
        steps={[
          {
            key: "1",
            title: "เตรียมข้อมูล",
            description: "กำลังรวบรวมรายละเอียดงาน",
            icon: <FileTextOutlined />,
            status:
              aiProcessing.currentStep >= 0
                ? aiProcessing.currentStep === 0
                  ? "process"
                  : "finish"
                : "wait",
          },
          {
            key: "2",
            title: "ส่งข้อมูลไปยัง AI",
            description: `กำลังประมวลผลด้วย ${aiEngine}`,
            icon: <SendOutlined />,
            status:
              aiProcessing.currentStep >= 1
                ? aiProcessing.currentStep === 1
                  ? "process"
                  : "finish"
                : "wait",
          },
          {
            key: "3",
            title: "กำลังประมวลผล",
            description: "AI กำลังสร้างสรุปเนื้อหา",
            icon: <BarChartOutlined />,
            status:
              aiProcessing.currentStep >= 2
                ? aiProcessing.currentStep === 2
                  ? "process"
                  : "finish"
                : "wait",
          },
          {
            key: "4",
            title: "เสร็จสิ้น",
            description: "สรุปสำเร็จ",
            icon: <CheckCircleOutlined />,
            status: aiProcessing.currentStep >= 3 ? "finish" : "wait",
          },
        ]}
      />

      {/* Bulk AI Modal */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <RobotOutlined />
            <span>Bulk AI Summary</span>
            {selectedIssues.length > 0 && (
              <Badge count={selectedIssues.length} color="blue" />
            )}
          </Flex>
        }
        open={showBulk}
        onCancel={() => {
          if (!bulkRunning) {
            setShowBulk(false);
            setBulkResults([]);
          }
        }}
        width={700}
        footer={null}
        centered
        maskClosable={!bulkRunning}
      >
        <Flex vertical gap={16} style={{ paddingBlock: 8 }}>
          {/* Engine selector */}
          {!bulkRunning && bulkResults.length === 0 && (
            <>
              <Typography.Text type="secondary">
                เลือกงานจากตารางก่อน แล้วกด &quot;เริ่มสรุปด้วย AI&quot;
                ระบบจะสรุปและอัปเดต description ทีละรายการโดยอัตโนมัติ
              </Typography.Text>

              <Flex align="center" gap={8}>
                <Typography.Text strong>AI Engine:</Typography.Text>
                <Radio.Group
                  value={bulkEngine}
                  onChange={(e) => setBulkEngine(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { label: "Google Gemini (รวดเร็ว)", value: "gemini" },
                    { label: "ChatGPT (ละเอียด)", value: "chatgpt" },
                  ]}
                />
              </Flex>

              <Flex justify="space-between" align="center">
                <Typography.Text>
                  เลือกแล้ว:{" "}
                  <Typography.Text strong>{selectedIssues.length}</Typography.Text>{" "}
                  รายการ
                </Typography.Text>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  disabled={selectedIssues.length === 0}
                  onClick={handleStartBulkAi}
                  size="large"
                >
                  เริ่มสรุปด้วย AI
                </Button>
              </Flex>
            </>
          )}

          {/* Progress */}
          {bulkResults.length > 0 && (
            <>
              <Flex align="center" justify="space-between">
                <Typography.Text strong>
                  {bulkRunning ? "กำลังประมวลผล..." : "เสร็จสิ้น"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {bulkDoneCount} / {bulkResults.length} รายการ
                </Typography.Text>
              </Flex>
              <Progress
                percent={bulkPercent}
                status={bulkRunning ? "active" : "success"}
                strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }}
              />
              <Table
                size="small"
                dataSource={bulkResults}
                rowKey="issueKey"
                pagination={false}
                scroll={{ y: 320 }}
                columns={[
                  {
                    title: "รหัสงาน",
                    dataIndex: "issueKey",
                    width: 120,
                    render: (key: string) => <Tag color="blue">{key}</Tag>,
                  },
                  {
                    title: "หัวข้อ",
                    dataIndex: "title",
                    ellipsis: true,
                  },
                  {
                    title: "สถานะ",
                    dataIndex: "status",
                    width: 100,
                    align: "center",
                    render: (status: string, record) => {
                      if (status === "queue")
                        return <Typography.Text type="secondary">รอ</Typography.Text>;
                      if (status === "pending")
                        return <LoadingOutlined style={{ color: "#1677ff" }} />;
                      if (status === "success")
                        return (
                          <CheckCircleFilled style={{ color: "#52c41a", fontSize: 16 }} />
                        );
                      return (
                        <Tooltip title={record.message}>
                          <CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 16 }} />
                        </Tooltip>
                      );
                    },
                  },
                ]}
              />
              {!bulkRunning && (
                <Flex justify="end" gap={8}>
                  <Button
                    onClick={() => {
                      setBulkResults([]);
                    }}
                  >
                    เริ่มใหม่
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setShowBulk(false);
                      setBulkResults([]);
                    }}
                  >
                    ปิด
                  </Button>
                </Flex>
              )}
              {bulkRunning && (
                <Flex justify="end">
                  <Button
                    danger
                    onClick={() => {
                      bulkAbortRef.current = true;
                    }}
                  >
                    หยุดการประมวลผล
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Flex>
      </Modal>
    </DashboardLayout>
  );
}

// ==========================================
// * Entry Point (Suspense boundary for useSearchParams)
// ==========================================

export default function AllIssuesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Card style={{ borderRadius: 24, padding: 32 }} className="shadow-lg text-center">
            <Space direction="vertical" size="large">
              <Spin size="large" />
              <Typography.Text className="text-gray-500">กำลังเตรียมข้อมูล...</Typography.Text>
            </Space>
          </Card>
        </div>
      }
    >
      <AllIssuesContent />
    </Suspense>
  );
}
