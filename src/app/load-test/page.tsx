"use client";
import { useState, useEffect, useRef } from "react";

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

export default function Page() {
  const [output, setOutput] = useState("");
  const MAX_LENGTH = 100;
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>(
    {}
  );
  const [showMetrics, setShowMetrics] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  const runTest = async () => {
    try {
      setShowMetrics(false);
      const response = await fetch("/api/v1/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: "authentication" }),
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
    } catch (error: any) {
      setOutput(`❌ Load test failed: ${error.message}`);
    }
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

  const metrics = parseMetrics(output);

  // Utility to format JSON string or return raw string with truncation and toggle support
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
        <pre className="whitespace-pre-wrap break-words text-gray-200">
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

  return (
    <div className="p-4">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full shadow-md backdrop-blur"
          title="ไปบนสุด"
        >
          ⬆️
        </button>
        <button
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full shadow-md backdrop-blur"
          title="ไปล่างสุด"
        >
          ⬇️
        </button>
      </div>
      <button
        onClick={runTest}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        🚀 รันทดสอบ K6
      </button>

      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-2">📜 Real-time Logs</h2>
        <pre className="bg-black text-sm text-white p-4 rounded max-h-[400px] overflow-y-auto whitespace-pre-wrap border border-gray-700">
          <div>
            {output.split("\n").map((line, idx) => {
              const colorClass =
                line.includes("❌") || line.toLowerCase().includes("error")
                  ? "text-red-400"
                  : line.includes("✅") ||
                    line.toLowerCase().includes("success")
                  ? "text-green-400"
                  : line.includes("⚠️") || line.toLowerCase().includes("warn")
                  ? "text-yellow-300"
                  : "text-gray-200";

              const formattedJson = extractJsonAndFormat(line);
              const isExpanded = expandedLines[idx] || false;

              const displayedLine =
                formattedJson &&
                !isExpanded &&
                formattedJson.length > MAX_LENGTH
                  ? formattedJson.slice(0, MAX_LENGTH) + "..."
                  : formattedJson || line;

              return (
                <div key={idx} className={colorClass}>
                  <div className="flex flex-col">
                    <pre className="whitespace-pre-wrap break-words">
                      {displayedLine}
                    </pre>
                    {formattedJson && formattedJson.length > MAX_LENGTH && (
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

      {showMetrics && metrics.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-2 mt-6">
            📈 Summary Report
          </h2>
          <div className="overflow-x-auto rounded shadow-lg border border-gray-700">
            <table className="min-w-full text-sm text-left text-gray-300 bg-gray-800">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wide"
                  >
                    📊 Metric
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wide"
                  >
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
      )}
    </div>
  );
}
