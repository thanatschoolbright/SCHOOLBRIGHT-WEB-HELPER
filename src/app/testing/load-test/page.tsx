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
  message,
} from "antd";
import {
  PlayCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileSearchOutlined,
  DownloadOutlined,
  LineChartOutlined,
  CloudOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  ApiOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  SettingOutlined,
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
        label: "Success",
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
        label: "Failed",
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
const ScrollToButtons = () => (
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
      tooltip="Scroll to bottom"
    />
  </>
);

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
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 8 }}>
        {t("load_test_page.log_report.realtime_logs")}
      </Typography.Title>
      <Card
        size="small"
        styles={{
          body: {
            padding: 12,
          },
        }}
        style={{ maxHeight: 420, overflow: "auto" }}
      >
        {!output && (
          <Empty
            description={t("load_test_page.log_report.empty_logs")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        {output.split("\n").map((line, idx) => {
          const color = line.toLowerCase().includes("error")
            ? token.colorError
            : line.toLowerCase().includes("success")
            ? token.colorSuccess
            : line.toLowerCase().includes("warn")
            ? token.colorWarning
            : token.colorText;

          const formattedJson = extractJsonAndFormat(line);
          const isExpanded = expandedLines[idx] || false;

          const displayedLine =
            formattedJson && !isExpanded && formattedJson.length > maxLength
              ? formattedJson.slice(0, maxLength) + "..."
              : formattedJson || line;

          return (
            <div key={idx} style={{ marginBottom: 8 }}>
              <pre
                style={{
                  background: token.colorBgContainer,
                  color,
                  padding: 8,
                  borderRadius: 8,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  whiteSpace: "pre-wrap",
                  margin: 0,
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
                  style={{ paddingInline: 0 }}
                >
                  {isExpanded
                    ? t("load_test_page.log_report.see_less")
                    : t("load_test_page.log_report.see_more")}
                </Button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </Card>
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

//** MetricsTable: สรุป Metrics ด้วยตาราง AntD
const MetricsTable = ({
  metrics,
  expandedLines,
  setExpandedLines,
}: MetricsTableProps) => {
  const { t } = useTranslation("translate");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const columns = [
    {
      title: t("load_test_page.metrics_report.metric_col"),
      dataIndex: "key",
      key: "key",
      width: 320,
      render: (text: string) => (
        <Typography.Text strong>{text}</Typography.Text>
      ),
    },
    {
      title: t("load_test_page.metrics_report.value_col"),
      dataIndex: "value",
      key: "value",
      render: (_: any, record: Metric, idx: number) => (
        <div>
          {renderFormattedMetricValue(
            record.value,
            idx,
            expandedLines,
            setExpandedLines,
            t
          )}
        </div>
      ),
    },
  ];

  return (
    <section style={{ marginTop: 16 }} ref={scrollRef}>
      <Card
        size="small"
        title={
          <Space>
            <LineChartOutlined />
            {t("load_test_page.metrics_report.title")}
          </Space>
        }
      >
        <Table
          size="small"
          pagination={false}
          rowKey={(r, i) => String(i)}
          dataSource={metrics}
          columns={columns as any}
          scroll={{ y: 360 }}
        />
      </Card>
    </section>
  );
};

// 🔍 แสดง URL ที่กำลังทดสอบอยู่
//** SelectedTargetSummary: สรุป URL ที่ใช้งานจริง
const SelectedTargetSummary = ({
  script,
  env,
}: {
  script: string;
  env: string;
}) => {
  const { t } = useTranslation("translate");
  return (
    <Alert
      type="success"
      showIcon
      message={
        <Space direction="vertical" size={2}>
          <Typography.Text strong>
            <ApiOutlined /> {t("load_test_page.target_summary.title")}
          </Typography.Text>
          <Typography.Text code>{env}</Typography.Text>
          <Typography.Text type="secondary">script: {script}</Typography.Text>
        </Space>
      }
      style={{ marginBottom: 16 }}
    />
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

      setOutput((prev) => prev + "\nTest completed.");
      setShowMetrics(true);
      setParsedStats(parseTestStats(accumulated));
      setRunStatus("done");
      setLastRunAt(new Date().toLocaleString());
      message.success(t("load_test_page.messages.test_completed"));
    } catch (error: any) {
      setOutput(`Load test failed: ${error.message}`);
      setRunStatus("error");
      message.error(t("load_test_page.messages.test_failed"));
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

    message.success(
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
    httpReqDuration?.match(/avg=([\d.]+ms)/)?.[1] || "N/A";
  const httpReqDurationP95 =
    httpReqDuration?.match(/p\\(95\\)=([\\d.]+ms)/)?.[1] || "N/A";
  const httpReqFailed =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("http_req_failed")
      ) || ""
    ] || "N/A";
  const httpReqFailedPct = parsePercentStat(httpReqFailed);

  const httpReqCounts = parseCountAndRate(httpReqs);
  const httpReqDurationStats = parseDurationStat(httpReqDuration);
  const iterationsLine =
    parsedStats[
      Object.keys(parsedStats).find((k) => k.trim().startsWith("iterations")) ||
        ""
    ];
  const iterations = iterationsLine?.split(" ").filter(Boolean)?.[0] || "N/A";
  const iterationDuration =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("iteration_duration")
      ) || ""
    ] || "N/A";
  const iterationDurationStats = parseDurationStat(iterationDuration);
  const dataReceived =
    parsedStats[
      Object.keys(parsedStats).find((k) =>
        k.trim().startsWith("data_received")
      ) || ""
    ] || "N/A";
  const dataSent =
    parsedStats[
      Object.keys(parsedStats).find((k) => k.trim().startsWith("data_sent")) ||
        ""
    ] || "N/A";
  const successRate =
    checks.total > 0
      ? ((checks.success / checks.total) * 100).toFixed(2)
      : null;
  const failureRate =
    checks.total > 0 ? ((checks.failed / checks.total) * 100).toFixed(2) : null;
  const requestRate =
    httpReqCounts?.rate && Number.isFinite(httpReqCounts.rate)
      ? httpReqCounts.rate.toFixed(2)
      : "N/A";
  const requestTotal =
    httpReqCounts?.count && Number.isFinite(httpReqCounts.count)
      ? httpReqCounts.count
      : httpReqs || "N/A";
  const logTail = output
    ? output.split("\n").slice(-50).join("\n")
    : "ยังไม่มี log";
  const timeline = parseTimeline(output);
  const hasTimeline = timeline.labels.length > 0;
  const reportLogPreviewLimit = 1200;
  const reportLogDisplay =
    showFullReportLog || !logTail
      ? logTail
      : logTail.length > reportLogPreviewLimit
      ? `${logTail.slice(
          0,
          reportLogPreviewLimit
        )}\n...\n(See more to view full log)`
      : logTail;

  const buildReportText = () => {
    const generatedAt = lastRunAt || new Date().toLocaleString();
    const metricsBlock = metrics.length
      ? metrics.map((m) => `- ${m.key}: ${m.value}`).join("\n")
      : "N/A";

    return [
      "=== Load Testing Report (Enterprise) ===",
      `Generated At: ${generatedAt}`,
      `Status: ${runStatus}`,
      `Target URL: ${targetUrl}`,
      `Script: ${scriptName}`,
      `Parameters: VUs=${vus}, Duration=${durationSeconds}s`,
      "",
      "Summary",
      `- Checks => total=${checks.total}, success=${checks.success}, failed=${checks.failed}`,
      `- HTTP Requests => ${httpReqs || "N/A"}`,
      `- HTTP Duration => ${httpReqDuration || "N/A"}`,
      `- Success Rate => ${successRate ? `${successRate}%` : "N/A"}`,
      `- Failure Rate => ${
        Number.isFinite(httpReqFailedPct)
          ? `${httpReqFailedPct}%`
          : failureRate
          ? `${failureRate}%`
          : "N/A"
      }`,
      `- Requests/sec => ${requestRate}`,
      "",
      "Metrics",
      metricsBlock,
      "",
      "Log (latest 50 lines)",
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
        <title>Load Test Report</title>
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
        <h1>Load Testing Report</h1>
        <p>Generated At: ${generatedAt}</p>

        <div class="section card">
          <h2>Overview</h2>
          <p><strong>Status:</strong> ${runStatus}</p>
          <p><strong>Target URL:</strong> ${targetUrl}</p>
          <p><strong>Script:</strong> ${scriptName}</p>
          <p><strong>Parameters:</strong> VUs=${vus}, Duration=${durationSeconds}s</p>
        </div>

        <div class="section card">
          <h3>Summary</h3>
          <ul>
            <li>Checks: total=${checks.total}, success=${
      checks.success
    }, failed=${checks.failed}</li>
            <li>HTTP Requests: ${httpReqs || "N/A"}</li>
            <li>HTTP Duration: ${httpReqDuration || "N/A"}</li>
            <li>Success Rate: ${successRate ? `${successRate}%` : "N/A"}</li>
            <li>Failure Rate: ${failureRate ? `${failureRate}%` : "N/A"}</li>
            <li>Requests/sec: ${requestRate}</li>
            <li>p95 Duration: ${
              httpReqDurationStats.p95 || httpReqDurationP95
            }</li>
            <li>Avg Duration: ${
              httpReqDurationStats.avg || httpReqDurationAvg
            }</li>
            <li>Iterations: ${iterations}</li>
            <li>Iteration Duration: ${iterationDuration}</li>
            <li>Data: received=${dataReceived}, sent=${dataSent}</li>
          </ul>
        </div>

        <div class="section card">
          <h3>Metrics</h3>
          ${
            metrics.length
              ? `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${metricRows}</tbody></table>`
              : "<p>No metrics available.</p>"
          }
        </div>

        <div class="section card">
          <h3>Log (latest 50 lines)</h3>
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
      { label: "Target URL", value: targetUrl },
      { label: "Script", value: scriptName },
      { label: "Status", value: runStatus },
      { label: "Generated At", value: generatedAt },
      {
        label: "Parameters",
        value: `VUs=${vus}, Duration=${durationSeconds}s`,
      },
      {
        label: "Checks",
        value: `total=${checks.total}, success=${checks.success}, failed=${checks.failed}`,
      },
      { label: "Success Rate", value: successRate ? `${successRate}%` : "N/A" },
      {
        label: "Failure Rate",
        value: failureRate ? `${failureRate}%` : "N/A",
      },
      { label: "HTTP Requests", value: httpReqs || "N/A" },
      { label: "Request Rate (rps)", value: requestRate },
      {
        label: "Response Time (avg/p95/max)",
        value: `${httpReqDurationStats.avg || httpReqDurationAvg} / ${
          httpReqDurationStats.p95 || httpReqDurationP95
        } / ${httpReqDurationStats.max || "N/A"}`,
      },
      { label: "Iteration Duration", value: iterationDuration },
      { label: "Iterations", value: iterations },
      {
        label: "Data Transfer",
        value: `Received: ${dataReceived} | Sent: ${dataSent}`,
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
        <title>Load Test Report</title>
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
        <h1>Load Testing Report</h1>
        <p class="badge">Generated At: ${generatedAt}</p>

        <div class="section card">
          <h2>Overview</h2>
          <table>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>
        </div>

        <div class="section card">
          <h3>Summary Grid</h3>
          <div class="grid">
            <div class="card" style="padding:12px;">
              <strong>Checks</strong><br/>
              Total: ${checks.total} | Success: ${checks.success} | Failed: ${
      checks.failed
    }
            </div>
            <div class="card" style="padding:12px;">
              <strong>Rates</strong><br/>
              Success: ${successRate ? `${successRate}%` : "N/A"} | Failure: ${
      Number.isFinite(httpReqFailedPct)
        ? `${httpReqFailedPct}%`
        : failureRate
        ? `${failureRate}%`
        : "N/A"
    }
            </div>
            <div class="card" style="padding:12px;">
              <strong>Requests</strong><br/>
              Total: ${httpReqs || "N/A"} | Rate: ${requestRate} rps
            </div>
            <div class="card" style="padding:12px;">
              <strong>Response Time</strong><br/>
              avg=${httpReqDurationStats.avg || httpReqDurationAvg}, p95=${
      httpReqDurationStats.p95 || httpReqDurationP95
    }, max=${httpReqDurationStats.max || "N/A"}
            </div>
            <div class="card" style="padding:12px;">
              <strong>Iterations</strong><br/>
              Count: ${iterations} | Duration: ${iterationDuration}
            </div>
            <div class="card" style="padding:12px;">
              <strong>Data Transfer</strong><br/>
              Received: ${dataReceived} | Sent: ${dataSent}
            </div>
          </div>
        </div>

        <div class="section card">
          <h3>Metrics</h3>
          ${
            metrics.length
              ? `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${metricRows}</tbody></table>`
              : "<p>No metrics available.</p>"
          }
        </div>

        <div class="section card">
          <h3>Log (latest 50 lines)</h3>
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

      <Card
        style={{
          marginBottom: 16,
          background: `linear-gradient(135deg, ${token.colorPrimary}1A, ${token.colorBgElevated})`,
          border: `1px solid ${token.colorBorder}`,
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
            <Space direction="vertical" size={4}>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {t("load_test_page.title")}
              </Typography.Title>
              <Typography.Text type="secondary">
                {t("load_test_page.subtitle")}
              </Typography.Text>
              <Space wrap>
                <Tag color="blue">{t("load_test_page.tags.k6")}</Tag>
                <Tag color="geekblue">
                  {t("load_test_page.tags.streaming_log")}
                </Tag>
                <Tag color="green">{t("load_test_page.tags.ant_design")}</Tag>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={10}>
            <Row gutter={12}>
              <Col span={12}>
                <Card size="small" bordered>
                  <Statistic
                    title={t("load_test_page.stats.concurrent_users")}
                    value={vus}
                    suffix="vus"
                    valueStyle={{ fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" bordered>
                  <Statistic
                    title={t("load_test_page.stats.duration")}
                    value={durationSeconds}
                    suffix="sec"
                    valueStyle={{ fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={24} style={{ marginTop: 8 }}>
                <Space>
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
                      runStatus === "running"
                        ? t("load_test_page.stats.status_running")
                        : runStatus === "done"
                        ? t("load_test_page.stats.status_completed")
                        : runStatus === "error"
                        ? t("load_test_page.stats.status_failed")
                        : t("load_test_page.stats.status_idle")
                    }
                  />
                  {lastRunAt && (
                    <Typography.Text type="secondary">
                      {t("load_test_page.stats.last_run", { time: lastRunAt })}
                    </Typography.Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {Object.keys(parsedStats).length > 0 && (
        <Card
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <LineChartOutlined />
              {t("load_test_page.kpi_snapshot.title")}
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Card size="small" bordered>
                <Statistic
                  title={t("load_test_page.kpi_snapshot.success_rate")}
                  value={successRate ? Number(successRate) : 0}
                  suffix="%"
                />
                <Progress
                  percent={successRate ? Number(successRate) : 0}
                  status="active"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card size="small" bordered>
                <Statistic
                  title={t("load_test_page.kpi_snapshot.failure_rate")}
                  value={failureRate ? Number(failureRate) : "N/A"}
                  suffix="%"
                  valueStyle={{ color: token.colorError }}
                />
                <Progress
                  percent={failureRate ? Number(failureRate) : 0}
                  status="exception"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card size="small" bordered>
                <Statistic
                  title={t("load_test_page.kpi_snapshot.requests_per_sec")}
                  value={requestRate || "N/A"}
                />
                <Typography.Text type="secondary">
                  {t("load_test_page.kpi_snapshot.total", {
                    count: requestTotal,
                  })}
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card size="small" bordered>
                <Statistic
                  title={t("load_test_page.kpi_snapshot.p95_duration")}
                  value={httpReqDurationStats.p95 || httpReqDurationP95}
                />
                <Typography.Text type="secondary">
                  {t("load_test_page.kpi_snapshot.avg", {
                    value: httpReqDurationStats.avg || httpReqDurationAvg,
                  })}
                </Typography.Text>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {hasTimeline && (
        <Card
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <LineChartOutlined />
              {t("load_test_page.timeline.title")}
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
                  backgroundColor: `${token.colorPrimary}44`,
                  tension: 0.3,
                  yAxisID: "y",
                },
                {
                  label: t("load_test_page.timeline.rps_label"),
                  data: timeline.rps,
                  borderColor: token.colorWarning,
                  backgroundColor: `${token.colorWarning}44`,
                  tension: 0.3,
                  borderDash: [6, 6],
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
      )}

      <Card
        title={
          <Space>
            <CloudOutlined />
            {t("load_test_page.playground.title")}
          </Space>
        }
        extra={<Tag color="cyan">Enterprise Edition</Tag>}
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t("load_test_page.playground.alert_message")}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "profiles",
              label: (
                <Space>
                  <ExperimentOutlined />
                  {t("load_test_page.tabs.profiles")}
                </Space>
              ),
              children: (
                <TestProfileSelectorComponent
                  onSelectProfile={handleProfileSelect}
                  selectedProfile={selectedProfile}
                />
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
                <Form layout="vertical" onFinish={runTest}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={t(
                          "load_test_page.playground.form.script_name_label"
                        )}
                      >
                        <Input
                          placeholder={t(
                            "load_test_page.playground.form.script_name_placeholder"
                          )}
                          value={scriptName}
                          onChange={(e) => setScriptName(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={t(
                          "load_test_page.playground.form.base_url_label"
                        )}
                      >
                        <Input
                          placeholder={t(
                            "load_test_page.playground.form.base_url_placeholder"
                          )}
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={
                          <Space>
                            {t("load_test_page.playground.form.vus_label")}
                            <AntTooltip
                              title={t(
                                "load_test_page.playground.form.vus_tooltip"
                              )}
                            >
                              <Tag color="blue">VUs</Tag>
                            </AntTooltip>
                          </Space>
                        }
                      >
                        <InputNumber
                          min={1}
                          style={{ width: "100%" }}
                          value={vus}
                          onChange={(val) => setVus(val || 1)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={
                          <Space>
                            {t("load_test_page.playground.form.duration_label")}
                            <AntTooltip
                              title={t(
                                "load_test_page.playground.form.duration_tooltip"
                              )}
                            >
                              <Tag color="purple">sec</Tag>
                            </AntTooltip>
                          </Space>
                        }
                      >
                        <InputNumber
                          min={1}
                          style={{ width: "100%" }}
                          value={durationSeconds}
                          onChange={(val) => setDurationSeconds(val || 1)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Typography.Text type="secondary">
                      {t("load_test_page.playground.footer_text")}
                    </Typography.Text>
                    <Space>
                      <Button
                        icon={<FileSearchOutlined />}
                        onClick={openReportPreview}
                        disabled={!output}
                      >
                        {t("load_test_page.playground.buttons.preview_report")}
                      </Button>
                      <Button onClick={downloadLog} disabled={!output}>
                        {t("load_test_page.playground.buttons.download_log")}
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<PlayCircleOutlined />}
                        loading={isLoading}
                      >
                        {isLoading
                          ? t("load_test_page.playground.buttons.testing")
                          : t("load_test_page.playground.buttons.run_test")}
                      </Button>
                    </Space>
                  </Space>
                </Form>
              ),
            },
            {
              key: "advanced",
              label: (
                <Space>
                  <ThunderboltOutlined />
                  {t("load_test_page.tabs.advanced")}
                  {Object.keys(advancedConfig).length > 0 && (
                    <Badge count={Object.keys(advancedConfig).length} />
                  )}
                </Space>
              ),
              children: (
                <AdvancedConfigComponent
                  onConfigChange={handleAdvancedConfigChange}
                  initialConfig={advancedConfig}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            {t("load_test_page.curl_example.title")}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <pre
          style={{
            background: token.colorBgContainerDisabled,
            padding: 12,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            margin: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {curlSnippet}
        </pre>
      </Card>
      <SelectedTargetSummary script={scriptName} env={targetUrl} />

      {Object.keys(parsedStats).length > 0 && (
        <>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                {t("load_test_page.graph_summary.title")}
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Typography.Text type="secondary">
                {t("load_test_page.graph_summary.subtitle")}
              </Typography.Text>
            }
          >
            {checks.total > 0 ? (
              <SummaryChart stats={parsedStats} isLoading={isLoading} />
            ) : (
              <Empty
                description={t(
                  "load_test_page.graph_summary.empty_description"
                )}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>

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
                    value={checks.total || "N/A"}
                    prefix={<DatabaseOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.succeeded")}
                    value={checks.success || "N/A"}
                    valueStyle={{ color: token.colorSuccess }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.failed")}
                    value={checks.failed || "N/A"}
                    valueStyle={{ color: token.colorError }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered bodyStyle={{ padding: 12 }}>
                  <Statistic
                    title={t("load_test_page.result_summary.http_requests")}
                    value={httpReqs || "N/A"}
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
                    value={failureRate ? `${failureRate}%` : "N/A"}
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
                {(httpReqDurationStats.avg || httpReqDurationAvg) ?? "N/A"} /{" "}
                {(httpReqDurationStats.p95 || httpReqDurationP95) ?? "N/A"} /{" "}
                {httpReqDurationStats.max ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.request_rate_desc")}
              >
                {requestRate}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.failure_rate_desc")}
              >
                {failureRate ? `${failureRate}%` : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("load_test_page.result_summary.success_rate_desc")}
              >
                {successRate ? `${successRate}%` : "N/A"}
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
        <Card
          title={
            <Space>
              <FileTextOutlined />
              {t("load_test_page.log_report.title")}
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <LogViewer
            output={output}
            expandedLines={expandedLines}
            setExpandedLines={setExpandedLines}
          />
        </Card>
      )}

      {showMetrics && metrics.length > 0 && (
        <MetricsTable
          metrics={metrics}
          expandedLines={expandedLines}
          setExpandedLines={setExpandedLines}
        />
      )}

      <Modal
        title={t("load_test_page.modal.title")}
        open={isReportOpen}
        onCancel={() => setIsReportOpen(false)}
        width={960}
        footer={[
          <Button key="close" onClick={() => setIsReportOpen(false)}>
            {t("load_test_page.modal.close")}
          </Button>,
          <Button
            key="download-doc"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadReportDoc}
          >
            {t("load_test_page.modal.download_doc")}
          </Button>,
          <Button
            key="download-pdf"
            icon={<DownloadOutlined />}
            onClick={downloadReportPdf}
          >
            {t("load_test_page.modal.print_pdf")}
          </Button>,
        ]}
      >
        <Descriptions
          size="middle"
          column={2}
          bordered
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item
            label={t("load_test_page.modal.target_url")}
            span={2}
          >
            {targetUrl}
          </Descriptions.Item>
          <Descriptions.Item label={t("load_test_page.modal.script")}>
            {scriptName}
          </Descriptions.Item>
          <Descriptions.Item label={t("load_test_page.modal.generated_at")}>
            {lastRunAt || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("load_test_page.modal.status")}>
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
              text={runStatus}
            />
          </Descriptions.Item>
          <Descriptions.Item
            label={t("load_test_page.modal.parameters")}
            span={2}
          >
            VUs: {vus} / Duration: {durationSeconds}s
          </Descriptions.Item>
          <Descriptions.Item label={t("load_test_page.modal.checks")}>
            {`Total ${checks.total} | Success ${checks.success} | Failed ${checks.failed}`}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("load_test_page.result_summary.http_requests")}
          >
            {httpReqs || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("load_test_page.result_summary.avg_duration")}
          >
            {httpReqDurationAvg}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Title level={5} style={{ marginTop: 12 }}>
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
              },
              {
                title: t("load_test_page.metrics_report.value_col"),
                dataIndex: "value",
              },
            ]}
            style={{ marginBottom: 16 }}
            footer={() =>
              metrics.length > 50 ? (
                <Typography.Text
                  type="secondary"
                  style={{ textAlign: "center", display: "block" }}
                >
                  {t("load_test_page.metrics_report.more_items", {
                    count: metrics.length - 50,
                  })}
                </Typography.Text>
              ) : undefined
            }
          />
        ) : (
          <Empty
            description={t("load_test_page.metrics_report.empty_metrics")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        <Divider />
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          {t("load_test_page.modal.log_latest")}
        </Typography.Title>
        <Card size="small" style={{ background: token.colorBgContainer }}>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              maxHeight: 280,
              overflow: "auto",
            }}
          >
            {reportLogDisplay}
          </pre>
          {logTail.length > reportLogPreviewLimit && (
            <Button
              type="link"
              size="small"
              style={{ paddingLeft: 0 }}
              onClick={() => setShowFullReportLog((prev) => !prev)}
            >
              {showFullReportLog
                ? t("load_test_page.modal.show_less")
                : t("load_test_page.log_report.see_more")}
            </Button>
          )}
        </Card>
      </Modal>
    </DashboardLayout>
  );
}
