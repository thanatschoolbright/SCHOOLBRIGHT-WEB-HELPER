"use client";

import {
  AppstoreAddOutlined,
  AuditOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  PushpinOutlined,
  RobotOutlined,
  RocketOutlined,
  SearchOutlined,
  SendOutlined,
  TagOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
  Grid,
  Input,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { HookAPI } from "antd/es/modal/useModal";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

// * Redux Actions & State
import {
  resetFilters,
  setFilters,
  setIssues,
  setLoading,
  setOptions,
  setOptionsLoading,
  setPagination,
  setSelectedRowKeys,
} from "@stores/reducers/issues-slice";
import { AppDispatch, RootState } from "@stores/store";

// * Internal Components
import ColoredBadge from "@/components/ant-design/table/table-badge-color";
import SharedBulkUpdateSection from "@/components/backlog/bulk-update-section";
import AiUpdateModal from "@/components/backlog/issue-drawer/ai-update-modal";
import type { Issue } from "@/components/backlog/issue-drawer/types";
import SummaryCard from "@/components/card/summary-card";
import DashboardLayout from "@/components/layouts/backend-layout";
import AIProcessingModal from "@/components/modal/ai-processing-modal";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ==========================================
// * Utilities
// ==========================================

// ! ฟังก์ชันจัดรูปแบบวันที่ให้เป็น DD/MM/YYYY
const formatDateThai = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "-";

// ! แปลง Markdown เป็น HTML เบื้องต้น (No Emoji)
const markdownToHtmlSimple = (value?: string | null) => {
  if (!value) return "-";
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<br/>";
      return `<p style="margin:0;">${trimmed}</p>`;
    })
    .join("");
};

// ==========================================
// * Internal Components (Integrated)
// ==========================================

/**
 * � IssueDetailModal: แสดงรายละเอียดงานแบบเจาะลึก
 */
const IssueDetailModal: React.FC<{
  open: boolean;
  onClose: () => void;
  issue: Issue | null;
  space: string;
}> = ({ open, onClose, issue, space }) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.lg || screens.xl || screens.xxl;

  if (!issue) return null;

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
          <span>รายละเอียดงาน [{issue.issueKey}]</span>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose} type="primary">
          ปิดหน้าต่าง
        </Button>,
      ]}
      centered
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          size="small"
        >
          <Descriptions.Item label="รหัสงาน">
            <Typography.Link
              href={`https://${space}.backlog.com/view/${issue.issueKey}`}
              target="_blank"
              strong
            >
              {issue.issueKey}
            </Typography.Link>
          </Descriptions.Item>
          <Descriptions.Item label="ประเภท">
            <Tag color={issue.issueType?.color || "default"}>
              {issue.issueType?.name || "N/A"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="หัวข้องาน" span={isDesktop ? 2 : 1}>
            <Text strong>{issue.summary}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="สถานะ">
            {issue.status ? (
              <ColoredBadge
                text={issue.status.name}
                color={issue.status.color}
              />
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="ความสำคัญ">
            <Tag
              color={
                issue.priority?.name === "High"
                  ? "volcano"
                  : issue.priority?.name === "Normal"
                    ? "blue"
                    : "default"
              }
            >
              {issue.priority?.name || "N/A"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="ผู้รับผิดชอบ">
            <Space>
              <Avatar
                size="small"
                src={issue.assignee?.nulabAccount?.iconUrl}
                icon={<UserOutlined />}
              />
              <Text>{issue.assignee?.name || "-"}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="ผู้สร้างงาน">
            <Space>
              <Avatar
                size="small"
                src={(issue as any).createdUser?.nulabAccount?.iconUrl}
                icon={<UserOutlined />}
              />
              <Text>{(issue as any).createdUser?.name || "-"}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="หมวดหมู่">
            <Space wrap>
              {issue.category?.map((c) => (
                <Tag key={c.id} icon={<TagOutlined />}>
                  {c.name}
                </Tag>
              )) || "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Milestone">
            <Space wrap>
              {issue.milestone?.map((m) => (
                <Tag key={m.id} color="processing" icon={<TrophyOutlined />}>
                  {m.name}
                </Tag>
              )) || "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="วันที่เริ่ม">
            <Space>
              <CalendarOutlined style={{ color: token.colorTextDescription }} />
              {issue.startDate ? formatDateThai(issue.startDate) : "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="กำหนดส่ง">
            <Space>
              <CalendarOutlined style={{ color: token.colorTextDescription }} />
              {issue.dueDate ? formatDateThai(issue.dueDate) : "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="ประมาณการเวลา">
            {(issue as any).estimatedHours
              ? `${(issue as any).estimatedHours} ชม.`
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="เวลาที่ใช้จริง">
            {(issue as any).actualHours
              ? `${(issue as any).actualHours} ชม.`
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="สร้างเมื่อ">
            <Space>
              <ClockCircleOutlined
                style={{ color: token.colorTextDescription }}
              />
              {issue.created ? formatDateThai(issue.created) : "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="อัปเดตล่าสุด">
            <Space>
              <HistoryOutlined style={{ color: token.colorTextDescription }} />
              {issue.updated ? formatDateThai(issue.updated) : "-"}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" style={{ marginBlock: 16 }}>
          <Space>
            <AuditOutlined />
            <span>คำอธิบายงาน</span>
          </Space>
        </Divider>

        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${token.colorBorderSecondary}`,
            minHeight: 100,
          }}
          dangerouslySetInnerHTML={{
            __html: markdownToHtmlSimple(issue.description),
          }}
        />

        {issue.attachments && issue.attachments.length > 0 && (
          <>
            <Divider orientation="left" style={{ marginBlock: 16 }}>
              <Space>
                <FileTextOutlined />
                <span>ไฟล์แนบ ({issue.attachments.length})</span>
              </Space>
            </Divider>
            <Space wrap>
              {issue.attachments.map((file) => (
                <Card
                  key={file.id}
                  size="small"
                  style={{ width: 200 }}
                  styles={{ body: { padding: 8 } }}
                >
                  <Flex align="center" gap={8}>
                    <FileTextOutlined
                      style={{ fontSize: 20, color: token.colorPrimary }}
                    />
                    <div style={{ overflow: "hidden" }}>
                      <Text ellipsis title={file.name}>
                        {file.name}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {Math.round(file.size / 1024)} KB
                      </Text>
                    </div>
                  </Flex>
                </Card>
              ))}
            </Space>
          </>
        )}
      </div>
    </Modal>
  );
};

/**
 * �🛠️ ส่วนแสดงผลตารางรายการงาน
 * จัดการข้อมูลและการแสดงผลในรูปแบบตาราง พร้อมระบบ AI สรุปงาน
 */
const IssuesListTable: React.FC<{
  onReload: () => void;
  space: string;
}> = ({ onReload, space }) => {
  const { token } = theme.useToken();
  const dispatch = useDispatch<AppDispatch>();
  const { issues, total, page, pageSize, loading, selectedRowKeys } =
    useSelector((state: RootState) => state.issues);

  const [aiModal, setAiModal] = useState<{
    generating: boolean;
    issue: Issue | null;
    newText: string;
    open: boolean;
  }>({
    generating: false,
    issue: null,
    newText: "",
    open: false,
  });

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    issue: Issue | null;
  }>({
    open: false,
    issue: null,
  });

  const [aiProcessing, setAiProcessing] = useState<{
    open: boolean;
    currentStep: number;
    processingTime: number;
  }>({
    open: false,
    currentStep: 0,
    processingTime: 0,
  });

  const [engineSelectModal, setEngineSelectModal] = useState<{
    open: boolean;
    issue: Issue | null;
  }>({
    open: false,
    issue: null,
  });

  const [aiEngine, setAiEngine] = useState<"gemini" | "chatgpt">("gemini");

  // ! ฟังก์ชันเรียกใช้ AI ในการสรุปผลงาน
  const handleInvokeAiAnalysis = async (
    issue: Issue,
    engine: "gemini" | "chatgpt",
  ) => {
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

      const markdown: string = response?.data?.data?.markdown || "";
      clearInterval(timer);
      setAiProcessing({ open: false, currentStep: 0, processingTime: 0 });
      setAiModal({ open: true, issue, generating: false, newText: markdown });

      toast.success("ประมวลผลด้วย AI สำเร็จ");
    } catch (error) {
      clearInterval(timer);
      setAiProcessing({ open: false, currentStep: 0, processingTime: 0 });
      toast.error("เรียกใช้งาน AI ไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleApplyAiUpdate = async () => {
    if (!aiModal.issue) return;
    const toastId = toast.loading("กำลังอัปเดตข้อมูลด้วย AI...");
    try {
      const currentSummary = aiModal.issue.summary;
      const finalSummary = currentSummary.includes("[AI]")
        ? currentSummary
        : `${currentSummary} [AI]`;

      await axios.post("/api/v1/backlog/issues/update", {
        space,
        issueKeyOrId: aiModal.issue.issueKey || aiModal.issue.id,
        description: aiModal.newText,
        summary: finalSummary,
      });
      toast.success("อัปเดตข้อมูลสำเร็จ", { id: toastId });
      setAiModal({ open: false, issue: null, generating: false, newText: "" });
      onReload();
    } catch (error) {
      toast.error("อัปเดตข้อมูลไม่สำเร็จ", { id: toastId });
    }
  };

  const columns: ColumnsType<Issue> = [
    {
      title: "รหัสงาน",
      dataIndex: "issueKey",
      key: "issueKey",
      width: 120,
      fixed: "left",
      sorter: (a, b) => a.issueKey.localeCompare(b.issueKey),
      render: (key: string) => (
        <Typography.Link
          href={`https://${space}.backlog.com/view/${key}`}
          target="_blank"
          strong
          style={{ fontWeight: 600 }}
        >
          {key}
        </Typography.Link>
      ),
    },
    {
      title: "ประเภท",
      dataIndex: ["issueType", "name"],
      key: "issueType",
      width: 100,
      render: (_, record) => (
        <Tag color={record.issueType?.color || "default"}>
          {record.issueType?.name || "N/A"}
        </Tag>
      ),
    },
    {
      title: "หัวข้อ",
      dataIndex: "summary",
      key: "summary",
      ellipsis: true,
      width: 250,
      sorter: (a, b) => a.summary.localeCompare(b.summary),
      render: (text: string, record: Issue) => (
        <Tooltip title={text}>
          <Text style={{ fontWeight: 500 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "สรุปด้วย AI",
      key: "aiStatus",
      width: 120,
      align: "center",
      render: (_, record) => {
        const hasAi = record.summary?.includes("AI");
        return hasAi ? (
          <Tooltip title="สรุปด้วย AI เรียบร้อยแล้ว">
            <CheckCircleFilled
              style={{ color: token.colorSuccess, fontSize: 18 }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="ยังไม่ได้สรุปด้วย AI">
            <CloseCircleFilled
              style={{ color: token.colorError, fontSize: 18 }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: ["status", "name"],
      key: "status",
      width: 130,
      sorter: (a, b) =>
        (a.status?.name || "").localeCompare(b.status?.name || ""),
      render: (_, record) =>
        record.status ? (
          <ColoredBadge text={record.status.name} color={record.status.color} />
        ) : (
          "-"
        ),
    },
    {
      title: "ความสำคัญ",
      dataIndex: ["priority", "name"],
      key: "priority",
      width: 100,
      sorter: (a, b) =>
        (a.priority?.name || "").localeCompare(b.priority?.name || ""),
      render: (name) => (
        <Tag
          color={
            name === "High" ? "volcano" : name === "Normal" ? "blue" : "default"
          }
          icon={<PushpinOutlined />}
        >
          {name || "N/A"}
        </Tag>
      ),
    },
    {
      title: "หมวดหมู่",
      key: "category",
      width: 150,
      ellipsis: true,
      render: (_, record) => (
        <Space wrap size={[0, 4]}>
          {record.category?.length ? (
            record.category.map((c: any) => <Tag key={c.id}>{c.name}</Tag>)
          ) : (
            <Space size={4}>
              <ExclamationCircleOutlined style={{ color: token.colorError }} />
              <Text type="danger" style={{ fontSize: 13 }}>
                ไม่ได้ระบุ
              </Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: "ผู้รับผิดชอบ",
      key: "assignee",
      width: 180,
      sorter: (a, b) =>
        (a.assignee?.name || "").localeCompare(b.assignee?.name || ""),
      render: (_, record) =>
        record.assignee ? (
          <Space size={8}>
            <Avatar
              size="small"
              src={record.assignee?.nulabAccount?.iconUrl}
              icon={<UserOutlined />}
            />
            <Text style={{ fontWeight: 500, fontSize: 13 }}>
              {record.assignee?.name}
            </Text>
          </Space>
        ) : (
          <Space size={4}>
            <ExclamationCircleOutlined style={{ color: token.colorError }} />
            <Text type="danger" style={{ fontSize: 13 }}>
              ไม่ได้ระบุ
            </Text>
          </Space>
        ),
    },
    {
      title: "กำหนดส่ง",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      sorter: (a, b) =>
        dayjs(a.dueDate || 0).unix() - dayjs(b.dueDate || 0).unix(),
      render: (date) =>
        date ? (
          <Space size={4}>
            <CalendarOutlined
              style={{ fontSize: 12, color: token.colorTextDescription }}
            />
            <Text style={{ fontSize: 13 }}>{formatDateThai(date)}</Text>
          </Space>
        ) : (
          <Space size={4}>
            <ExclamationCircleOutlined style={{ color: token.colorError }} />
            <Text type="danger" style={{ fontSize: 13 }}>
              ไม่ได้ระบุ
            </Text>
          </Space>
        ),
    },
    {
      title: "อัปเดตเมื่อ",
      dataIndex: "updated",
      key: "updated",
      width: 120,
      sorter: (a, b) =>
        dayjs(a.updated || 0).unix() - dayjs(b.updated || 0).unix(),
      render: (date) => (
        <Space size={4}>
          <HistoryOutlined
            style={{ fontSize: 12, color: token.colorTextDescription }}
          />
          <Text style={{ fontSize: 13 }}>{formatDateThai(date)}</Text>
        </Space>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 120,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => setDetailModal({ open: true, issue: record })}
            />
          </Tooltip>
          <Tooltip title="ใช้งาน AI วิเคราะห์งาน">
            <Button
              shape="circle"
              icon={<RobotOutlined />}
              onClick={() =>
                setEngineSelectModal({ open: true, issue: record })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table<Issue>
        columns={columns}
        dataSource={
          issues.length > pageSize ? issues.slice(0, pageSize) : issues
        }
        rowKey={(r) => r.id}
        loading={loading}
        pagination={{
          total,
          current: page,
          pageSize,
          showSizeChanger: true,
          onChange: (p, ps) =>
            dispatch(setPagination({ page: p, pageSize: ps })),
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => dispatch(setSelectedRowKeys(keys)),
        }}
        scroll={{ x: 1500 }}
        size="middle"
      />

      <IssueDetailModal
        open={detailModal.open}
        issue={detailModal.issue}
        space={space}
        onClose={() => setDetailModal({ open: false, issue: null })}
      />

      <AiUpdateModal
        aiState={aiModal}
        onApprove={handleApplyAiUpdate}
        onClose={() =>
          setAiModal({
            open: false,
            issue: null,
            generating: false,
            newText: "",
          })
        }
        onRegenerate={() =>
          aiModal.issue && handleInvokeAiAnalysis(aiModal.issue, aiEngine)
        }
        onUpdateText={(val) =>
          setAiModal((prev) => ({ ...prev, newText: val }))
        }
      />

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
            icon: <RobotOutlined />,
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
                handleInvokeAiAnalysis(engineSelectModal.issue, "gemini");
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
                handleInvokeAiAnalysis(engineSelectModal.issue, "chatgpt");
              setEngineSelectModal({ open: false, issue: null });
            }}
          >
            OpenAI ChatGPT (ละเอียด)
          </Button>
        </Flex>
      </Modal>
    </>
  );
};

// ==========================================
// * Types Definition
// ==========================================

// ? ข้อมูล Metadata ของโปรเจกต์
type ProjectMetadataResponse = {
  data?: {
    categories?: { id: number | string; name: string }[];
    milestones?: { id: number | string; name: string }[];
  };
};

// ? พารามิเตอร์สำหรับ Hook Data
type IssuesPageParams = {
  projectId: number;
  space: string;
  projectReady: boolean;
  modalApi?: HookAPI;
};

// ==========================================
// * Utilities
// ==========================================

// ! แปลง Error ให้เป็นข้อความที่อ่านง่าย
const buildErrorDetails = (
  error: unknown,
): { message: string; details: string } => {
  if (!error)
    return { message: "ไม่ทราบสาเหตุ", details: "ไม่มีรายละเอียดเพิ่มเติม" };
  if (error instanceof Error)
    return { message: error.message, details: error.stack || error.message };
  if (typeof error === "string") return { message: error, details: error };
  try {
    const json = JSON.stringify(error, null, 2);
    return { message: json, details: json };
  } catch {
    return { message: "เกิดข้อผิดพลาดที่ไม่คาดคิด", details: String(error) };
  }
};

// ==========================================
// * Custom Hooks (Data Logic)
// ==========================================

const useIssuesPageData = ({
  projectId,
  space,
  projectReady,
  modalApi,
}: IssuesPageParams) => {
  const dispatch = useDispatch<AppDispatch>();
  const { page, pageSize, filters, total, loading, issues } = useSelector(
    (state: RootState) => state.issues,
  );

  // * รวมข้อมูล State ที่จำเป็นส่งออกไปใช้งาน
  const state = useMemo(
    () => ({ page, pageSize, filters, total, loading, issues }),
    [filters, loading, page, pageSize, total, issues],
  );

  // ! ฟังก์ชันแสดง Error Modal
  const showErrorModal = useCallback(
    (title: string, error: unknown) => {
      const { message, details } = buildErrorDetails(error);
      const contentNode = (
        <div className="flex flex-col gap-2">
          <span>{message}</span>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">ดูรายละเอียดทางเทคนิค</summary>
            <pre className="whitespace-pre-wrap text-gray-500 mt-2">
              {details}
            </pre>
          </details>
        </div>
      );
      (modalApi ?? Modal).error({ title, content: contentNode });
    },
    [modalApi],
  );

  // * ฟังก์ชันโหลดรายการ Issues
  const loadIssues = useCallback(async () => {
    if (!projectReady) return;

    const toastId = toast.loading("กำลังโหลดรายการงาน...");
    dispatch(setLoading(true));

    try {
      const {
        keyword,
        statusIds,
        priorityIds,
        issueTypeIds,
        assigneeIds,
        dateRange,
        aiSummaryFilter,
      } = filters;

      // ? เตรียม Params ส่ง API
      const apiParams: Record<string, unknown> = {
        space,
        projectId,
        page,
        count: pageSize,
        offset: Math.max(0, (page - 1) * pageSize),
        q: keyword?.trim(),
        statusId: statusIds?.length ? statusIds : undefined,
        priorityId: priorityIds?.length ? priorityIds : undefined,
        issueTypeId: issueTypeIds?.length ? issueTypeIds : undefined,
        assigneeId: assigneeIds?.length ? assigneeIds : undefined,
        updatedSince: dateRange?.[0]?.toISOString(),
        updatedUntil: dateRange?.[1]?.toISOString(),
      };

      const response = await axios.get("/api/v1/backlog/issues", {
        params: apiParams,
      });
      let items = response.data?.data?.items || [];
      const totalItems = Number(response.data?.data?.total) || 0;

      // * Client-side Filtering สำหรับ AI Summary
      if (aiSummaryFilter === "with_ai") {
        items = items.filter((issue: any) => issue.summary?.includes("AI"));
      } else if (aiSummaryFilter === "without_ai") {
        items = items.filter((issue: any) => !issue.summary?.includes("AI"));
      }

      dispatch(setIssues({ issues: items, total: totalItems }));
      dispatch(setSelectedRowKeys([]));
      toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล", { id: toastId });
      showErrorModal("ไม่สามารถโหลดรายการงานได้", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [
    dispatch,
    filters,
    page,
    pageSize,
    projectId,
    projectReady,
    space,
    showErrorModal,
  ]);

  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    closed: 0,
    progress: 0,
  });

  // ! ฟังก์ชันโหลดสถิติภาพรวมของโปรเจกต์ (แบบไม่กรองตาม Table)
  const loadSummaryStats = useCallback(
    async (statusList: any[]) => {
      try {
        const closedStatusIds = statusList
          .filter((s: any) =>
            /closed|done|completed|finish|สำเร็จ|ปิดงาน/i.test(s?.name ?? ""),
          )
          .map((s: any) => s.id);

        const [totalRes, closedRes] = await Promise.all([
          axios.get("/api/v1/backlog/issues", {
            params: { space, projectId, count: 1 },
          }),
          closedStatusIds.length > 0
            ? axios.get("/api/v1/backlog/issues", {
                params: {
                  space,
                  projectId,
                  count: 1,
                  statusId: closedStatusIds,
                },
              })
            : Promise.resolve({ data: { data: { total: 0 } } }),
        ]);

        const total = totalRes.data?.data?.total || 0;
        const closed = closedRes.data?.data?.total || 0;
        const progress = total > 0 ? Math.round((closed / total) * 100) : 0;

        setSummaryStats({ total, closed, progress });
      } catch (error) {
        console.error("Failed to load summary stats", error);
      }
    },
    [space, projectId],
  );

  // * ฟังก์ชันโหลด Options (สถานะ, ผู้รับผิดชอบ ฯลฯ)
  const loadOptions = useCallback(async () => {
    if (!projectReady) return;

    dispatch(setOptionsLoading(true));
    const toastId = toast.loading("กำลังเตรียมข้อมูลเริ่มต้น...");

    try {
      // ? ยิง API พร้อมกันเพื่อความเร็ว
      const [statusesRes, prioritiesRes, issueTypesRes, usersRes] =
        await Promise.all([
          axios.get("/api/v1/backlog/project-statuses", {
            params: { space, projectId },
          }),
          axios.get("/api/v1/backlog/priorities", { params: { space } }),
          axios.get("/api/v1/backlog/issue-types", {
            params: { space, projectId },
          }),
          axios.get("/api/v1/backlog/users", { params: { space, projectId } }),
        ]);

      const mapOption = (list: any[]) =>
        list?.map((item: any) => ({ label: item.name, value: item.id })) || [];

      // ? Setup ตัวเลือกต่าง ๆ เข้า Redux
      const statusOptions = mapOption(statusesRes?.data?.data);
      const priorityOptions = mapOption(prioritiesRes?.data?.data);
      const issueTypeOptions = mapOption(issueTypesRes?.data?.data);
      const assigneeOptions = mapOption(usersRes?.data?.data);

      dispatch(
        setOptions({
          statusOptions,
          priorityOptions,
          issueTypeOptions,
          assigneeOptions,
        }),
      );

      // ? โหลดสถิติรวมของโปรเจกต์
      loadSummaryStats(statusesRes?.data?.data || []);

      // ? ตั้งค่า Filter เริ่มต้น (เลือกสถานะ Open และประเภทงาน Bug)
      const openStatusIds = (statusesRes?.data?.data || [])
        .filter((s: any) => /open/i.test(s?.name ?? ""))
        .map((s: any) => s.id);

      const bugTypeIds = (issueTypesRes?.data?.data || [])
        .filter((it: any) => /bug/i.test(it?.name ?? ""))
        .map((it: any) => it.id);

      dispatch(
        setFilters({
          statusIds: openStatusIds,
          issueTypeIds: bugTypeIds,
          priorityIds: priorityOptions
            .map((p: any) => Number(p.value))
            .filter((v: number) => !isNaN(v)),
        }),
      );

      // ? โหลด Metadata เพิ่มเติมถ้ามี ProjectId
      if (projectId) {
        const metadataRes = await axios.get<ProjectMetadataResponse>(
          `/api/v1/backlog/projects/${projectId}/metadata`,
          { params: { space } },
        );
        const metadata = metadataRes?.data?.data;
        dispatch(
          setOptions({
            categoryOptions: mapOption(metadata?.categories || []),
            milestoneOptions: mapOption(metadata?.milestones || []),
          }),
        );
      }

      toast.success("เตรียมข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลเริ่มต้นได้", { id: toastId });
      showErrorModal("เกิดข้อผิดพลาดในการเตรียมข้อมูล", error);
    } finally {
      dispatch(setOptionsLoading(false));
    }
  }, [dispatch, projectReady, projectId, space, showErrorModal]);

  const handleSearchKeyword = useCallback(
    (value: string) => {
      dispatch(setFilters({ keyword: value }));
      dispatch(setPagination({ page: 1, pageSize }));
    },
    [dispatch, pageSize],
  );

  // ! Auto-reload data when pagination changes
  useEffect(() => {
    if (projectReady && state.issues.length > 0) {
      loadIssues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return {
    state,
    summaryStats,
    loadIssues,
    loadOptions,
    handleSearchKeyword,
    resetAction: () => dispatch(resetFilters()),
  };
};

// ==========================================
// * Data Visualization Components
// ==========================================

/**
 * 📊 IssueSummaryModal: สรุปภาพรวมของงานในรูปแบบกราฟและสถิติ
 */
const IssueSummaryModal: React.FC<{
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  total: number;
}> = ({ open, onClose, issues, total }) => {
  const { token } = theme.useToken();
  const stats = useMemo(() => {
    const closed = issues.filter((i) =>
      ["closed", "done", "completed", "finish"].some((s) =>
        i.status?.name?.toLowerCase().includes(s),
      ),
    ).length;
    const highPriority = issues.filter(
      (i) => i.priority?.name === "High",
    ).length;
    return { closed, open: issues.length - closed, highPriority };
  }, [issues]);

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <BarChartOutlined style={{ color: token.colorPrimary }} />
          <span>รายงานสรุปผลงาน</span>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          ปิดหน้าต่าง
        </Button>,
      ]}
      width={700}
      centered
    >
      <div style={{ paddingBlock: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card
              size="small"
              style={{ textAlign: "center", borderRadius: 12 }}
            >
              <Statistic
                title="งานทั้งหมดที่ดึงมา"
                value={issues.length}
                suffix={`/ ${total}`}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card
              size="small"
              style={{ textAlign: "center", borderRadius: 12 }}
            >
              <Statistic
                title="งานที่เสร็จสิ้น"
                value={stats.closed}
                valueStyle={{ color: token.colorSuccess }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card
              size="small"
              style={{ textAlign: "center", borderRadius: 12 }}
            >
              <Statistic
                title="งานด่วน (High)"
                value={stats.highPriority}
                valueStyle={{ color: token.colorError }}
              />
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Text type="secondary">
            หมายเหตุ: ข้อมูลนี้คำนวณจากรายการงานจำนวน {issues.length}{" "}
            รายการที่แสดงอยู่ในหน้าจอปัจจุบัน
          </Text>
        </div>
      </div>
    </Modal>
  );
};

/**
 * 📦 BulkUpdateModal: จัดการอัปเดตข้อมูลจำนวนมาก
 */
const BulkUpdateModal: React.FC<{
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectId: number;
  space: string;
  onUpdateComplete: () => void;
  minimized: boolean;
  onRequestMinimize: () => void;
  onProgress: (progress: {
    percent: number;
    status: string;
    success: number;
    total: number;
  }) => void;
}> = ({
  open,
  onClose,
  projectName,
  projectId,
  space,
  onUpdateComplete,
  minimized,
  onRequestMinimize,
  onProgress,
}) => {
  const { token } = theme.useToken();
  if (minimized) return null;
  return (
    <Modal
      title={
        <Flex align="center" gap={12} style={{ paddingBottom: 8 }}>
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppstoreAddOutlined
              style={{ color: token.colorInfo, fontSize: 24 }}
            />
          </div>
          <Flex vertical gap={2}>
            <span style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Batch Operations / Bulk Action
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 400,
                color: token.colorTextSecondary,
              }}
            >
              Project: {projectName}
            </span>
          </Flex>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1300}
      centered
      styles={{
        content: {
          boxShadow: "none",
        },
        body: {
          padding: 0,
          borderRadius: "0 0 16px 16px",
          overflow: "hidden",
        },
        header: {
          padding: "24px 32px 16px 32px",
          margin: 0,
        },
      }}
      style={{ top: 20 }}
    >
      <SharedBulkUpdateSection
        space={space}
        projectId={projectId}
        projectName={projectName}
        elevatedCardStyle={{
          border: "none",
          boxShadow: "none",
        }}
        onUpdateComplete={() => {
          onUpdateComplete();
          onClose();
        }}
        onRequestMinimize={onRequestMinimize}
        onProgressUpdate={onProgress}
        minimized={minimized}
      />
    </Modal>
  );
};

// ==========================================
// * Main Page Component
// ==========================================

function ProjectIssuesPageContent(): JSX.Element {
  const { token } = theme.useToken();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [showSummary, setShowSummary] = useState(false);

  const { statusOptions, priorityOptions, issueTypeOptions, assigneeOptions } =
    useSelector((state: RootState) => state.issues);

  // * State สำหรับ Modal ของ Filter และ Bulk Update
  const [showBulk, setShowBulk] = useState(false);
  const [isBulkMinimized, setIsBulkMinimized] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    percent: number;
    status: string;
    success: number;
    total: number;
  }>({
    percent: 0,
    status: "idle",
    success: 0,
    total: 0,
  });

  // * Extract Parameters
  const projectId = Number(params?.projectId);
  const space = searchParams?.get("space") ?? "";
  const projectName = searchParams?.get("name") ?? "";
  const projectReady = !isNaN(projectId) && projectId > 0 && !!space;

  // * Use Custom Hook logic
  const { state, summaryStats, loadIssues, loadOptions, resetAction } =
    useIssuesPageData({
      projectId,
      space,
      projectReady,
    });

  // ? Initial Data Load
  useEffect(() => {
    if (!projectReady) return;
    loadOptions().then(() => {
      loadIssues();
      toast.success("ดาวน์โหลดข้อมูลแสดงรายการงานสมบูรณ์");
    });
    return () => {
      resetAction();
    };
  }, [projectReady, projectId, space]);

  if (!projectReady) {
    return (
      <StatusModalComponent
        open={true}
        type="error"
        title="ข้อมูลไม่ครบถ้วน"
        message="ไม่พบรหัสโครงการหรือพื้นที่ทำงาน กรุณารีเฟรชหน้าจอหรือกลับไปหน้าหลัก"
        onClose={() => router.push("/backlogs/report")}
      />
    );
  }

  return (
    <DashboardLayout>
      <Layout>
        <Content>
          <Flex vertical gap={24}>
            {/* ส่วนที่ 1 : ส่วนหัวของหน้าหน้าจอ */}
            <HeaderBar
              icon={<RocketOutlined />}
              title={projectName || `โครงการ ${projectId}`}
              subTitle={`พื้นที่ทำงาน: ${space}`}
              showBackButton
              extra={
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => setShowSummary(true)}
                  size="large"
                  type="primary"
                  style={{ fontWeight: 600 }}
                >
                  รายงานสรุปผลงาน
                </Button>
              }
            />

            {/* ส่วนที่ 2 : Summary Cards (สรุปภาพรวม) */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <SummaryCard
                  title="จำนวนงานทั้งหมด"
                  value={summaryStats.total}
                  subtitle="รายการในระบบ"
                  icon={<FileTextOutlined />}
                  color={token.colorPrimary}
                  isLoading={state.loading}
                />
              </Col>
              <Col xs={24} sm={8}>
                <SummaryCard
                  title="งานที่เสร็จสิ้น"
                  value={summaryStats.closed}
                  subtitle="รายการที่ปิดงานแล้ว"
                  icon={<CheckCircleOutlined />}
                  color={token.colorSuccess}
                  percent={summaryStats.progress}
                  isLoading={state.loading}
                />
              </Col>
              <Col xs={24} sm={8}>
                <SummaryCard
                  title="อัตราความสำเร็จ"
                  value={`${summaryStats.progress}%`}
                  subtitle="เปอร์เซ็นต์รวม"
                  icon={<TrophyOutlined />}
                  color="#faad14"
                  percent={summaryStats.progress}
                  isLoading={state.loading}
                />
              </Col>
            </Row>

            {/* ส่วนที่ 3 : ตัวกรองข้อมูล (Filter) */}
            <Card
              styles={{ body: { padding: 24 } }}
              style={{
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                <FilterOutlined
                  style={{ color: token.colorPrimary, fontSize: "1.25rem" }}
                />
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: "1.25rem",
                  }}
                >
                  ตัวกรองข้อมูล
                </Title>
              </Flex>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" className="w-full" size={4}>
                    <Text strong>ค้นหาจากคำสำคัญ</Text>
                    <Input
                      placeholder="ระบุชื่อรหัสงาน หรือหัวข้องาน..."
                      prefix={<SearchOutlined />}
                      value={state.filters.keyword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        dispatch(setFilters({ keyword: e.target.value }))
                      }
                      onPressEnter={() => loadIssues()}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" className="w-full" size={4}>
                    <Text strong>สถานะงาน</Text>
                    <Select
                      mode="multiple"
                      className="w-full"
                      placeholder="เลือกสถานะงาน..."
                      options={statusOptions}
                      value={state.filters.statusIds}
                      onChange={(val) =>
                        dispatch(setFilters({ statusIds: val }))
                      }
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" className="w-full" size={4}>
                    <Text strong>ประเภทงาน (Issue Type)</Text>
                    <Select
                      mode="multiple"
                      className="w-full"
                      placeholder="เลือกประเภทงาน (เช่น Bug, Task)..."
                      options={issueTypeOptions}
                      value={state.filters.issueTypeIds}
                      onChange={(val) =>
                        dispatch(setFilters({ issueTypeIds: val }))
                      }
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" className="w-full" size={4}>
                    <Text strong>ผู้รับผิดชอบ</Text>
                    <Select
                      mode="multiple"
                      className="w-full"
                      placeholder="เลือกผู้รับผิดชอบ..."
                      options={assigneeOptions}
                      value={state.filters.assigneeIds}
                      onChange={(val) =>
                        dispatch(setFilters({ assigneeIds: val }))
                      }
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" className="w-full" size={4}>
                    <Text strong>สถานะ AI Summary</Text>
                    <Select
                      className="w-full"
                      placeholder="กรองสถานะการสรุปด้วย AI..."
                      value={state.filters.aiSummaryFilter}
                      onChange={(val) =>
                        dispatch(setFilters({ aiSummaryFilter: val }))
                      }
                      options={[
                        { label: "ทั้งหมด", value: "all" },
                        { label: "ถูกสรุปด้วย AI แล้ว", value: "with_ai" },
                        { label: "ยังไม่ถูกสรุปด้วย AI", value: "without_ai" },
                      ]}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" className="w-full" size={4}>
                    <Text strong>ช่วงเวลาอัปเดต</Text>
                    <RangePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                      value={state.filters.dateRange}
                      onChange={(dates) =>
                        dispatch(setFilters({ dateRange: dates }))
                      }
                    />
                  </Space>
                </Col>
              </Row>

              <Flex justify="end" gap={12} style={{ marginTop: 24 }}>
                <Button icon={<ClearOutlined />} onClick={() => resetAction()}>
                  ล้างการค้นหา
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => loadIssues()}
                >
                  ค้นหาข้อมูล
                </Button>
              </Flex>
            </Card>

            {/* ส่วนที่ 4 : ตารางข้อมูลเนื้อหา */}
            <Card
              styles={{ body: { padding: 16 } }}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
              title={
                <Flex align="center" gap={12}>
                  <UnorderedListOutlined
                    style={{ color: token.colorPrimary }}
                  />
                  <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                    รายการงาน
                  </span>
                </Flex>
              }
              extra={
                <Space>
                  <Button
                    icon={<AppstoreAddOutlined />}
                    onClick={() => {
                      setShowBulk(true);
                      setIsBulkMinimized(false);
                    }}
                    style={{ fontWeight: 600 }}
                  >
                    Bulk Action
                  </Button>
                  <Tag
                    color={state.loading ? "processing" : "success"}
                    icon={
                      state.loading ? (
                        <Spin size="small" />
                      ) : (
                        <CheckCircleOutlined />
                      )
                    }
                  >
                    {state.loading ? "กำลังโหลด..." : "ข้อมูลล่าสุด"}
                  </Tag>
                </Space>
              }
            >
              <IssuesListTable onReload={loadIssues} space={space} />
            </Card>
          </Flex>
        </Content>
      </Layout>

      {/* MODALS SECTION */}
      <IssueSummaryModal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        issues={state.issues || []}
        total={state.total}
      />

      <BulkUpdateModal
        open={showBulk}
        onClose={() => {
          setShowBulk(false);
          setIsBulkMinimized(false);
        }}
        projectName={projectName}
        projectId={projectId}
        space={space}
        onUpdateComplete={() => {
          loadIssues();
          toast.success("อัปเดตข้อมูลจำนวนมากสำเร็จ");
        }}
        minimized={isBulkMinimized}
        onRequestMinimize={() => setIsBulkMinimized(true)}
        onProgress={setBulkProgress}
      />

      {/* Floating AI Widget (Pinned) */}
      {isBulkMinimized && showBulk && (
        <div
          onClick={() => setIsBulkMinimized(false)}
          style={{
            position: "fixed",
            bottom: 40,
            right: 40,
            zIndex: 1000,
            cursor: "pointer",
            padding: "12px 24px",
            borderRadius: 24,
            boxShadow: "none",
            border: `1px solid ${token.colorPrimary}`,
          }}
        >
          <Flex align="center" gap={12}>
            <RobotOutlined
              style={{ color: token.colorPrimary, fontSize: 20 }}
            />
            <Text strong>AI กำลังทำงาน ({bulkProgress.percent}%)</Text>
          </Flex>
        </div>
      )}
    </DashboardLayout>
  );
}

// * Entry Point
export default function ProjectIssuesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Card
            style={{ borderRadius: 24, padding: 32 }}
            className="shadow-lg text-center"
          >
            <Space direction="vertical" size="large">
              <Spin size="large" />
              <Typography.Text className="text-gray-500">
                กำลังเตรียมข้อมูล...
              </Typography.Text>
            </Space>
          </Card>
        </div>
      }
    >
      <ProjectIssuesPageContent />
    </Suspense>
  );
}
