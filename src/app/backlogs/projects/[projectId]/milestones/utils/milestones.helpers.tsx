"use client";

import { Typography } from "antd";

export const buildErrorContent = (message: string, errorStack?: string) => (
  <div className="flex flex-col gap-2">
    <Typography.Text>{message}</Typography.Text>
    {errorStack ? (
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer">View Details</summary>
        <pre className="whitespace-pre-wrap">{errorStack}</pre>
      </details>
    ) : null}
  </div>
);

export const formatDateDisplay = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";
