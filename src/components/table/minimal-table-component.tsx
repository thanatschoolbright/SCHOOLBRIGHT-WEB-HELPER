"use client";

import React, {
  useEffect,
  useState,
  Children,
  isValidElement,
  cloneElement,
} from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

interface Column {
  key: string;
  label: string;
}

interface MinimalTableProps {
  data?: Record<string, any>[];
  header: Column[];
  rowsPerPage?: number;
  onRowsPerPageChange?: (value: number) => void;
  children: React.ReactNode;
  isLoading: boolean;
  hiddenProps?: boolean;
  rowRenderer?: (row: Record<string, any>, index: number) => React.ReactNode;
}

export default function MinimalTable({
  data = [],
  header,
  children,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange,
  isLoading,
  hiddenProps,
  rowRenderer,
}: Readonly<
  MinimalTableProps & {
    rowRenderer?: (row: Record<string, any>, index: number) => React.ReactNode;
  }
>) {
  const [sortedData, setSortedData] = useState(data);
  const [sortField, setSortField] = useState(header[0]?.key ?? "");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageProp ?? 10);

  useEffect(() => {
    setSortedData(data);
    setSortField(header[0]?.key ?? "");
    setSortOrder("asc");
    setCurrentPage(1);
  }, [JSON.stringify(data), header[0]?.key]);

  const handleSort = (field: string) => {
    if (!field) return; // กรณีกดคอลัมน์ No
    const nextOrder = sortOrder === "asc" ? "desc" : "asc";
    const copy = [...sortedData].sort((a, b) => {
      const aV = a[field]?.toString() ?? "";
      const bV = b[field]?.toString() ?? "";
      return nextOrder === "asc" ? aV.localeCompare(bV) : bV.localeCompare(aV);
    });
    setSortedData(copy);
    setSortField(field);
    setSortOrder(nextOrder);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginated = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-6 overflow-x-auto">
      <table className="w-full table-auto text-left">
        <thead>
          <tr>
            {/* คอลัมน์ No */}
            <th className="border-b p-4">No</th>
            {header.map(({ key, label }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="cursor-pointer border-b p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center justify-between">
                  <span>{label}</span>
                  {sortField === key &&
                    (sortOrder === "asc" ? <FiChevronUp /> : <FiChevronDown />)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: rowsPerPage }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-6" />
                  </td>
                  {header.map(({ key }, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            : rowRenderer
            ? paginated.map((row, idx) =>
                rowRenderer(row, (currentPage - 1) * rowsPerPage + idx + 1)
              )
            : (() => {
                const arr = Children.toArray(children).filter(
                  isValidElement
                ) as React.ReactElement[];
                return arr.slice(0, paginated.length).map((child, idx) =>
                  cloneElement(child, {
                    row: paginated[idx],
                    index: (currentPage - 1) * rowsPerPage + idx + 1,
                  })
                );
              })()}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        className={`flex justify-between items-center mt-4 text-sm text-gray-600 ${
          hiddenProps ? "hidden" : ""
        }`}
      >
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded disabled:opacity-40 ${
              hiddenProps ? "hidden" : ""
            }`}
          >
            Next
          </button>
        </div>
        <div className={`flex items-center gap-2 `}>
          <label>Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRowsPerPage(v);
              setCurrentPage(1);
              onRowsPerPageChange?.(v);
            }}
            className={`border rounded px-2 py-1 `}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
