"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/layouts/backend-layout";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Statistic,
  Table,
  FloatButton,
  Skeleton,
  theme,
  Tag,
  Form,
  Input,
  InputNumber,
  Alert,
  Badge,
  Empty,
  Tooltip as AntTooltip,
  Modal,
  Descriptions,
  Divider,
  Progress,
  Tabs,
  Select,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  RocketOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  CloudServerOutlined,
  LineChartOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  CodeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileSearchOutlined,
  CloudOutlined,
  ApiOutlined,
  LineOutlined,
  ControlOutlined,
  SafetyOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { toast } from "sonner";
import { AdvancedConfigComponent } from "./components/advanced-config.component";
import { TestProfileSelectorComponent } from "./components/test-profile-selector.component";
import { LoadTestConfig, LoadTestProfile } from "./types/load-test.types";
import { TEST_PROFILES } from "./utils/test-profiles";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

//** SummaryChart: แผนภูมิแท่งสรุปผล (Minimal + ใช้โทนสีจาก Ant Design Token)
const SummaryChart = ({
  stats,
  isLoading,
}: {
  stats: Record<string, any>;
  isLoading?: boolean;
}) => {
  const chartRef = useRef<any>(null);
  const { token } = theme.useToken();
  const { total, success, failed } = getCheckCounts(stats);

  // Chart.js v3+ supports context-based backgroundColor for gradients
  const { t } = useTranslation("translate");
  const data = {
    labels: [t("load_test_page.graph_summary.chart_label")],
    datasets: [
      {
        label: t("load_test_page.result_summary.success_label"),
        data: [success],
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top
          );
          gradient.addColorStop(0, token.colorSuccess);
          gradient.addColorStop(1, `${token.colorSuccess}66`);
          return gradient;
        },
        borderRadius: 12,
      },
      {
        label: t("load_test_page.result_summary.failed_label"),
        data: [failed],
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top
          );
          gradient.addColorStop(0, token.colorError);
          gradient.addColorStop(1, `${token.colorError}66`);
          return gradient;
        },
        borderRadius: 12,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: token.colorText,
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: token.colorBgElevated,
        titleColor: token.colorText,
        bodyColor: token.colorText,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: token.colorTextSecondary,
        },
      },
      y: {
        grid: { display: false },
        beginAtZero: true,
        ticks: {
          color: token.colorTextSecondary,
        },
      },
    },
  };

  // To ensure gradient is recalculated on resize, force update
  // (Chart.js 3+ handles context-based gradient correctly)
  return isLoading ? (
    <Skeleton active paragraph={{ rows: 6 }} />
  ) : (
    <Bar ref={chartRef} data={data} options={options} />
  );
};

//** ประเภท Metric: โครงสร้างข้อมูล key/value จาก log
type Metric = {
  key: string;
  value: string;
};

//** parseMetrics: แปลงข้อความผลลัพธ์เป็นรายการ Metric
const parseMetrics = (text: string): Metric[] => {
  const lines = text.split("\n");
  const keyValueRegex = /^\s*([^\s.]+.*?):\s+(.*)$/;

  return lines
    .map((line) => {
      const match = line.match(keyValueRegex);
      return match ? { key: match[1], value: match[2] } : null;
    })
    .filter((item): item is Metric => Boolean(item));
};

//** parseTestStats: สกัดค่าสรุปเป็น Dictionary (สำหรับใช้งานต่อ)
const parseTestStats = (text: string): Record<string, any> => {
  const result: Record<string, any> = {};
  const lines = text.split("\n");
  lines.forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) result[key] = value;
    }
  });
  return result;
};

//** extractJsonAndFormat: ค้นหา JSON ภายในบรรทัดและจัดรูปแบบให้อ่านง่าย
const extractJsonAndFormat = (line: string): string | null => {
  const jsonStartIndex = line.indexOf("{");
  const jsonEndIndex = line.lastIndexOf("}") + 1;

  if (jsonStartIndex === -1 || jsonEndIndex === -1) return null;

  const jsonSubstring = line.substring(jsonStartIndex, jsonEndIndex);

  try {
    const jsonObj = JSON.parse(jsonSubstring);
    return JSON.stringify(jsonObj, null, 2);
  } catch {
    return null;
  }
};

//** renderFormattedMetricValue: แสดงค่า Metric (รองรับย่อ/ขยาย)
const renderFormattedMetricValue = (
  value: string,
  idx: number,
  expandedLines: Record<number, boolean>,
  setExpandedLines: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >,
  t: any
) => {
  let formattedValue = value;
  let jsonParsed: any = null;

  // Remove trailing ' source=...' if it exists
  const cleanedValue = value.replace(/(}\s*)source=.*/, "}").trim();

  try {
    jsonParsed = JSON.parse(cleanedValue);
    formattedValue = JSON.stringify(jsonParsed, null, 2);
  } catch {
    formattedValue = value;
  }

  const shouldTruncate = formattedValue.length > 100;
  const isExpanded = expandedLines[idx] || false;
  const displayValue =
    shouldTruncate && !isExpanded
      ? formattedValue.slice(0, 100) + "..."
      : formattedValue;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Typography.Paragraph
        code
        style={{
          whiteSpace: "pre-wrap",
          marginBottom: 6,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {displayValue}
      </Typography.Paragraph>
      {shouldTruncate && (
        <Button
          type="link"
          size="small"
          onClick={() =>
            setExpandedLines((prev) => ({
              ...prev,
              [idx]: !isExpanded,
            }))
          }
          style={{ padding: 0, width: "fit-content" }}
        >
          {isExpanded
            ? t("load_test_page.log_report.see_less")
            : t("load_test_page.log_report.see_more")}
        </Button>
      )}
    </div>
  );
};

//** ScrollToButtons: ปุ่ม BackTop และเลื่อนไปล่างสุด
const ScrollToButtons = () => {
  const { t } = useTranslation("translate");
  return (
    <>
      <FloatButton.BackTop icon={<ArrowUpOutlined />} />
      <FloatButton
        icon={<ArrowDownOutlined />}
        style={{ right: 24, bottom: 88 }}
        onClick={() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          })
        }
        tooltip={t("load_test_page.result_summary.scroll_to_bottom")}
      />
    </>
  );
};

type LogViewerProps = {
  output: string;
  expandedLines: Record<number, boolean>;
  setExpandedLines: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  maxLength?: number;
};

//** LogViewer: แสดง Log แบบเรียลไทม์พร้อมปุ่ม See more/less
const LogViewer = ({
  output,
  expandedLines,
  setExpandedLines,
  maxLength = 100,
}: LogViewerProps) => {
  const { t } = useTranslation("translate");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { token } = theme.useToken();

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          background: "#0f172a",
          borderRadius: 20,
          padding: 24,
          boxShadow:
            "inset 0 4px 12px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.2)",
          maxHeight: 500,
          overflow: "auto",
          border: "1px solid #1e293b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: -24,
            left: -24,
            right: -24,
            background: "#1e293b",
            padding: "8px 16px",
            marginBottom: 16,
            borderBottom: "1px solid #334155",
            display: "flex",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ef4444",
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#eab308",
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span
            style={{
              color: "#94a3b8",
              fontSize: 10,
              marginLeft: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            Stream Log
          </span>
        </div>

        {!output && (
          <Empty
            description={
              <span style={{ color: "#64748b" }}>
                {t("load_test_page.log_report.empty_logs")}
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: "40px 0" }}
          />
        )}

        {output.split("\n").map((line, idx) => {
          if (!line.trim()) return null;

          const isError = line.toLowerCase().includes("error");
          const isSuccess = line.toLowerCase().includes("success");
          const isWarn = line.toLowerCase().includes("warn");

          const color = isError
            ? "#fca5a5"
            : isSuccess
            ? "#86efac"
            : isWarn
            ? "#fde047"
            : "#e2e8f0";

          const formattedJson = extractJsonAndFormat(line);
          const isExpanded = expandedLines[idx] || false;

          const displayedLine =
            formattedJson && !isExpanded && formattedJson.length > maxLength
              ? formattedJson.slice(0, maxLength) + "..."
              : formattedJson || line;

          return (
            <div
              key={idx}
              style={{
                marginBottom: 4,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  color: "#475569",
                  fontSize: 11,
                  minWidth: 20,
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <pre
                  style={{
                    color,
                    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    margin: 0,
                    lineHeight: 1.5,
                    textShadow: isError
                      ? "0 0 8px rgba(239, 68, 68, 0.4)"
                      : "none",
                  }}
                >
                  {displayedLine}
                </pre>
                {formattedJson && formattedJson.length > maxLength && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() =>
                      setExpandedLines((prev) => ({
                        ...prev,
                        [idx]: !isExpanded,
                      }))
                    }
                    style={{
                      padding: 0,
                      height: "auto",
                      fontSize: 11,
                      color: "#38bdf8",
                    }}
                  >
                    {isExpanded
                      ? t("load_test_page.log_report.see_less")
                      : t("load_test_page.log_report.see_more")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

type MetricsTableProps = {
  metrics: Metric[];
  expandedLines: Record<number, boolean>;
  setExpandedLines: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
};

// ** MetricsTable: สรุป Metrics ด้วยตาราง AntD
const MetricsTable = ({
  metrics,
  expandedLines,
  setExpandedLines,
}: MetricsTableProps) => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  return (
    <Card
      className="glass-card"
      title={
        <Space>
          <DashboardOutlined style={{ color: token.colorPrimary }} />
          <span style={{ fontWeight: 700 }}>
            {t("load_test_page.metrics_report.title")}
          </span>
        </Space>
      }
      style={{ marginBottom: 16, borderRadius: 24, overflow: "hidden" }}
    >
      <Table
        size="small"
        dataSource={metrics.map((m, idx) => ({ ...m, key: idx }))}
        pagination={{ pageSize: 12, size: "small" }}
        columns={[
          {
            title: t("load_test_page.metrics_report.metric_col"),
            dataIndex: "key",
            key: "key",
            width: "50%",
            render: (text) => (
              <Typography.Text
                strong
                style={{ fontSize: 13, color: token.colorTextSecondary }}
              >
                {text}
              </Typography.Text>
            ),
          },
          {
            title: t("load_test_page.metrics_report.value_col"),
            dataIndex: "value",
            key: "value",
            render: (text: string, record: Metric, idx: number) =>
              renderFormattedMetricValue(
                text,
                idx,
                expandedLines,
                setExpandedLines,
                t
              ),
          },
        ]}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      />
    </Card>
  );
};

// 🔍 แสดง URL ที่กำลังทดสอบอยู่
// ** SelectedTargetSummary: สรุป URL ที่ใช้งานจริง
const SelectedTargetSummary = ({
  script,
  env,
}: {
  script: string;
  env: string;
}) => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 24px",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)",
          borderRadius: 100,
          border: `1px solid ${token.colorPrimary}40`,
          marginBottom: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 10px #22c55e",
            }}
          />
          <CodeOutlined style={{ color: token.colorPrimary }} />
          <span style={{ color: token.colorTextSecondary, fontSize: 13 }}>
            {t("load_test_page.modal.script")}:
          </span>
          <strong style={{ color: token.colorPrimary }}>{script}</strong>
        </div>
        <Divider
          type="vertical"
          style={{
            height: 20,
            borderColor: `${token.colorPrimary}30`,
            margin: 0,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GlobalOutlined style={{ color: token.colorPrimary }} />
          <span style={{ color: token.colorTextSecondary, fontSize: 13 }}>
            Target:
          </span>
          <Typography.Link
            href={env}
            target="_blank"
            style={{ fontWeight: 800, fontSize: 14 }}
          >
            {env}
          </Typography.Link>
        </div>
      </div>
    </motion.div>
  );
};

//** getCheckCounts: คำนวณจำนวน Total/Success/Failed จากสถิติ
const getCheckCounts = (stats: Record<string, any>) => {
  const entries = Object.entries(stats);

  // Look for a line that contains "out of" to get both success & total
  const outOfEntry = entries.find(([, v]) =>
    typeof v === "string" ? v.includes("out of") : false
  );

  if (outOfEntry) {
    const match = (outOfEntry[1] as string).match(
      /([\d.,]+)\s+out of\s+([\d.,]+)/i
    );
    if (match) {
      const success = parseInt(match[1].replace(/,/g, ""), 10);
      const total = parseInt(match[2].replace(/,/g, ""), 10);
      const failed = Math.max(0, total - success);
      return { total, success, failed };
    }
  }

  // Fallback: derive from checks_total and checks_succeeded percentage
  const totalLine =
    stats[
      Object.keys(stats).find((k) => k.trim().startsWith("checks_total")) || ""
    ];
  const successLine =
    stats[
      Object.keys(stats).find((k) => k.trim().startsWith("checks_succeeded")) ||
        ""
    ];

  const total = totalLine
    ? parseInt(String(totalLine).split(/\s+/)[0].replace(/,/g, ""), 10) || 0
    : 0;

  let success = 0;
  const percentMatch = successLine
    ? String(successLine).match(/([\d.]+)%/)
    : null;
  if (percentMatch && total) {
    success = Math.round((parseFloat(percentMatch[1]) / 100) * total);
  }

  const failed = Math.max(0, total - success);
  return { total, success, failed };
};

type DurationStat = {
  avg?: string;
  min?: string;
  med?: string;
  max?: string;
  p90?: string;
  p95?: string;
};

const toNumber = (value?: string) => {
  if (!value) return NaN;
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
};

const parseCountAndRate = (value?: string) => {
  if (!value) return null;
  const parts = value.trim().split(/\s+/);
  const count = toNumber(parts[0]);
  const rate = toNumber(parts[1]);
  return { count, rate };
};

const parseDurationStat = (value?: string): DurationStat => {
  if (!value) return {};
  const get = (label: string) =>
    value.match(new RegExp(`${label}=([\\d.]+[a-zA-Z]+)`))?.[1];
  return {
    avg: get("avg"),
    min: get("min"),
    med: get("med"),
    max: get("max"),
    p90: get("p\\(90\\)"),
    p95: get("p\\(95\\)"),
  };
};

const parsePercentStat = (value?: string) => {
  if (!value) return NaN;
  const matched = value.match(/([\d.]+)%/);
  return matched ? parseFloat(matched[1]) : NaN;
};

type TimelinePoint = {
  time: number;
  iterations: number;
};

const parseTimeline = (text: string) => {
  const lines = text.split("\n");
  const timeline: TimelinePoint[] = [];
  const regex = /running\s+\(([\d.]+)s\).*?(\d+)\s+complete/i;

  lines.forEach((line) => {
    const match = line.match(regex);
    if (match) {
      const time = parseFloat(match[1]);
      const iterations = parseInt(match[2], 10);
      if (!Number.isNaN(time) && !Number.isNaN(iterations)) {
        timeline.push({ time, iterations });
      }
    }
  });

  timeline.sort((a, b) => a.time - b.time);

  const labels = timeline.map((p) => `${p.time.toFixed(1)}s`);
  const cumulative = timeline.map((p) => p.iterations);
  const rps = timeline.map((p, idx) => {
    if (idx === 0) return 0;
    const prev = timeline[idx - 1];
    const deltaIter = p.iterations - prev.iterations;
    const deltaTime = p.time - prev.time || 1;
    return Number((deltaIter / deltaTime).toFixed(2));
  });

  return { labels, cumulative, rps, raw: timeline };
};

export default function Page() {
  const { t } = useTranslation("translate");
  //** State หลักของหน้า (Log, ขยายบรรทัด, แสดง Metrics, เลือก Script/Env, โหลด)
  const [output, setOutput] = useState("");
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>(
    {}
  );
  const [showMetrics, setShowMetrics] = useState(false);
  const [scriptName, setScriptName] = useState<string>("example-load-test");
  const [parsedStats, setParsedStats] = useState<Record<string, any>>({});
  const [targetUrl, setTargetUrl] = useState<string>(
    "https://apimobiledev.schoolbright.co/api/school/load-test"
  );
  const [vus, setVus] = useState<number>(50);
  const [durationSeconds, setDurationSeconds] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [showFullReportLog, setShowFullReportLog] = useState(false);
  const { token } = theme.useToken();

  // Advanced configuration state
  const [advancedConfig, setAdvancedConfig] = useState<Partial<LoadTestConfig>>(
    {}
  );
  const [selectedProfile, setSelectedProfile] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<string>("basic");

  //** runTest: เรียก API /api/v1/load-test และอ่านผลแบบสตรีมทีละ chunk
  const runTest = async () => {
    try {
      setIsLoading(true);
      setShowMetrics(false);
      setOutput("");
      setRunStatus("running");

      const payload: any = {
        script: scriptName,
        baseURL: targetUrl,
        request: vus,
        second: durationSeconds,
        ...advancedConfig,
      };

      console.log("🚀 Sending load test request:", payload);

      const response = await fetch("/api/v1/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setOutput((prev) => prev + chunk);
      }

      setOutput(
        (prev) =>
          prev + `\n${t("load_test_page.result_summary.test_completed_log")}`
      );
      setShowMetrics(true);
      setParsedStats(parseTestStats(accumulated));
      setRunStatus("done");
      setLastRunAt(new Date().toLocaleString());
      toast.success(t("load_test_page.messages.test_completed"));
    } catch (error: any) {
      setOutput(
        t("load_test_page.result_summary.test_failed_log", {
          error: error.message,
        })
      );
      setRunStatus("error");
      toast.error(t("load_test_page.messages.test_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  //** handleProfileSelect: Apply selected test profile
  const handleProfileSelect = (profile: LoadTestProfile) => {
    setSelectedProfile(profile.name);
    setVus(profile.vus);
    setDurationSeconds(profile.duration);

    if (profile.stages) {
      setAdvancedConfig((prev) => ({
        ...prev,
        stages: profile.stages,
      }));
    } else {
      setAdvancedConfig((prev) => {
        const { stages, ...rest } = prev;
        return rest;
      });
    }

    if (profile.rps) {
      setAdvancedConfig((prev) => ({
        ...prev,
        rps: profile.rps,
      }));
    }

    if (profile.iterations) {
      setAdvancedConfig((prev) => ({
        ...prev,
        iterations: profile.iterations,
      }));
    }

    toast.success(
      t("load_test_page.messages.profile_applied", { name: profile.name })
    );
  };

  //** handleAdvancedConfigChange: Update advanced configuration
  const handleAdvancedConfigChange = (config: any) => {
    setAdvancedConfig(config);
  };

  //** downloadLog: ดาวน์โหลดไฟล์ Log ปัจจุบัน
  const downloadLog = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `k6-log-${scriptName}.txt`;
    link.click();
  };

  // Derived metrics for display/report
  const metrics = parseMetrics(output);
  const checks = getCheckCounts(parsedStats);
  const httpReqs =
    parsedStats[
      Object.keys(parsedStats).find((k) => k.trim().startsWith("http_reqs")) ||
        ""
    ];
  const httpReqDuration =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("http_req_duration")
      ) || ""
    ];
  const httpReqDurationAvg =
    httpReqDuration?.match(/avg=([\d.]+ms)/)?.[1] ||
    t("load_test_page.result_summary.not_available");
  const httpReqDurationP95 =
    httpReqDuration?.match(/p\\(95\\)=([\\d.]+ms)/)?.[1] ||
    t("load_test_page.result_summary.not_available");
  const httpReqFailed =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("http_req_failed")
      ) || ""
    ] || t("load_test_page.result_summary.not_available");
  const httpReqFailedPct = parsePercentStat(httpReqFailed);

  const httpReqCounts = parseCountAndRate(httpReqs);
  const httpReqDurationStats = parseDurationStat(httpReqDuration);
  const iterationsLine =
    parsedStats[
      Object.keys(parsedStats).find((k) => k.trim().startsWith("iterations")) ||
        ""
    ];
  const iterations =
    iterationsLine?.split(" ").filter(Boolean)?.[0] ||
    t("load_test_page.result_summary.not_available");
  const iterationDuration =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("iteration_duration")
      ) || ""
    ] || t("load_test_page.result_summary.not_available");
  const iterationDurationStats = parseDurationStat(iterationDuration);
  const dataReceived =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("data_received")
      ) || ""
    ] || t("load_test_page.result_summary.not_available");
  const dataSent =
    parsedStats[
      Object.keys(parsedStats).find((k) => k.trim().startsWith("data_sent")) ||
        ""
    ] || t("load_test_page.result_summary.not_available");
  const successRate =
    checks.total > 0
      ? ((checks.success / checks.total) * 100).toFixed(2)
      : null;
  const failureRate =
    checks.total > 0 ? ((checks.failed / checks.total) * 100).toFixed(2) : null;
  const requestRate =
    httpReqCounts?.rate && Number.isFinite(httpReqCounts.rate)
      ? httpReqCounts.rate.toFixed(2)
      : t("load_test_page.result_summary.not_available");
  const requestTotal =
    httpReqCounts?.count && Number.isFinite(httpReqCounts.count)
      ? httpReqCounts.count
      : httpReqs || t("load_test_page.result_summary.not_available");
  const logTail = output
    ? output.split("\n").slice(-50).join("\n")
    : t("load_test_page.log_report.empty_logs");
  const timeline = parseTimeline(output);
  const hasTimeline = timeline.labels.length > 0;
  const reportLogPreviewLimit = 1200;
  const reportLogDisplay =
    showFullReportLog || !logTail
      ? logTail
      : logTail.length > reportLogPreviewLimit
      ? `${logTail.slice(0, reportLogPreviewLimit)}\n...\n(${t(
          "load_test_page.result_summary.see_more_log_hint"
        )})`
      : logTail;

  const buildReportText = () => {
    const generatedAt = lastRunAt || new Date().toLocaleString();
    const metricsBlock = metrics.length
      ? metrics.map((m) => `- ${m.key}: ${m.value}`).join("\n")
      : t("load_test_page.result_summary.not_available");

    return [
      `=== ${t("load_test_page.result_summary.report_title")} ===`,
      `${t("load_test_page.result_summary.generated_at")}: ${generatedAt}`,
      `${t("load_test_page.result_summary.status")}: ${runStatus}`,
      `${t("load_test_page.result_summary.target_url")}: ${targetUrl}`,
      `${t("load_test_page.result_summary.script")}: ${scriptName}`,
      `${t(
        "load_test_page.result_summary.parameters"
      )}: VUs=${vus}, Duration=${durationSeconds}s`,
      "",
      t("load_test_page.result_summary.summary"),
      `- Checks => total=${checks.total}, success=${checks.success}, failed=${checks.failed}`,
      `- HTTP Requests => ${
        httpReqs || t("load_test_page.result_summary.not_available")
      }`,
      `- HTTP Duration => ${
        httpReqDuration || t("load_test_page.result_summary.not_available")
      }`,
      `- Success Rate => ${
        successRate
          ? `${successRate}%`
          : t("load_test_page.result_summary.not_available")
      }`,
      `- Failure Rate => ${
        Number.isFinite(httpReqFailedPct)
          ? `${httpReqFailedPct}%`
          : failureRate
          ? `${failureRate}%`
          : t("load_test_page.result_summary.not_available")
      }`,
      `- Requests/sec => ${requestRate}`,
      "",
      t("load_test_page.result_summary.metrics"),
      metricsBlock,
      "",
      t("load_test_page.result_summary.log_latest_50"),
      logTail,
    ].join("\n");
  };

  const openReportPreview = () => {
    const report = buildReportText();
    setReportText(report);
    setIsReportOpen(true);
  };

  const buildReportHtml = () => {
    const generatedAt = lastRunAt || new Date().toLocaleString();
    const metricRows = metrics
      .map(
        (m) =>
          `<tr><td style="padding:6px 8px;border:1px solid #e5e5e5;">${m.key}</td><td style="padding:6px 8px;border:1px solid #e5e5e5;">${m.value}</td></tr>`
      )
      .join("");

    return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${t("load_test_page.result_summary.report_html_title")}</title>
        <style>
          body { font-family: "Segoe UI", Arial, sans-serif; color: #1f1f1f; margin: 24px; }
          h1, h2, h3 { margin: 0 0 8px 0; }
          .section { margin-bottom: 16px; }
          .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; }
          table { border-collapse: collapse; width: 100%; }
          th { text-align: left; background: #fafafa; border:1px solid #e5e5e5; padding: 8px; }
          td { border:1px solid #e5e5e5; padding: 8px; }
          pre { white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>${t("load_test_page.result_summary.report_html_title")}</h1>
        <p>${t(
          "load_test_page.result_summary.generated_at"
        )}: ${generatedAt}</p>

        <div class="section card">
          <h2>${t("load_test_page.result_summary.overview")}</h2>
          <p><strong>${t(
            "load_test_page.result_summary.status"
          )}:</strong> ${runStatus}</p>
          <p><strong>${t(
            "load_test_page.result_summary.target_url"
          )}:</strong> ${targetUrl}</p>
          <p><strong>${t(
            "load_test_page.result_summary.script"
          )}:</strong> ${scriptName}</p>
          <p><strong>${t(
            "load_test_page.result_summary.parameters"
          )}:</strong> VUs=${vus}, Duration=${durationSeconds}s</p>
        </div>

        <div class="section card">
          <h3>${t("load_test_page.result_summary.summary")}</h3>
          <ul>
            <li>${t("load_test_page.result_summary.checks")}: total=${
      checks.total
    }, success=${checks.success}, failed=${checks.failed}</li>
            <li>${t("load_test_page.result_summary.http_requests")}: ${
      httpReqs || t("load_test_page.result_summary.not_available")
    }</li>
            <li>${t("load_test_page.result_summary.avg_duration")}: ${
      httpReqDuration || t("load_test_page.result_summary.not_available")
    }</li>
            <li>${t("load_test_page.result_summary.success_rate_desc")}: ${
      successRate
        ? `${successRate}%`
        : t("load_test_page.result_summary.not_available")
    }</li>
            <li>${t("load_test_page.result_summary.failure_rate_desc")}: ${
      failureRate
        ? `${failureRate}%`
        : t("load_test_page.result_summary.not_available")
    }</li>
            <li>${t(
              "load_test_page.result_summary.throughput"
            )}: ${requestRate}</li>
            <li>p95 ${t("load_test_page.result_summary.iteration_duration")}: ${
      httpReqDurationStats.p95 || httpReqDurationP95
    }</li>
            <li>${t("load_test_page.result_summary.avg_duration")}: ${
      httpReqDurationStats.avg || httpReqDurationAvg
    }</li>
            <li>${t(
              "load_test_page.result_summary.iterations"
            )}: ${iterations}</li>
            <li>${t(
              "load_test_page.result_summary.iteration_duration"
            )}: ${iterationDuration}</li>
            <li>${t(
              "load_test_page.result_summary.data_transfer"
            )}: received=${dataReceived}, sent=${dataSent}</li>
          </ul>
        </div>

        <div class="section card">
          <h3>${t("load_test_page.result_summary.metrics")}</h3>
          ${
            metrics.length
              ? `<table><thead><tr><th>${t(
                  "load_test_page.metrics_report.metric_col"
                )}</th><th>${t(
                  "load_test_page.metrics_report.value_col"
                )}</th></tr></thead><tbody>${metricRows}</tbody></table>`
              : `<p>${t("load_test_page.result_summary.no_metrics")}</p>`
          }
        </div>

        <div class="section card">
          <h3>${t("load_test_page.result_summary.log_latest_50")}</h3>
          <pre>${logTail}</pre>
        </div>
      </body>
    </html>
    `;
  };

  const buildReportHtmlEnterprise = () => {
    const generatedAt = lastRunAt || new Date().toLocaleString();
    const metricRows = metrics
      .map(
        (m) =>
          `<tr><td style="padding:6px 8px;border:1px solid #e5e5e5;">${m.key}</td><td style="padding:6px 8px;border:1px solid #e5e5e5;">${m.value}</td></tr>`
      )
      .join("");

    const summaryRows = [
      {
        label: t("load_test_page.result_summary.target_url"),
        value: targetUrl,
      },
      { label: t("load_test_page.result_summary.script"), value: scriptName },
      { label: t("load_test_page.result_summary.status"), value: runStatus },
      {
        label: t("load_test_page.result_summary.generated_at"),
        value: generatedAt,
      },
      {
        label: t("load_test_page.result_summary.parameters"),
        value: `VUs=${vus}, Duration=${durationSeconds}s`,
      },
      {
        label: t("load_test_page.result_summary.checks"),
        value: `${t("load_test_page.result_summary.total_label")}=${
          checks.total
        }, ${t("load_test_page.result_summary.success_label")}=${
          checks.success
        }, ${t("load_test_page.result_summary.failed_label")}=${checks.failed}`,
      },
      {
        label: t("load_test_page.result_summary.success_rate_desc"),
        value: successRate
          ? `${successRate}%`
          : t("load_test_page.result_summary.not_available"),
      },
      {
        label: t("load_test_page.result_summary.failure_rate_desc"),
        value: failureRate
          ? `${failureRate}%`
          : t("load_test_page.result_summary.not_available"),
      },
      {
        label: t("load_test_page.result_summary.http_requests"),
        value: httpReqs || t("load_test_page.result_summary.not_available"),
      },
      {
        label: t("load_test_page.result_summary.request_rate_desc"),
        value: requestRate,
      },
      {
        label: t("load_test_page.result_summary.response_time_desc"),
        value: `${httpReqDurationStats.avg || httpReqDurationAvg} / ${
          httpReqDurationStats.p95 || httpReqDurationP95
        } / ${
          httpReqDurationStats.max ||
          t("load_test_page.result_summary.not_available")
        }`,
      },
      {
        label: t("load_test_page.result_summary.iteration_duration"),
        value: iterationDuration,
      },
      {
        label: t("load_test_page.result_summary.iterations"),
        value: iterations,
      },
      {
        label: t("load_test_page.result_summary.data_transfer"),
        value: `${t(
          "load_test_page.result_summary.received_label"
        )}: ${dataReceived} | ${t(
          "load_test_page.result_summary.sent_label"
        )}: ${dataSent}`,
      },
    ]
      .map(
        (row) =>
          `<tr><td style="padding:10px;border:1px solid #e5e5e5;font-weight:600;background:#f7f9fb;">${row.label}</td><td style="padding:10px;border:1px solid #e5e5e5;">${row.value}</td></tr>`
      )
      .join("");

    const evidenceLog = logTail
      ? logTail
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .join("\n")
      : "No log available";

    return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${t("load_test_page.result_summary.report_html_title")}</title>
        <style>
          body { font-family: "Segoe UI", Arial, sans-serif; color: #1f1f1f; margin: 32px; }
          h1, h2, h3 { margin: 0 0 10px 0; }
          .section { margin-bottom: 18px; }
          .card { border: 1px solid #d9d9d9; border-radius: 10px; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          table { border-collapse: collapse; width: 100%; }
          th { text-align: left; background: #f0f5ff; border:1px solid #e5e5e5; padding: 10px; }
          td { border:1px solid #e5e5e5; padding: 10px; }
          pre { white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 8px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 12px; }
          .badge { display:inline-block; padding:2px 8px; background:#f0f5ff; border:1px solid #d6e4ff; border-radius:6px; font-size:12px; color:#1d39c4; }
        </style>
      </head>
      <body>
        <h1>${t("load_test_page.result_summary.report_html_title")}</h1>
        <p class="badge">${t(
          "load_test_page.result_summary.generated_at"
        )}: ${generatedAt}</p>

        <div class="section card">
          <h2>${t("load_test_page.result_summary.overview")}</h2>
          <table>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>
        </div>

        <div class="section card">
          <h3>${t("load_test_page.result_summary.summary_grid")}</h3>
          <div class="grid">
            <div class="card" style="padding:12px;">
              <strong>${t("load_test_page.result_summary.checks")}</strong><br/>
              ${t("load_test_page.result_summary.total_label")}: ${
      checks.total
    } | ${t("load_test_page.result_summary.success_label")}: ${
      checks.success
    } | ${t("load_test_page.result_summary.failed_label")}: ${checks.failed}
            </div>
            <div class="card" style="padding:12px;">
              <strong>${t("load_test_page.result_summary.rates")}</strong><br/>
              ${t("load_test_page.result_summary.success_label")}: ${
      successRate
        ? `${successRate}%`
        : t("load_test_page.result_summary.not_available")
    } | ${t("load_test_page.result_summary.failed_label")}: ${
      Number.isFinite(httpReqFailedPct)
        ? `${httpReqFailedPct}%`
        : failureRate
        ? `${failureRate}%`
        : t("load_test_page.result_summary.not_available")
    }
            </div>
            <div class="card" style="padding:12px;">
              <strong>${t(
                "load_test_page.result_summary.requests"
              )}</strong><br/>
              ${t("load_test_page.result_summary.total_label")}: ${
      httpReqs || t("load_test_page.result_summary.not_available")
    } | ${t("load_test_page.result_summary.rate_label")}: ${requestRate} rps
            </div>
            <div class="card" style="padding:12px;">
              <strong>${t(
                "load_test_page.result_summary.response_time"
              )}</strong><br/>
              avg=${httpReqDurationStats.avg || httpReqDurationAvg}, p95=${
      httpReqDurationStats.p95 || httpReqDurationP95
    }, max=${
      httpReqDurationStats.max ||
      t("load_test_page.result_summary.not_available")
    }
            </div>
            <div class="card" style="padding:12px;">
              <strong>${t(
                "load_test_page.result_summary.iterations"
              )}</strong><br/>
              ${t(
                "load_test_page.result_summary.count_label"
              )}: ${iterations} | ${t(
      "load_test_page.result_summary.duration"
    )}: ${iterationDuration}
            </div>
            <div class="card" style="padding:12px;">
              <strong>${t(
                "load_test_page.result_summary.data_transfer"
              )}</strong><br/>
              ${t(
                "load_test_page.result_summary.received_label"
              )}: ${dataReceived} | ${t(
      "load_test_page.result_summary.sent_label"
    )}: ${dataSent}
            </div>
          </div>
        </div>

        <div class="section card">
          <h3>${t("load_test_page.result_summary.metrics")}</h3>
          ${
            metrics.length
              ? `<table><thead><tr><th>${t(
                  "load_test_page.metrics_report.metric_col"
                )}</th><th>${t(
                  "load_test_page.metrics_report.value_col"
                )}</th></tr></thead><tbody>${metricRows}</tbody></table>`
              : `<p>${t("load_test_page.result_summary.no_metrics")}</p>`
          }
        </div>

        <div class="section card">
          <h3>${t("load_test_page.result_summary.log_latest_50")}</h3>
          <pre>${evidenceLog}</pre>
        </div>
      </body>
    </html>
    `;
  };
  const downloadReportDoc = () => {
    const html = buildReportHtmlEnterprise();
    const blob = new Blob([html], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `load-test-report-${scriptName}.doc`;
    link.click();
  };

  const downloadReportPdf = () => {
    const html = buildReportHtmlEnterprise();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const curlSnippet = `curl --location 'http://localhost:3000/api/v1/load-test' \\
--header 'Content-Type: application/json' \\
--data '{
  "script": "${scriptName}",
  "baseURL": "${targetUrl}",
  "request": ${vus},
  "second": ${durationSeconds}
}'`;

  return (
    <DashboardLayout>
      <ScrollToButtons />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className="glass-card"
          style={{
            marginBottom: 16,
            borderRadius: 24,
            overflow: "hidden",
            border: "none",
            background: `linear-gradient(135deg, ${token.colorPrimary}0D, ${token.colorBgElevated}CC)`,
          }}
          bodyStyle={{ padding: "24px 32px" }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background: token.colorPrimary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 8px 16px ${token.colorPrimary}4D`,
                    }}
                  >
                    <RocketOutlined style={{ fontSize: 24, color: "#fff" }} />
                  </div>
                  <div>
                    <Typography.Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {t("load_test_page.title")}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                      {t("load_test_page.subtitle")}
                    </Typography.Text>
                  </div>
                </div>
                <Space wrap>
                  <Tag
                    color="processing"
                    bordered={false}
                    style={{ borderRadius: 8, padding: "2px 10px" }}
                  >
                    <ThunderboltOutlined /> {t("load_test_page.tags.k6")}
                  </Tag>
                  <Tag
                    color="cyan"
                    bordered={false}
                    style={{ borderRadius: 8, padding: "2px 10px" }}
                  >
                    <CloudServerOutlined />{" "}
                    {t("load_test_page.tags.streaming_log")}
                  </Tag>
                  <Tag
                    color="magenta"
                    bordered={false}
                    style={{ borderRadius: 8, padding: "2px 10px" }}
                  >
                    <ExperimentOutlined /> {t("load_test_page.tags.ant_design")}
                  </Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={10}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card
                      size="small"
                      className="glass-card"
                      style={{
                        borderRadius: 16,
                        textAlign: "center",
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Statistic
                        title={
                          <span
                            style={{
                              fontSize: 13,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {t("load_test_page.stats.concurrent_users")}
                          </span>
                        }
                        value={vus}
                        suffix={<span style={{ fontSize: 14 }}>VUs</span>}
                        valueStyle={{
                          fontWeight: 700,
                          color: token.colorPrimary,
                        }}
                      />
                    </Card>
                  </motion.div>
                </Col>
                <Col span={12}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card
                      size="small"
                      className="glass-card"
                      style={{
                        borderRadius: 16,
                        textAlign: "center",
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Statistic
                        title={
                          <span
                            style={{
                              fontSize: 13,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {t("load_test_page.stats.duration")}
                          </span>
                        }
                        value={durationSeconds}
                        suffix={<span style={{ fontSize: 14 }}>sec</span>}
                        valueStyle={{ fontWeight: 700, color: token.colorInfo }}
                      />
                    </Card>
                  </motion.div>
                </Col>
                <Col span={24}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: 16,
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Badge
                      status={
                        runStatus === "running"
                          ? "processing"
                          : runStatus === "done"
                          ? "success"
                          : runStatus === "error"
                          ? "error"
                          : "default"
                      }
                      text={
                        <span style={{ fontWeight: 600, marginLeft: 8 }}>
                          {runStatus === "running"
                            ? t("load_test_page.stats.status_running")
                            : runStatus === "done"
                            ? t("load_test_page.stats.status_completed")
                            : runStatus === "error"
                            ? t("load_test_page.stats.status_failed")
                            : t("load_test_page.stats.status_idle")}
                        </span>
                      }
                    />
                    {lastRunAt && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        <ClockCircleOutlined />{" "}
                        {t("load_test_page.stats.last_run", {
                          time: lastRunAt,
                        })}
                      </Typography.Text>
                    )}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {Object.keys(parsedStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className="glass-card"
            style={{ marginBottom: 16, borderRadius: 24 }}
            title={
              <Space>
                <ThunderboltOutlined
                  style={{ fontSize: 18, color: token.colorPrimary }}
                />
                <span style={{ fontWeight: 700 }}>
                  {t("load_test_page.kpi_snapshot.title")}
                </span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={6}>
                <Card
                  size="small"
                  bordered={false}
                  style={{
                    background: `${token.colorSuccess}08`,
                    borderRadius: 16,
                  }}
                >
                  <Statistic
                    title={t("load_test_page.kpi_snapshot.success_rate")}
                    value={successRate ? Number(successRate) : 0}
                    suffix="%"
                    valueStyle={{ color: token.colorSuccess, fontWeight: 700 }}
                  />
                  <Progress
                    percent={successRate ? Number(successRate) : 0}
                    status="active"
                    size="small"
                    strokeColor={token.colorSuccess}
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card
                  size="small"
                  bordered={false}
                  style={{
                    background: `${token.colorError}08`,
                    borderRadius: 16,
                  }}
                >
                  <Statistic
                    title={t("load_test_page.kpi_snapshot.failure_rate")}
                    value={
                      failureRate
                        ? Number(failureRate)
                        : t("load_test_page.result_summary.not_available")
                    }
                    suffix="%"
                    valueStyle={{ color: token.colorError, fontWeight: 700 }}
                  />
                  <Progress
                    percent={failureRate ? Number(failureRate) : 0}
                    status="exception"
                    size="small"
                    strokeColor={token.colorError}
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card
                  size="small"
                  bordered={false}
                  style={{
                    background: `${token.colorInfo}08`,
                    borderRadius: 16,
                  }}
                >
                  <Statistic
                    title={t("load_test_page.kpi_snapshot.requests_per_sec")}
                    value={
                      requestRate ||
                      t("load_test_page.result_summary.not_available")
                    }
                    valueStyle={{ color: token.colorInfo, fontWeight: 700 }}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <DashboardOutlined
                      style={{ fontSize: 10, marginRight: 4 }}
                    />
                    {t("load_test_page.kpi_snapshot.total", {
                      count: requestTotal,
                    })}
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card
                  size="small"
                  bordered={false}
                  style={{
                    background: `${token.colorWarning}08`,
                    borderRadius: 16,
                  }}
                >
                  <Statistic
                    title={t("load_test_page.kpi_snapshot.p95_duration")}
                    value={httpReqDurationStats.p95 || httpReqDurationP95}
                    valueStyle={{ color: token.colorWarning, fontWeight: 700 }}
                    prefix={<ClockCircleOutlined />}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t("load_test_page.kpi_snapshot.avg", {
                      value: httpReqDurationStats.avg || httpReqDurationAvg,
                    })}
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </motion.div>
      )}

      {hasTimeline && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            className="glass-card"
            style={{ marginBottom: 16, borderRadius: 24 }}
            title={
              <Space>
                <LineChartOutlined style={{ color: token.colorPrimary }} />
                <span style={{ fontWeight: 700 }}>
                  {t("load_test_page.timeline.title")}
                </span>
              </Space>
            }
            extra={
              <Typography.Text type="secondary">
                {t("load_test_page.timeline.subtitle")}
              </Typography.Text>
            }
          >
            <Line
              data={{
                labels: timeline.labels,
                datasets: [
                  {
                    label: t("load_test_page.timeline.iterations_label"),
                    data: timeline.cumulative,
                    borderColor: token.colorPrimary,
                    backgroundColor: `${token.colorPrimary}22`,
                    tension: 0.4,
                    fill: true,
                    yAxisID: "y",
                  },
                  {
                    label: t("load_test_page.timeline.rps_label"),
                    data: timeline.rps,
                    borderColor: token.colorWarning,
                    backgroundColor: `${token.colorWarning}22`,
                    tension: 0.4,
                    borderDash: [5, 5],
                    yAxisID: "y1",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  tooltip: { mode: "index", intersect: false },
                },
                interaction: { mode: "index", intersect: false },
                scales: {
                  y: {
                    type: "linear",
                    position: "left",
                    ticks: { color: token.colorText },
                    title: {
                      display: true,
                      text: t("load_test_page.timeline.iterations_label"),
                    },
                  },
                  y1: {
                    type: "linear",
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: { color: token.colorWarning },
                    title: {
                      display: true,
                      text: t("load_test_page.timeline.rps_label"),
                    },
                  },
                  x: {
                    ticks: { color: token.colorTextSecondary },
                  },
                },
              }}
              height={120}
            />
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card
          className="glass-card"
          style={{ marginBottom: 16, borderRadius: 24, overflow: "hidden" }}
          title={
            <Space>
              <ControlOutlined style={{ color: token.colorPrimary }} />
              <span style={{ fontWeight: 700 }}>
                {t("load_test_page.playground.title")}
              </span>
            </Space>
          }
          extra={
            <Tag color="cyan" bordered={false} style={{ borderRadius: 6 }}>
              {t("load_test_page.advanced.enterprise")}
            </Tag>
          }
        >
          <Alert
            type="info"
            showIcon
            icon={<ExperimentOutlined />}
            style={{
              marginBottom: 20,
              borderRadius: 16,
              border: "none",
              background: `${token.colorInfo}15`,
            }}
            message={
              <span style={{ fontWeight: 500 }}>
                {t("load_test_page.playground.alert_message")}
              </span>
            }
          />

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            className="modern-tabs"
            items={[
              {
                key: "profiles",
                label: (
                  <Space>
                    <DashboardOutlined />
                    {t("load_test_page.tabs.profiles")}
                  </Space>
                ),
                children: (
                  <div style={{ padding: "16px 8px" }}>
                    <TestProfileSelectorComponent
                      onSelectProfile={handleProfileSelect}
                      selectedProfile={selectedProfile}
                    />
                  </div>
                ),
              },
              {
                key: "basic",
                label: (
                  <Space>
                    <SettingOutlined />
                    {t("load_test_page.tabs.basic")}
                  </Space>
                ),
                children: (
                  <div style={{ padding: "20px 8px" }}>
                    <Form layout="vertical" onFinish={runTest}>
                      <Row gutter={[20, 20]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <span style={{ fontWeight: 600 }}>
                                {t(
                                  "load_test_page.playground.form.script_name_label"
                                )}
                              </span>
                            }
                          >
                            <Input
                              prefix={
                                <CodeOutlined
                                  style={{ color: token.colorTextTertiary }}
                                />
                              }
                              placeholder={t(
                                "load_test_page.playground.form.script_name_placeholder"
                              )}
                              value={scriptName}
                              onChange={(e) => setScriptName(e.target.value)}
                              style={{ borderRadius: 12 }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <span style={{ fontWeight: 600 }}>
                                {t(
                                  "load_test_page.playground.form.base_url_label"
                                )}
                              </span>
                            }
                          >
                            <Input
                              prefix={
                                <GlobalOutlined
                                  style={{ color: token.colorTextTertiary }}
                                />
                              }
                              placeholder={t(
                                "load_test_page.playground.form.base_url_placeholder"
                              )}
                              value={targetUrl}
                              onChange={(e) => setTargetUrl(e.target.value)}
                              style={{ borderRadius: 12 }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={12}>
                          <Form.Item
                            label={
                              <Space>
                                <span style={{ fontWeight: 600 }}>
                                  {t(
                                    "load_test_page.playground.form.vus_label"
                                  )}
                                </span>
                                <AntTooltip
                                  title={t(
                                    "load_test_page.playground.form.vus_tooltip"
                                  )}
                                >
                                  <Tag
                                    color="blue"
                                    bordered={false}
                                    style={{ margin: 0 }}
                                  >
                                    VUs
                                  </Tag>
                                </AntTooltip>
                              </Space>
                            }
                          >
                            <InputNumber
                              min={1}
                              max={1000}
                              value={vus}
                              onChange={(val) => setVus(val || 1)}
                              style={{ width: "100%", borderRadius: 12 }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={12}>
                          <Form.Item
                            label={
                              <Space>
                                <span style={{ fontWeight: 600 }}>
                                  {t(
                                    "load_test_page.playground.form.duration_label"
                                  )}
                                </span>
                                <AntTooltip
                                  title={t(
                                    "load_test_page.playground.form.duration_tooltip"
                                  )}
                                >
                                  <Tag
                                    color="purple"
                                    bordered={false}
                                    style={{ margin: 0 }}
                                  >
                                    sec
                                  </Tag>
                                </AntTooltip>
                              </Space>
                            }
                          >
                            <InputNumber
                              min={1}
                              max={3600}
                              value={durationSeconds}
                              onChange={(val) => setDurationSeconds(val || 1)}
                              style={{ width: "100%", borderRadius: 12 }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider style={{ margin: "24px 0" }} />

                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Button
                              icon={<FileSearchOutlined />}
                              onClick={openReportPreview}
                              disabled={!output}
                              size="large"
                              style={{ borderRadius: 12 }}
                            >
                              {t(
                                "load_test_page.playground.buttons.preview_report"
                              )}
                            </Button>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={downloadLog}
                              disabled={!output}
                              size="large"
                              style={{ borderRadius: 12 }}
                            >
                              {t(
                                "load_test_page.playground.buttons.download_log"
                              )}
                            </Button>
                          </Space>
                        </Col>
                        <Col>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              type="primary"
                              htmlType="submit"
                              size="large"
                              icon={<PlayCircleOutlined />}
                              loading={isLoading}
                              style={{
                                height: 48,
                                paddingInline: 32,
                                borderRadius: 16,
                                fontWeight: 700,
                                boxShadow: `0 8px 16px ${token.colorPrimary}4D`,
                              }}
                            >
                              {isLoading
                                ? t("load_test_page.playground.buttons.testing")
                                : t(
                                    "load_test_page.playground.buttons.run_test"
                                  )}
                            </Button>
                          </motion.div>
                        </Col>
                      </Row>
                    </Form>
                  </div>
                ),
              },
              {
                key: "advanced",
                label: (
                  <Space>
                    <ThunderboltOutlined />
                    {t("load_test_page.tabs.advanced")}
                    {Object.keys(advancedConfig).length > 0 && (
                      <Badge
                        count={Object.keys(advancedConfig).length}
                        offset={[8, -4]}
                      />
                    )}
                  </Space>
                ),
                children: (
                  <div style={{ padding: 16 }}>
                    <AdvancedConfigComponent
                      onConfigChange={handleAdvancedConfigChange}
                      initialConfig={advancedConfig}
                    />
                  </div>
                ),
              },
            ]}
          />

          <Divider style={{ margin: "16px 0" }} />

          <div style={{ textAlign: "center" }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              <ThunderboltOutlined style={{ marginRight: 6 }} />
              {t("load_test_page.playground.footer_text")}
            </Typography.Text>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          className="glass-card"
          title={
            <Space>
              <CodeOutlined
                style={{ fontSize: 18, color: token.colorPrimary }}
              />
              <span style={{ fontWeight: 700 }}>
                {t("load_test_page.curl_example.title")}
              </span>
            </Space>
          }
          style={{ marginBottom: 16, borderRadius: 24, overflow: "hidden" }}
        >
          <div
            style={{
              background: "#0f172a",
              padding: 20,
              borderRadius: 16,
              position: "relative",
              border: "1px solid #1e293b",
            }}
          >
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <Button
                size="small"
                type="text"
                icon={<CodeOutlined style={{ color: "#94a3b8" }} />}
                onClick={() => {
                  navigator.clipboard.writeText(curlSnippet);
                  toast.success("Copied to clipboard");
                }}
              />
            </div>
            <pre
              style={{
                color: "#e2e8f0",
                whiteSpace: "pre-wrap",
                margin: 0,
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              }}
            >
              <span style={{ color: "#38bdf8" }}>curl</span> --location{" "}
              <span style={{ color: "#94a3b8" }}>
                'http://localhost:3000/api/v1/load-test'
              </span>{" "}
              \
              <br />
              --header{" "}
              <span style={{ color: "#94a3b8" }}>
                'Content-Type: application/json'
              </span>{" "}
              \
              <br />
              --data <span style={{ color: "#94a3b8" }}>'{"{"}</span>
              <br />
              &nbsp;&nbsp;<span style={{ color: "#fb7185" }}>
                "script"
              </span>: <span style={{ color: "#4ade80" }}>"{scriptName}"</span>,
              <br />
              &nbsp;&nbsp;<span style={{ color: "#fb7185" }}>
                "baseURL"
              </span>: <span style={{ color: "#4ade80" }}>"{targetUrl}"</span>,
              <br />
              &nbsp;&nbsp;<span style={{ color: "#fb7185" }}>
                "request"
              </span>: <span style={{ color: "#f87171" }}>{vus}</span>,
              <br />
              &nbsp;&nbsp;<span style={{ color: "#fb7185" }}>
                "second"
              </span>:{" "}
              <span style={{ color: "#f87171" }}>{durationSeconds}</span>
              <br />
              <span style={{ color: "#94a3b8" }}>{"}"}'</span>
            </pre>
          </div>
        </Card>
      </motion.div>

      <SelectedTargetSummary script={scriptName} env={targetUrl} />

      {Object.keys(parsedStats).length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className="glass-card"
              title={
                <Space>
                  <LineChartOutlined style={{ color: token.colorPrimary }} />
                  <span style={{ fontWeight: 700 }}>
                    {t("load_test_page.graph_summary.title")}
                  </span>
                </Space>
              }
              style={{ marginBottom: 16, borderRadius: 24 }}
              extra={
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {t("load_test_page.graph_summary.subtitle")}
                </Typography.Text>
              }
            >
              {checks.total > 0 ? (
                <div style={{ padding: "8px 0" }}>
                  <SummaryChart stats={parsedStats} isLoading={isLoading} />
                </div>
              ) : (
                <Empty
                  description={t(
                    "load_test_page.graph_summary.empty_description"
                  )}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: "40px 0" }}
                />
              )}
            </Card>
          </motion.div>

          <Card
            title={
              <Space>
                <DatabaseOutlined />
                {t("load_test_page.result_summary.title", { url: targetUrl })}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {t("load_test_page.result_summary.description")}
            </Typography.Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.checks_total")}
                    value={
                      checks.total ||
                      t("load_test_page.result_summary.not_available")
                    }
                    prefix={<DatabaseOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.succeeded")}
                    value={
                      checks.success ||
                      t("load_test_page.result_summary.not_available")
                    }
                    valueStyle={{ color: token.colorSuccess }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.failed")}
                    value={
                      checks.failed ||
                      t("load_test_page.result_summary.not_available")
                    }
                    valueStyle={{ color: token.colorError }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.http_requests")}
                    value={
                      httpReqs ||
                      t("load_test_page.result_summary.not_available")
                    }
                    prefix={<CloudOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.avg_duration")}
                    value={httpReqDurationAvg}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.kpi_snapshot.p95_duration")}
                    value={httpReqDurationP95}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.throughput")}
                    value={requestRate}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.failure_rate_stat")}
                    value={
                      failureRate
                        ? `${failureRate}%`
                        : t("load_test_page.result_summary.not_available")
                    }
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: token.colorError }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.iterations")}
                    value={iterations}
                    prefix={<ThunderboltOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t(
                      "load_test_page.result_summary.iteration_duration"
                    )}
                    value={iterationDuration}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.data_transfer")}
                    value={`Received: ${dataReceived} | Sent: ${dataSent}`}
                    prefix={<CloudOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />
            <Descriptions
              column={2}
              size="middle"
              bordered
              labelStyle={{ width: 220 }}
            >
              <Descriptions.Item
                label={t("load_test_page.result_summary.response_time_desc")}
              >
                {(httpReqDurationStats.avg || httpReqDurationAvg) ??
                  t("load_test_page.result_summary.not_available")}{" "}
                /{" "}
                {(httpReqDurationStats.p95 || httpReqDurationP95) ??
                  t("load_test_page.result_summary.not_available")}{" "}
                /{" "}
                {httpReqDurationStats.max ??
                  t("load_test_page.result_summary.not_available")}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.request_rate_desc")}
              >
                {requestRate}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.failure_rate_desc")}
              >
                {failureRate
                  ? `${failureRate}%`
                  : t("load_test_page.result_summary.not_available")}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.success_rate_desc")}
              >
                {successRate
                  ? `${successRate}%`
                  : t("load_test_page.result_summary.not_available")}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.data_received_sent")}
              >
                {dataReceived} / {dataSent}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.iterations_total")}
              >
                {iterations}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
      {output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className="glass-card"
            title={
              <Space>
                <FileTextOutlined style={{ color: token.colorPrimary }} />
                <span style={{ fontWeight: 700 }}>
                  {t("load_test_page.log_report.title")}
                </span>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 24, overflow: "hidden" }}
          >
            <LogViewer
              output={output}
              expandedLines={expandedLines}
              setExpandedLines={setExpandedLines}
            />
          </Card>
        </motion.div>
      )}

      {showMetrics && metrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricsTable
            metrics={metrics}
            expandedLines={expandedLines}
            setExpandedLines={setExpandedLines}
          />
        </motion.div>
      )}

      <Modal
        title={
          <Space>
            <RocketOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontWeight: 800 }}>
              {t("load_test_page.modal.title")}
            </span>
          </Space>
        }
        open={isReportOpen}
        onCancel={() => setIsReportOpen(false)}
        width={1000}
        centered
        className="premium-modal"
        footer={[
          <Button
            key="close"
            onClick={() => setIsReportOpen(false)}
            size="large"
            style={{ borderRadius: 12 }}
          >
            {t("load_test_page.modal.close")}
          </Button>,
          <Button
            key="download-doc"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadReportDoc}
            size="large"
            style={{ borderRadius: 12 }}
          >
            {t("load_test_page.modal.download_doc")}
          </Button>,
          <Button
            key="download-pdf"
            icon={<DownloadOutlined />}
            onClick={downloadReportPdf}
            size="large"
            style={{ borderRadius: 12 }}
          >
            {t("load_test_page.modal.print_pdf")}
          </Button>,
        ]}
      >
        <div style={{ padding: "12px 0" }}>
          <Descriptions
            size="middle"
            column={{ xs: 1, sm: 2, md: 3 }}
            bordered
            layout="vertical"
            style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden" }}
          >
            <Descriptions.Item
              label={
                <Space>
                  <GlobalOutlined /> {t("load_test_page.modal.target_url")}
                </Space>
              }
              span={3}
            >
              <Typography.Link
                href={targetUrl}
                target="_blank"
                style={{ fontWeight: 600 }}
              >
                {targetUrl}
              </Typography.Link>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <CodeOutlined /> {t("load_test_page.modal.script")}
                </Space>
              }
            >
              <Tag color="blue">{scriptName}</Tag>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <ClockCircleOutlined />{" "}
                  {t("load_test_page.modal.generated_at")}
                </Space>
              }
            >
              {lastRunAt || "-"}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <SafetyOutlined /> {t("load_test_page.modal.status")}
                </Space>
              }
            >
              <Badge
                status={
                  runStatus === "running"
                    ? "processing"
                    : runStatus === "done"
                    ? "success"
                    : runStatus === "error"
                    ? "error"
                    : "default"
                }
                text={
                  <span
                    style={{ fontWeight: 600, textTransform: "capitalize" }}
                  >
                    {runStatus}
                  </span>
                }
              />
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <ControlOutlined /> {t("load_test_page.modal.parameters")}
                </Space>
              }
              span={3}
            >
              <Space split={<Divider type="vertical" />}>
                <span>
                  VUs: <strong>{vus}</strong>
                </span>
                <span>
                  Duration: <strong>{durationSeconds}s</strong>
                </span>
                <span>
                  Config:{" "}
                  <strong>
                    {Object.keys(advancedConfig).length ? "Custom" : "Standard"}
                  </strong>
                </span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <CheckCircleOutlined /> {t("load_test_page.modal.checks")}
                </Space>
              }
            >
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: token.colorTextSecondary }}>
                  Total:{" "}
                  <strong style={{ color: token.colorText }}>
                    {checks.total}
                  </strong>
                </span>
                <span style={{ color: token.colorSuccess }}>
                  Ok: <strong>{checks.success}</strong>
                </span>
                <span style={{ color: token.colorError }}>
                  Failed: <strong>{checks.failed}</strong>
                </span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <CloudOutlined />{" "}
                  {t("load_test_page.result_summary.http_requests")}
                </Space>
              }
            >
              <strong>
                {httpReqs || t("load_test_page.result_summary.not_available")}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <LineOutlined />{" "}
                  {t("load_test_page.result_summary.avg_duration")}
                </Space>
              }
            >
              <strong>{httpReqDurationAvg}</strong>
            </Descriptions.Item>
          </Descriptions>

          <Typography.Title level={4} style={{ marginBottom: 16 }}>
            <ThunderboltOutlined
              style={{ marginRight: 8, color: token.colorPrimary }}
            />
            {t("load_test_page.modal.metrics_snapshot")}
          </Typography.Title>
          {metrics.length ? (
            <Table
              size="small"
              pagination={false}
              dataSource={metrics
                .slice(0, 50)
                .map((m, idx) => ({ ...m, key: idx }))}
              columns={[
                {
                  title: t("load_test_page.metrics_report.metric_col"),
                  dataIndex: "key",
                  width: 320,
                  render: (text) => (
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      {text}
                    </Typography.Text>
                  ),
                },
                {
                  title: t("load_test_page.metrics_report.value_col"),
                  dataIndex: "value",
                  render: (text) => (
                    <code style={{ color: "#d946ef", fontSize: 13 }}>
                      {text}
                    </code>
                  ),
                },
              ]}
              style={{
                marginBottom: 24,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
              footer={() =>
                metrics.length > 50 ? (
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <Typography.Text type="secondary">
                      {t("load_test_page.metrics_report.more_items", {
                        count: metrics.length - 50,
                      })}
                    </Typography.Text>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <Empty
              description={t("load_test_page.metrics_report.empty_metrics")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "20px 0" }}
            />
          )}

          <Divider style={{ margin: "24px 0" }} />

          <Typography.Title level={4} style={{ marginBottom: 16 }}>
            <FileTextOutlined
              style={{ marginRight: 8, color: token.colorPrimary }}
            />
            {t("load_test_page.modal.log_latest")}
          </Typography.Title>
          <Card
            size="small"
            bordered={false}
            style={{
              background: "#0f172a",
              borderRadius: 16,
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ padding: 12 }}>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  maxHeight: 300,
                  overflow: "auto",
                  lineHeight: 1.6,
                }}
              >
                {reportLogDisplay}
              </pre>
              {logTail.length > reportLogPreviewLimit && (
                <div
                  style={{
                    borderTop: "1px solid #1e293b",
                    marginTop: 12,
                    paddingTop: 8,
                  }}
                >
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, color: "#38bdf8" }}
                    onClick={() => setShowFullReportLog((prev) => !prev)}
                  >
                    {showFullReportLog
                      ? t("load_test_page.modal.show_less")
                      : t("load_test_page.log_report.see_more")}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
