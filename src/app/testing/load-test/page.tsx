"use client";
import { FiArrowUp, FiArrowDown, FiPlay } from "react-icons/fi";
import DashboardLayout from "@/components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useState, useEffect, useRef } from "react";
import { SearchableSelectComponent } from "@components/input-field/searchable-select-component";
import SummaryCard from "@components/card/summary-card";
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

// SummaryChart component
const SummaryChart = ({
  stats,
  isLoading,
}: {
  stats: Record<string, any>;
  isLoading?: boolean;
}) => {
  const chartRef = useRef<any>(null);
  const total = parseInt(
    stats["checks_total......................."]?.split(" ")[0] || "0"
  );
  const success = parseInt(
    stats["checks_succeeded..................."]?.match(/(\d+)\s+out/)?.[1] ||
      "0"
  );
  const failed = total - success;

  // Chart.js v3+ supports context-based backgroundColor for gradients
  const data = {
    labels: ["ผลการทดสอบ"],
    datasets: [
      {
        label: "✅ สำเร็จ",
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
          gradient.addColorStop(0, "#10b981"); // emerald-500
          gradient.addColorStop(1, "#6ee7b7"); // emerald-300
          return gradient;
        },
        borderRadius: 12,
      },
      {
        label: "❌ ไม่สำเร็จ",
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
          gradient.addColorStop(0, "#f87171"); // red-400
          gradient.addColorStop(1, "#fecaca"); // red-200
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
          color: "#000000", // เปลี่ยนจาก gray-200 เป็นสีดำ
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#000000", // สีข้อความใน tooltip
        bodyColor: "#000000",
        // ...
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#000000", // สีแกน X
        },
      },
      y: {
        grid: { display: false },
        beginAtZero: true,
        ticks: {
          color: "#000000", // สีแกน Y
        },
      },
    },
  };

  // To ensure gradient is recalculated on resize, force update
  // (Chart.js 3+ handles context-based gradient correctly)
  return (
    <div className="my-6">
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500"></div>
        </div>
      ) : (
        <Bar ref={chartRef} data={data} options={options} />
      )}
    </div>
  );
};

type Metric = {
  key: string;
  value: string;
};

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

const parseTestStats = (text: string): Record<string, any> => {
  const result: Record<string, any> = {};
  const lines = text.split("\n");
  lines.forEach((line) => {
    const match = line.match(/^([\w_.\s✓✅]+):\s+(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      result[key] = value;
    }
  });
  return result;
};

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

const ScrollToButtons = () => (
  <div className="fixed right-4 bottom-4 md:bottom-8 md:right-8 z-[9999] flex flex-col items-center gap-2">
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-md backdrop-blur"
      title="ไปบนสุด"
    >
      <FiArrowUp size={20} />
    </button>
    <button
      onClick={() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        })
      }
      className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-md backdrop-blur"
      title="ไปล่างสุด"
    >
      <FiArrowDown size={20} />
    </button>
  </div>
);

type LogViewerProps = {
  output: string;
  expandedLines: Record<number, boolean>;
  setExpandedLines: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  maxLength?: number;
};

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
    <div className="mt-6">
      <h2 className="text-lg font-bold text-dark dark:text-white mb-2">
        📜 Real-time Logs
      </h2>
      <pre className="bg-black text-sm text-white p-4 rounded max-h-[400px] overflow-y-auto whitespace-pre-wrap border border-gray-700">
        <div>
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
              <div key={idx} className={colorClass}>
                <div className="flex flex-col">
                  <pre className="font-mono bg-black text-sm text-white p-4 rounded ...">
                    {displayedLine}
                  </pre>
                  {formattedJson && formattedJson.length > maxLength && (
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
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </pre>
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

const MetricsTable = ({
  metrics,
  expandedLines,
  setExpandedLines,
}: MetricsTableProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section className="mt-6" ref={scrollRef}>
      <div className="overflow-x-auto rounded shadow-lg border border-gray-700 max-h-[400px] overflow-y-auto">
        <h2 className="text-lg font-bold text-dark dark:text-white mb-2 mt-0 px-6 pt-6">
          📈 สรุปผลการทดสอบ (Metrics Report)
        </h2>
        <table className="min-w-full text-sm text-left text-gray-300 bg-gray-800">
          <thead className="bg-gray-700 text-white sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wide">
                📊 Metric
              </th>
              <th scope="col" className="px-6 py-3 font-semibold tracking-wide">
                🧮 Value
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, value }, idx) => (
              <tr
                key={idx}
                className={
                  idx % 2 === 0
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-gray-900 hover:bg-gray-800"
                }
              >
                <td className="px-6 py-3 whitespace-nowrap font-medium">
                  {key}
                </td>
                <td className="px-6 py-3 whitespace-pre-wrap">
                  {renderFormattedMetricValue(
                    value,
                    idx,
                    expandedLines,
                    setExpandedLines
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// 🔍 แสดง URL ที่กำลังทดสอบอยู่
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

export default function Page() {
  const [output, setOutput] = useState("");
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>(
    {}
  );
  const [showMetrics, setShowMetrics] = useState(false);
  const [selectedScript, setSelectedScript] = useState("authentication");
  const [parsedStats, setParsedStats] = useState<Record<string, any>>({});
  const [selectedEnv, setSelectedEnv] = useState(
    "https://apimobile-dev.schoolbright.co"
  );
  const [isLoading, setIsLoading] = useState(false);

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

      <ContentCard
        title="📌 คำสั่งรันทดสอบ (K6 Command)"
        size="xl"
        fullWidth
        className="mb-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mb-4">
          <div>
            <SearchableSelectComponent
              options={[
                {
                  label: "authentication (/api/Login)",
                  value: "authentication",
                },
                { label: "reset-password", value: "reset-password" },
                { label: "register", value: "register" },
                { label: "payment", value: "payment" },
              ]}
              value={selectedScript}
              onChange={setSelectedScript}
              label="🔧 เลือก Script:"
            />
            <div className="mt-4">
              <SearchableSelectComponent
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
                value={selectedEnv}
                onChange={setSelectedEnv}
                label="🌐 เลือก Environment:"
              />
            </div>
          </div>
          <div className="flex items-end h-full">
            <button
              onClick={runTest}
              disabled={isLoading}
              className={`w-full sm:w-auto px-6 py-2 text-white text-lg font-semibold rounded-xl border transition-colors duration-200 ${
                isLoading
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gray-900 border-gray-700 hover:border-emerald-400 hover:bg-gray-800"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <FiPlay className="text-emerald-400" />
                {isLoading ? "กำลังทดสอบ..." : "รันทดสอบ K6"}
              </span>
            </button>
          </div>
        </div>
        {/* Summary of selected test */}
        <SelectedTargetSummary script={selectedScript} env={selectedEnv} />
      </ContentCard>

      {Object.keys(parsedStats).length > 0 && (
        <>
          <ContentCard
            title="📈 กราฟสรุปผลการทดสอบ"
            size="xl"
            fullWidth
            className="mb-4"
          >
            <SummaryChart stats={parsedStats} isLoading={isLoading} />
          </ContentCard>
          <ContentCard
            title={`🧪 สรุปผลของการทดสอบที่ ${selectedEnv.replace(
              "https://",
              ""
            )}/api/${selectedScript}`}
            size="xl"
            className="mt-4 mb-4"
            fullWidth
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="✅ จำนวนที่ตรวจสอบทั้งหมด"
                value={
                  parsedStats["checks_total......................."] || "N/A"
                }
                subtitle="รวมทั้งหมดที่ทำการตรวจสอบ"
                bgColor="from-green-400 via-emerald-500 to-green-600 bg-gradient-to-br"
                isLoading={isLoading}
              />
              <SummaryCard
                title="🎯 จำนวนที่สำเร็จ"
                value={
                  parsedStats["checks_succeeded..................."]?.match(
                    /(\d+)\s+out/
                  )?.[1] || "N/A"
                }
                subtitle="จำนวนที่ตรวจสอบผ่าน"
                bgColor="from-green-400 via-emerald-500 to-green-600 bg-gradient-to-br"
                isLoading={isLoading}
              />
              <SummaryCard
                title="❌ จำนวนที่ล้มเหลว"
                value={(() => {
                  const total =
                    parsedStats["checks_total......................."]?.split(
                      " "
                    )[0];
                  const success =
                    parsedStats["checks_succeeded..................."]?.match(
                      /(\d+)\s+out/
                    )?.[1];
                  if (total && success) {
                    return parseInt(total) - parseInt(success);
                  }
                  return "N/A";
                })()}
                subtitle="จำนวนที่ตรวจสอบไม่ผ่าน"
                bgColor="from-red-400 via-red-500 to-rose-600 bg-gradient-to-br"
                isLoading={isLoading}
              />
              <SummaryCard
                title="📦 HTTP Requests"
                value={
                  parsedStats[
                    "http_reqs..............................................................."
                  ] || "N/A"
                }
                subtitle="จำนวนคำขอทั้งหมด"
                bgColor="from-blue-400 via-sky-500 to-blue-600 bg-gradient-to-br"
                isLoading={isLoading}
              />
              <SummaryCard
                title="⏱️ Avg Duration"
                value={
                  parsedStats[
                    "http_req_duration......................................................."
                  ]?.match(/avg=([\d.]+ms)/)?.[1] || "N/A"
                }
                subtitle="เวลาเฉลี่ยในการตอบสนอง"
                bgColor="from-yellow-300 via-amber-400 to-orange-400 bg-gradient-to-br"
                isLoading={isLoading}
              />
              <SummaryCard
                title="🔁 Iterations"
                value={
                  parsedStats[
                    "iterations.............................................................."
                  ]?.split(" ")[0] || "N/A"
                }
                subtitle="จำนวนรอบการทำซ้ำ"
                bgColor="from-purple-400 via-violet-500 to-indigo-600 bg-gradient-to-br"
                isLoading={isLoading}
              />
              <SummaryCard
                title="📊 Throughput"
                value={
                  parsedStats["checks_total......................."]?.split(
                    " "
                  )[1] || "N/A"
                }
                subtitle="จำนวนการตรวจสอบต่อวินาที"
                bgColor="from-fuchsia-400 via-pink-500 to-rose-500 bg-gradient-to-br"
                isLoading={isLoading}
              />
            </div>
          </ContentCard>
        </>
      )}

      <ContentCard title="📜 รายงาน Log จากเซิร์ฟเวอร์" size="xl" fullWidth>
        <LogViewer
          output={output}
          expandedLines={expandedLines}
          setExpandedLines={setExpandedLines}
        />
      </ContentCard>

      {showMetrics && metrics.length > 0 && (
        <ContentCard
          title="📈 สรุปผลการทดสอบ (Metrics Report)"
          size="xl"
          className="mt-4"
          fullWidth
        >
          <MetricsTable
            metrics={metrics}
            expandedLines={expandedLines}
            setExpandedLines={setExpandedLines}
          />
        </ContentCard>
      )}
    </DashboardLayout>
  );
}
