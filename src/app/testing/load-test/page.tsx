"use client";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layouts/backend-layout";
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Typography,
  Space,
  Statistic,
  Table,
  FloatButton,
  Divider,
  Skeleton,
  theme,
  Tag,
} from "antd";
import {
  PlayCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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
  const data = {
    labels: ["ผลการทดสอบ"],
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
    return JSON.stringify(jsonObj, null, 2); // 🪄 Pretty format
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
  >
) => {
  let formattedValue = value;
  let jsonParsed: any = null;
  let isJson = false;

  // 🧹 Remove trailing ' source=...' if it exists
  const cleanedValue = value.replace(/(}\s*)source=.*/, "}").trim();

  try {
    jsonParsed = JSON.parse(cleanedValue);
    formattedValue = JSON.stringify(jsonParsed, null, 2); // 🪄 Pretty format
    isJson = true;
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
    <div className="flex flex-col">
      <pre className="font-mono whitespace-pre-wrap break-words text-gray-200">
        {displayValue}
      </pre>
      {shouldTruncate && (
        <button
          className="text-blue-400 text-xs underline w-fit mt-1"
          onClick={() =>
            setExpandedLines((prev) => ({
              ...prev,
              [idx]: !isExpanded,
            }))
          }
        >
          {isExpanded ? "🔽 See less" : "🔼 See more"}
        </button>
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 8 }}>
        📜 Real-time Logs
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
        {output.split("\n").map((line, idx) => {
          const colorClass =
            line.includes("❌") || line.toLowerCase().includes("error")
              ? "text-red-400"
              : line.includes("✅") || line.toLowerCase().includes("success")
              ? "text-green-400"
              : line.includes("⚠️") || line.toLowerCase().includes("warn")
              ? "text-yellow-300"
              : "text-gray-200";

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
                  background: "#000",
                  color: "#fff",
                  padding: 8,
                  borderRadius: 8,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
                className={colorClass}
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
                  {isExpanded ? "See less" : "See more"}
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const columns = [
    {
      title: "📊 Metric",
      dataIndex: "key",
      key: "key",
      width: 320,
      render: (text: string) => (
        <Typography.Text strong>{text}</Typography.Text>
      ),
    },
    {
      title: "🧮 Value",
      dataIndex: "value",
      key: "value",
      render: (_: any, record: Metric, idx: number) => (
        <div>
          {renderFormattedMetricValue(
            record.value,
            idx,
            expandedLines,
            setExpandedLines
          )}
        </div>
      ),
    },
  ];

  return (
    <section style={{ marginTop: 16 }} ref={scrollRef}>
      <Card size="small" title="📈 สรุปผลการทดสอบ (Metrics Report)">
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
}) => (
  <div className="mt-2 text-sm text-white bg-gray-700 px-4 py-3 rounded border border-gray-600">
    <p>
      🧪 คุณกำลังเลือกทดสอบที่{" "}
      <span className="font-semibold text-emerald-300">
        {env.replace("https://", "")}/api/{script}
      </span>
    </p>
  </div>
);

//** getCheckCounts: คำนวณจำนวน Total/Success/Failed จากสถิติ
const getCheckCounts = (stats: Record<string, any>) => {
  const total = parseInt(
    stats["checks_total......................."]?.split(" ")[0] || "0"
  );
  const success = parseInt(
    stats["checks_succeeded..................."]?.match(/(\d+)\s+out/)?.[1] ||
      "0"
  );
  const failed = Math.max(0, total - success);
  return { total, success, failed };
};

export default function Page() {
  //** State หลักของหน้า (Log, ขยายบรรทัด, แสดง Metrics, เลือก Script/Env, โหลด)
  const [output, setOutput] = useState("");
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>(
    {}
  );
  const [showMetrics, setShowMetrics] = useState(false);
  const [selectedScript, setSelectedScript] = useState<any>("authentication");
  const [parsedStats, setParsedStats] = useState<Record<string, any>>({});
  const [selectedEnv, setSelectedEnv] = useState<any>(
    "https://apimobile-dev.schoolbright.co"
  );
  const [isLoading, setIsLoading] = useState(false);
  const { token } = theme.useToken();

  //** runTest: เรียก API /api/v1/load-test และอ่านผลแบบสตรีมทีละ chunk
  const runTest = async () => {
    try {
      setIsLoading(true);
      setShowMetrics(false);
      setOutput("");
      const response = await fetch("/api/v1/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: selectedScript, baseURL: selectedEnv }),
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

      setOutput((prev) => prev + "\n✅ Test completed.");
      setShowMetrics(true);
      setParsedStats(parseTestStats(accumulated));
    } catch (error: any) {
      setOutput(`❌ Load test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  //** downloadLog: ดาวน์โหลดไฟล์ Log ปัจจุบัน
  const downloadLog = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `k6-log-${selectedScript}.txt`;
    link.click();
  };

  const metrics = parseMetrics(output);

  return (
    <DashboardLayout>
      <ScrollToButtons />

      <Card title="📌 คำสั่งรันทดสอบ (K6 Command)" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Typography.Text strong>🔧 เลือก Script:</Typography.Text>
                <Select
                  showSearch
                  style={{ width: "100%", marginTop: 6 }}
                  value={selectedScript}
                  onChange={setSelectedScript}
                  options={[
                    {
                      label: "authentication (/api/Login)",
                      value: "authentication",
                    },
                    { label: "reset-password", value: "reset-password" },
                    { label: "register", value: "register" },
                    { label: "payment", value: "payment" },
                    {
                      label: "many-api-load (ยิงหลาย API พร้อมกัน)",
                      value: "many-api-load",
                    },
                  ]}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </div>
              <div>
                <Typography.Text strong>🌐 เลือก Environment:</Typography.Text>
                <Select
                  showSearch
                  style={{ width: "100%", marginTop: 6 }}
                  value={selectedEnv}
                  onChange={setSelectedEnv}
                  options={[
                    {
                      label: "Development",
                      value: "https://apimobile-dev.schoolbright.co",
                    },
                    {
                      label: "Production",
                      value: "https://sbapi.schoolbright.co",
                    },
                  ]}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </div>
            </Space>
          </Col>
          <Col
            xs={24}
            sm={12}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={runTest}
                loading={isLoading}
              >
                {isLoading ? "กำลังทดสอบ..." : "รันทดสอบ K6"}
              </Button>
              <Button onClick={downloadLog} disabled={!output}>
                บันทึก Log
              </Button>
            </Space>
          </Col>
        </Row>
        <Divider style={{ margin: "12px 0" }} />
        <SelectedTargetSummary script={selectedScript} env={selectedEnv} />
      </Card>

      {Object.keys(parsedStats).length > 0 && (
        <>
          <Card title="📈 กราฟสรุปผลการทดสอบ" style={{ marginBottom: 16 }}>
            <SummaryChart stats={parsedStats} isLoading={isLoading} />
          </Card>

          <Card
            title={`🧪 สรุปผลของการทดสอบที่ ${selectedEnv?.replace(
              "https://",
              ""
            )} /api/${selectedScript}`}
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="✅ Checks Total"
                    value={getCheckCounts(parsedStats).total || "N/A"}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="🎯 Succeeded"
                    value={getCheckCounts(parsedStats).success || "N/A"}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="❌ Failed"
                    value={getCheckCounts(parsedStats).failed || "N/A"}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="📦 HTTP Requests"
                    value={
                      parsedStats[
                        "http_reqs..............................................................."
                      ] || "N/A"
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="⏱️ Avg Duration"
                    value={
                      parsedStats[
                        "http_req_duration......................................................."
                      ]?.match(/avg=([\d.]+ms)/)?.[1] || "N/A"
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="🔁 Iterations"
                    value={
                      parsedStats[
                        "iterations.............................................................."
                      ]?.split(" ")[0] || "N/A"
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={6}>
                <Card size="small" bordered>
                  <Statistic
                    title="📊 Throughput"
                    value={
                      parsedStats["checks_total......................."]?.split(
                        " "
                      )[1] || "N/A"
                    }
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      )}
      {output && (
        <Card title="📜 รายงาน Log จากเซิร์ฟเวอร์" style={{ marginBottom: 16 }}>
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
    </DashboardLayout>
  );
}
