"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  PushpinOutlined,
  RobotOutlined,
  SearchOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Avatar,
  Button,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import ColoredBadge from "@components/ant-design/table/table-badge-color";
import TableSearchFilter from "@components/ant-design/table/table-search-component";
import AiUpdateModal from "@components/backlog/issue-drawer/ai-update-modal";
import type { Issue } from "@components/backlog/issue-drawer/types";
import AIProcessingModal from "@components/modal/ai-processing-modal";
import {
  setPagination,
  setSelectedRowKeys,
} from "@stores/reducers/issues-slice";
import { RootState } from "@stores/store";

interface IssuesTableProps {
  listCardStyle: React.CSSProperties;
  onReload: () => void;
  space: string;
}

const IssuesTable: React.FC<IssuesTableProps> = ({
  listCardStyle,
  onReload,
  space,
}) => {
  const { token } = theme.useToken();
  const { colorPrimary, colorSuccess, colorError } = token;
  const dispatch = useDispatch();
  const { issues, total, page, pageSize, loading, selectedRowKeys } =
    useSelector((state: RootState) => state.issues);

  const [aiModal, setAiModal] = React.useState<{
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

  // AI Processing Modal State
  const [aiProcessing, setAiProcessing] = React.useState<{
    open: boolean;
    currentStep: number;
    processingTime: number;
  }>({
    open: false,
    currentStep: 0,
    processingTime: 0,
  });

  const [bulkProgress, setBulkProgress] = React.useState<
    Record<string, "processing" | "success" | "error">
  >({});

  const [engineSelectModal, setEngineSelectModal] = React.useState<{
    open: boolean;
    issue: Issue | null;
  }>({
    open: false,
    issue: null,
  });

  // Define AI Processing Steps
  const aiSteps = [
    {
      key: "prepare",
      title: "เตรียมข้อมูล",
      description: "กำลังวิเคราะห์และเตรียมข้อมูลเพื่อส่งไปยัง AI",
      icon: <FileTextOutlined />,
      status: "wait" as const,
    },
    {
      key: "send",
      title: "ส่งคำขอไปยัง Gemini AI",
      description: "กำลังส่งข้อมูลไปยัง Google Gemini เพื่อประมวลผล",
      icon: <SendOutlined />,
      status: "wait" as const,
    },
    {
      key: "process",
      title: "ประมวลผลด้วย AI",
      description: "AI กำลังวิเคราะห์และสรุปเนื้อหาเป็น Markdown",
      icon: <RobotOutlined />,
      status: "wait" as const,
    },
    {
      key: "format",
      title: "จัดรูปแบบผลลัพธ์",
      description: "กำลังจัดรูปแบบและปรับแต่งเนื้อหาที่ได้จาก AI",
      icon: <EditOutlined />,
      status: "wait" as const,
    },
    {
      key: "complete",
      title: "เสร็จสิ้น",
      description: "ได้รับผลลัพธ์จาก AI เรียบร้อยแล้ว",
      icon: <CheckCircleOutlined />,
      status: "wait" as const,
    },
  ];

  const [aiEngine, setAiEngine] = React.useState<"gemini" | "chatgpt">(
    "gemini",
  );

  const onClickAI = async (issue: Issue, engine: "gemini" | "chatgpt") => {
    setAiEngine(engine);
    // เปิด AI Processing Modal
    setAiProcessing({
      open: true,
      currentStep: 0,
      processingTime: 0,
    });

    const startTime = Date.now();
    let stepTimer: NodeJS.Timeout;
    let timeTimer: NodeJS.Timeout;

    // Timer สำหรับอัปเดตเวลา
    timeTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setAiProcessing((prev) => ({
        ...prev,
        processingTime: seconds,
      }));
    }, 1000);

    try {
      // Step 1: เตรียมข้อมูล
      setAiProcessing((prev) => ({ ...prev, currentStep: 0 }));
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate preparation time

      // Step 2: ส่งคำขอ
      setAiProcessing((prev) => ({ ...prev, currentStep: 1 }));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: ประมวลผลด้วย AI
      setAiProcessing((prev) => ({ ...prev, currentStep: 2 }));

      const endpoint =
        engine === "chatgpt"
          ? "/api/v1/ai/chatgpt/summarize"
          : "/api/v1/ai/gemini/summarize";
      const response = await axios.post(endpoint, {
        summary: issue.summary,
        description: issue.description,
        // Send full issue details for better Context
        details: issue,
        issueKey: issue.issueKey || String(issue.id),
      });

      // Step 4: จัดรูปแบบผลลัพธ์
      setAiProcessing((prev) => ({ ...prev, currentStep: 3 }));
      await new Promise((resolve) => setTimeout(resolve, 800));

      const markdown: string = response?.data?.data?.markdown || "";

      // Step 5: เสร็จสิ้น
      setAiProcessing((prev) => ({ ...prev, currentStep: 4 }));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ปิด Processing Modal และเปิด Result Modal
      clearInterval(timeTimer);
      setAiProcessing({ open: false, currentStep: 0, processingTime: 0 });

      setAiModal({
        open: true,
        issue,
        generating: false,
        newText: markdown,
      });

      const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
      toast.success(`ได้รับผลจาก AI แล้ว (ใช้เวลา ${totalSeconds} วินาที)`, {
        duration: 2500,
      });
    } catch (error: any) {
      clearInterval(timeTimer);
      setAiProcessing({ open: false, currentStep: 0, processingTime: 0 });
      setAiModal((prev) => ({ ...prev, generating: false }));

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "เรียก AI ไม่สำเร็จ",
        {
          duration: 3000,
        },
      );
    }
  };

  const doApproveUpdate = async () => {
    if (!aiModal.issue) return;
    const toastId = toast.loading("กำลังอัปเดตคำอธิบายด้วย AI...");
    try {
      toast.message("กำลังส่งคำอธิบายใหม่ไปยัง Backlog", { id: toastId });

      // ตรวจสอบว่า summary มีคำว่า AI หรือ [สรุปด้วย LIGHT AI ✨] อยู่แล้วหรือไม่
      const currentSummary = aiModal.issue.summary;
      const hasAiPrefix =
        currentSummary.includes("AI") ||
        currentSummary.includes("✨") ||
        currentSummary.includes("🤖");
      const finalSummary = hasAiPrefix
        ? currentSummary
        : currentSummary + " " + "[สรุปด้วย LIGHT AI ✨] ";

      await axios.post("/api/v1/backlog/issues/update", {
        space,
        issueKeyOrId: aiModal.issue.issueKey || aiModal.issue.id,
        description: aiModal.newText,
        summary: finalSummary,
      });
      toast.success("อัปเดต Issue สำเร็จ", { id: toastId });
      setAiModal({ open: false, issue: null, generating: false, newText: "" });
      onReload();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "อัปเดตไม่สำเร็จ",
        { id: toastId },
      );
    }
  };

  const handleAiClose = () => {
    setAiModal({ generating: false, issue: null, newText: "", open: false });
  };

  const handleAiRegenerate = () => {
    if (aiModal.issue) {
      onClickAI(aiModal.issue, aiEngine);
    }
  };

  const stripMarkdown = (value?: string | null): string => {
    if (!value) return "-";
    return value
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^>{1,6}\s+/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`{1,3}/g, "")
      .replace(/!\[.*?\]\((.*?)\)/g, "[image: $1]")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      .replace(/^\s*-\s+/gm, "• ")
      .replace(/^\s*\*\s+/gm, "• ")
      .replace(/\r\n/g, "\n");
  };

  const markdownToHtml = (value?: string | null) => {
    const md = value || "";
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";

    const renderInline = (text: string) =>
      text
        .replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          '<img alt="$1" src="$2" style="max-width:100%; border-radius:8px;" />',
        )
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
        )
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");

    const flushParagraph = (buffer: string[]) => {
      if (!buffer.length) return;
      html += `<p style="margin:0;">${renderInline(
        buffer.join(" ").trim(),
      )}</p>`;
      buffer.length = 0;
    };

    const parseTable = (start: number) => {
      const headerLine = lines[start];
      const rows: string[] = [];
      let idx = start + 2;
      while (idx < lines.length && /^\|.*\|$/.test(lines[idx].trim())) {
        rows.push(lines[idx]);
        idx += 1;
      }

      const cells = (line: string) =>
        line
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => renderInline(cell.trim()));

      const headers = cells(headerLine);
      const bodyRows = rows.map((row) => cells(row));

      html += `<table style="width:100%; border-collapse:collapse; margin:6px 0;">`;
      html += `<thead><tr>`;
      headers.forEach((h) => {
        html += `<th style="border:1px solid #e5e5e5; padding:8px; background:#f7f7f7; text-align:left;">${h}</th>`;
      });
      html += `</tr></thead><tbody>`;
      bodyRows.forEach((r) => {
        html += `<tr>`;
        r.forEach((c) => {
          html += `<td style="border:1px solid #e5e5e5; padding:8px; text-align:left;">${c}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;

      return idx - 1;
    };

    const buffer: string[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph(buffer);
        continue;
      }

      const headingMatch = /^#{1,6}\s+(.*)/.exec(trimmed);
      if (headingMatch) {
        flushParagraph(buffer);
        const level = trimmed.indexOf(" ");
        html += `<h${level} style="margin:0 0 6px;">${renderInline(
          headingMatch[1].trim(),
        )}</h${level}>`;
        continue;
      }

      const isTableHeader =
        /^\|.*\|$/.test(trimmed) &&
        i + 1 < lines.length &&
        /\|?\s*:?-{3,}\s*\|/.test(lines[i + 1]);
      if (isTableHeader) {
        flushParagraph(buffer);
        i = parseTable(i);
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph(buffer);
        const items: string[] = [];
        let j = i;
        while (j < lines.length && /^[-*]\s+/.test(lines[j].trim())) {
          items.push(lines[j].trim().replace(/^[-*]\s+/, ""));
          j += 1;
        }
        html += `<ul style="margin:0; padding-left:18px; display:grid; gap:4px;">${items
          .map((item) => `<li>${renderInline(item)}</li>`)
          .join("")}</ul>`;
        i = j - 1;
        continue;
      }

      buffer.push(renderInline(trimmed));
    }

    flushParagraph(buffer);
    return html || "<p>-</p>";
  };

  const renderDescriptionContent = (value?: string | null) => {
    const html = markdownToHtml(value);
    return (
      <div
        style={{ width: "100%", display: "grid", gap: 8, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const formatDate = (value?: string | null) =>
    value ? dayjs(value).format("DD/MM/YYYY") : "-";

  const renderAssignee = (issue: Issue) => {
    const assignee = issue.assignee;
    if (!assignee) return <Typography.Text type="secondary">-</Typography.Text>;
    return (
      <Space size={8} align="center">
        <Avatar
          size={32}
          src={assignee?.nulabAccount?.iconUrl}
          icon={<UserOutlined />}
        />
        <div>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {assignee.name}
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11, display: "block" }}
          >
            {assignee.mailAddress}
          </Typography.Text>
        </div>
      </Space>
    );
  };

  const renderPriorityTag = (priorityName?: string) => {
    const map: Record<string, string> = {
      High: "volcano",
      Normal: "blue",
      Low: "default",
    };
    const color = priorityName ? map[priorityName] || "default" : "default";
    return (
      <Tag color={color} icon={<PushpinOutlined />} style={{ marginRight: 0 }}>
        {priorityName || "N/A"}
      </Tag>
    );
  };

  const columns: ColumnsType<Issue> = [
    {
      title: "",
      dataIndex: "progress",
      key: "progress",
      width: 60,
      align: "left",
      render: (_, record) => {
        const key = record.issueKey || String(record.id);
        const status = bulkProgress[key];
        switch (status) {
          case "processing":
            return <LoadingOutlined style={{ color: colorPrimary }} />;
          case "success":
            return <CheckCircleOutlined style={{ color: colorSuccess }} />;
          case "error":
            return <CloseCircleOutlined style={{ color: colorError }} />;
          default:
            return null;
        }
      },
    },
    {
      title: "รหัสงาน",
      dataIndex: "issueKey",
      key: "issueKey",
      width: 140,
      fixed: "left",
      sorter: (a, b) => a.issueKey.localeCompare(b.issueKey),
      filterDropdown: (props) => (
        <TableSearchFilter placeholder="ค้นหารหัสงาน" {...props} />
      ),
      filterIcon: (filtered) => (
        <SearchOutlined
          style={{ color: filtered ? colorPrimary : undefined }}
        />
      ),
      onFilter: (value, record) =>
        record.issueKey
          ?.toLowerCase()
          .includes((value as string).toLowerCase()),
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
      title: "ประเภท / เกรด",
      key: "type",
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {record.issueType ? (
            <ColoredBadge
              text={record.issueType.name}
              color={record.issueType.color}
            />
          ) : null}
          {renderPriorityTag(record.priority?.name)}
        </Space>
      ),
    },
    {
      title: "หัวข้อ",
      dataIndex: "summary",
      key: "summary",
      align: "left",
      ellipsis: true,
      width: 520,
      onCell: () => ({
        style: {
          maxWidth: 420,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      }),
      render: (text: string, record: Issue) =>
        text ? (
          <Tooltip placement="bottom" title={`${record.summary}`}>
            <Button
              type="link"
              size="middle"
              icon={<SearchOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `https://${space}.backlog.com/view/${record.issueKey}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              <Typography.Text
                ellipsis
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                {text}
              </Typography.Text>
            </Button>
          </Tooltip>
        ) : null,
    },
    {
      title: "ผู้ช่วย AI",
      key: "ai",
      width: 84,
      align: "left",
      render: (_, record) => (
        <Tooltip title="ใช้ AI สรุป/ปรับแต่งคำอธิบายเป็น .MD">
          <Button
            size="small"
            icon={<RobotOutlined />}
            onClick={() => setEngineSelectModal({ open: true, issue: record })}
          />
        </Tooltip>
      ),
    },
    {
      title: "ประเภท",
      dataIndex: ["issueType", "name"],
      key: "issueType",
      align: "left",
      width: 120,
      render: (_, record) =>
        record.issueType ? (
          <ColoredBadge
            text={record.issueType.name}
            color={record.issueType.color}
          />
        ) : null,
    },
    {
      title: "สถานะ",
      dataIndex: ["status", "name"],
      key: "status",
      align: "left",
      width: 140,
      render: (_, record) =>
        record.status ? (
          <ColoredBadge text={record.status.name} color={record.status.color} />
        ) : null,
    },
    {
      title: "ไมล์สโตน",
      key: "milestone",
      dataIndex: "milestone",
      align: "left",
      width: 180,
      render: (arr?: Array<{ name: string; color?: string }>) =>
        arr?.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              overflow: "hidden",
              gap: 4,
            }}
          >
            {arr.map((m) => (
              <ColoredBadge
                key={m.name}
                text={m.name}
                color={m.color}
                tooltip={false}
              />
            ))}
          </div>
        ) : null,
    },
    {
      title: "หมวดหมู่",
      key: "category",
      dataIndex: "category",
      align: "left",
      width: 160,
      render: (arr?: Array<{ name: string; color?: string }>) =>
        arr?.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              overflow: "hidden",
              gap: 4,
            }}
          >
            {arr.map((c) => (
              <ColoredBadge
                key={c.name}
                text={c.name}
                color={c.color}
                tooltip={false}
              />
            ))}
          </div>
        ) : null,
    },
    {
      title: "ผู้รับผิดชอบ",
      key: "assignee",
      width: 220,
      render: (_, record) => renderAssignee(record),
    },
    {
      title: "กำหนดการ",
      key: "timeline",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ marginRight: 6 }} />
            เริ่ม: {formatDate(record.startDate)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ marginRight: 6 }} />
            กำหนดส่ง: {formatDate(record.dueDate)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "ไฟล์แนบ",
      key: "attachments",
      width: 110,
      render: (_, record) => {
        const attachments = record.attachments || [];
        const count = attachments.length;
        return (
          <Space size={6}>
            <PaperClipOutlined />
            <Typography.Text>{count || 0}</Typography.Text>
          </Space>
        );
      },
    },
  ];

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => dispatch(setSelectedRowKeys(keys)),
      preserveSelectedRowKeys: true,
    }),
    [selectedRowKeys, dispatch],
  );

  return (
    <>
      <Table<Issue>
        columns={columns}
        dataSource={issues}
        rowKey={(r) => r.issueKey || String(r.id)}
        rowSelection={rowSelection}
        scroll={{ x: 1200 }}
        expandable={{
          expandedRowRender: (record) => (
            <div
              style={{ padding: 24, background: "#fafafa", borderRadius: 8 }}
            >
              <Typography.Text
                strong
                style={{ display: "block", marginBottom: 16, fontSize: 16 }}
              >
                <FileTextOutlined style={{ marginRight: 8 }} />
                รายละเอียดของงาน (Description)
              </Typography.Text>
              <div
                style={{
                  backgroundColor: "white",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #f0f0f0",
                }}
              >
                {renderDescriptionContent(record.description)}
              </div>
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
            dispatch(setPagination({ page: p, pageSize: ps }));
            onReload();
          },
        }}
        loading={loading}
      />
      <AiUpdateModal
        aiState={aiModal}
        onApprove={doApproveUpdate}
        onClose={handleAiClose}
        onRegenerate={handleAiRegenerate}
        onUpdateText={(value) =>
          setAiModal((prev) => ({ ...prev, newText: value }))
        }
      />

      {/* AI Processing Modal */}
      <AIProcessingModal
        open={aiProcessing.open}
        currentStep={aiProcessing.currentStep}
        steps={aiSteps.map((step, idx) => {
          if (idx === 1) {
            return {
              ...step,
              title:
                aiEngine === "chatgpt"
                  ? "ส่งคำขอไปยัง ChatGPT"
                  : "ส่งคำขอไปยัง Gemini AI",
              description:
                aiEngine === "chatgpt"
                  ? "กำลังส่งข้อมูลไปยัง OpenAI เพื่อประมวลผล"
                  : "กำลังส่งข้อมูลไปยัง Google Gemini เพื่อประมวลผล",
            };
          }
          return step;
        })}
        processingTime={aiProcessing.processingTime}
        onCancel={() =>
          setAiProcessing({ open: false, currentStep: 0, processingTime: 0 })
        }
      />

      {/* Model Selection Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined className="text-blue-500" />
            <span>เลือก AI Engine ที่ต้องการใช้งาน</span>
          </Space>
        }
        open={engineSelectModal.open}
        onCancel={() => setEngineSelectModal({ open: false, issue: null })}
        footer={null}
        width={400}
        centered
      >
        <div className="flex flex-col gap-3 py-2">
          <Button
            size="large"
            type="primary"
            className="h-16 flex items-center justify-start gap-4"
            icon={
              <div className="bg-white/20 p-2 rounded-lg">
                <RobotOutlined style={{ fontSize: 24 }} />
              </div>
            }
            onClick={() => {
              if (engineSelectModal.issue) {
                onClickAI(engineSelectModal.issue, "gemini");
                setEngineSelectModal({ open: false, issue: null });
              }
            }}
          >
            <div className="flex flex-col items-start">
              <span className="font-bold">Google Gemini</span>
              <span className="text-xs opacity-80">
                ประมวลผลรวดเร็ว แม่นยำ (ฟรี)
              </span>
            </div>
          </Button>

          <Button
            size="large"
            style={{ backgroundColor: "#10a37f", borderColor: "#10a37f" }}
            type="primary"
            className="h-16 flex items-center justify-start gap-4"
            icon={
              <div className="bg-white/20 p-2 rounded-lg">
                <RobotOutlined style={{ fontSize: 24 }} />
              </div>
            }
            onClick={() => {
              if (engineSelectModal.issue) {
                onClickAI(engineSelectModal.issue, "chatgpt");
                setEngineSelectModal({ open: false, issue: null });
              }
            }}
          >
            <div className="flex flex-col items-start">
              <span className="font-bold">ChatGPT (OpenAI)</span>
              <span className="text-xs opacity-80">
                ฉลาดล้ำเลิศ สรุปได้ลึกซึ้ง (GPT-4o)
              </span>
            </div>
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default IssuesTable;
