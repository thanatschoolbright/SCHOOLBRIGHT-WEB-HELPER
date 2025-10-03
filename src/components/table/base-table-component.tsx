export default function TableComponent({
  headers,
  rows,
  emptyMessage = "ไม่มีโปรเจคในรายการ",
  striped = false,
  rowScale = 1.25,
  alignments,
}: Readonly<{
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  emptyMessage?: string;
  striped?: boolean;
  rowScale?: number;
  alignments?: ("left" | "center" | "right")[];
}>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
        <thead className="bg-gray-100 dark:bg-gray-800 rounded-t-lg">
          <tr className="dark:text-gray-200">
            {headers.map((header, index) => {
              const alignment = alignments?.[index] || "left";
              const alignmentClass =
                alignment === "left"
                  ? "text-left"
                  : alignment === "center"
                  ? "text-center"
                  : "text-right";
              return (
                <th
                  key={index}
                  className={`px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-200 ${alignmentClass}`}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody
          className={`bg-white dark:bg-gray-900 divide-y divide-gray-100 ${
            striped ? "odd:bg-gray-50 dark:odd:bg-gray-800" : ""
          }`}
        >
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-4 text-center text-gray-400 dark:text-gray-300"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-transform duration-200 hover:scale-[1.02]"
              >
                {row.map((cell, cellIndex) => {
                  const alignment = alignments?.[cellIndex] || "left";
                  const alignmentClass =
                    alignment === "left"
                      ? "text-left"
                      : alignment === "center"
                      ? "text-center"
                      : "text-right";
                  return (
                    <td
                      key={cellIndex}
                      className={`px-4 py-4 ${alignmentClass} text-gray-900 dark:text-gray-300`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
