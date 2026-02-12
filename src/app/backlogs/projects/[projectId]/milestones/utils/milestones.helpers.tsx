import { Typography } from "antd";
import dayjs from "dayjs";

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
  value ? dayjs(value).format("DD/MM/YYYY") : "-";
