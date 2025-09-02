export default function TableComponent({
  headers,
  rows,
  emptyMessage = "ไม่มีโปรเจคในรายการ",
  striped = false,
  hoverable = false,
  rowScale = 1.25,
}: Readonly<{
  headers: string[];
  rows: (string | number)[][];
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  rowScale?: number;
}>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
        <thead className="bg-gray-100 rounded-t-lg">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-4 text-left text-sm font-medium text-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={`bg-white divide-y divide-gray-100 ${
            striped ? "odd:bg-gray-50" : ""
          }`}
        >
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-4 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`transition-colors duration-200 transform transition-transform duration-200 ${
                  hoverable ? "hover:cursor-pointer" : ""
                }`}
                style={
                  hoverable
                    ? {
                        transition: "transform 0.2s",
                        transformOrigin: "center",
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (hoverable) {
                    (
                      e.currentTarget as HTMLElement
                    ).style.transform = `scale(${rowScale})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (hoverable) {
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }
                }}
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
