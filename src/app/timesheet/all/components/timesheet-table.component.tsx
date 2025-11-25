import React, { useMemo, useState } from "react";
import { Card, Table, Typography, Space, Tag, Progress, Empty } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { SummaryRecord } from "../types/timesheet.types";
import {
  buildFullName,
  formatNickname,
  formatBreakdown,
  getPositionColor,
} from "../utils/timesheet.helpers";
import { StatusBadge } from "./status-badge.component";

type TimesheetTableProps = {
  records: SummaryRecord[];
  loading: boolean;
};

export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  records,
  loading,
}) => {
  const { t } = useTranslation("translate");
  const [filteredInfo, setFilteredInfo] = useState<
    Record<string, (string | number)[] | null>
  >({});

  const handleTableChange: TableProps<SummaryRecord>["onChange"] = (
    _pagination,
    filters
  ) => {
    setFilteredInfo(filters as Record<string, (string | number)[] | null>);
  };

  const columns: ColumnsType<SummaryRecord> = useMemo(
    () => [
      {
        title: t("timesheet_page.table_rank"),
        dataIndex: "rank",
        width: 80,
        align: "center",
        render: (rank: number) => (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 font-bold text-blue-600">
            {rank}
          </div>
        ),
      },
      {
        title: t("timesheet_page.table_grade"),
        key: "grade",
        align: "center",
        width: 120,
        render: (_value, record) => (
          <StatusBadge completionRate={record.completion_rate} />
        ),
      },
      {
        title: t("timesheet_page.table_name"),
        key: "name",
        dataIndex: "full_name",
        filters: records.map((rec) => ({
          text: buildFullName(rec),
          value: rec.full_name,
        })),
        onFilter: (value, record) => record.full_name === value,
        filteredValue: filteredInfo.full_name || null,
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong className="text-base">
              {buildFullName(record)} {formatNickname(record.nickname)}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-xs">
              {record.employee_code || "-"}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t("timesheet_page.table_position"),
        dataIndex: "position",
        key: "position",
        filters: Array.from(new Set(records.map((rec) => rec.position))).map(
          (pos) => ({ text: pos, value: pos })
        ),
        onFilter: (value, record) => record.position === value,
        filteredValue: filteredInfo.position || null,
        render: (position: string) => (
          <Tag
            color={getPositionColor(position)}
            className="rounded-md px-3 py-1"
          >
            {position}
          </Tag>
        ),
      },
      {
        title: t("timesheet_page.table_progress"),
        dataIndex: "progress_text",
        key: "progress_text",
        width: 250,
        render: (_value, record) => (
          <Space direction="vertical" size={4} className="w-full">
            <Progress
              percent={Number(record.completion_rate.toFixed(2))}
              status={record.completion_rate >= 100 ? "success" : "active"}
              strokeColor={{
                "0%": record.completion_rate >= 100 ? "#52c41a" : "#1890ff",
                "100%": record.completion_rate >= 100 ? "#73d13d" : "#40a9ff",
              }}
            />
            <Typography.Text type="secondary" className="text-xs">
              {record.progress_text}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t("timesheet_page.table_status"),
        dataIndex: "status_label",
        key: "status_label",
        render: (status: string) => (
          <Tag
            color={status.includes("ขาด") ? "volcano" : "green"}
            className="rounded-md px-3 py-1"
          >
            {status}
          </Tag>
        ),
      },
      {
        title: t("timesheet_page.table_email"),
        dataIndex: "email",
        key: "email",
        render: (value?: string | null) => (
          <Typography.Text className="text-sm">{value || "-"}</Typography.Text>
        ),
      },
      {
        title: t("timesheet_page.table_phone"),
        dataIndex: "tel",
        key: "tel",
        render: (value?: string | null) => (
          <Typography.Text className="text-sm">{value || "-"}</Typography.Text>
        ),
      },
    ],
    [records, filteredInfo, t]
  );

  return (
    <Card
      title={
        <Typography.Title level={4} className="!mb-0">
          {t("timesheet_page.table_title")}
        </Typography.Title>
      }
      className="rounded-xl shadow-md border-0"
    >
      <Table<SummaryRecord>
        rowKey={(record) => String(record.admin_id)}
        columns={columns}
        dataSource={records}
        loading={loading}
        onChange={handleTableChange}
        className="timesheet-table"
        rowClassName={(_, index) =>
          index % 2 === 0
            ? "bg-white hover:bg-blue-50 transition-colors duration-200"
            : "bg-gray-50 hover:bg-blue-50 transition-colors duration-200"
        }
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <Typography.Text strong className="block mb-2">
                {t("timesheet_page.breakdown_title")}
              </Typography.Text>
              <Space direction="vertical" size={6}>
                {formatBreakdown(record.breakdown).map((text, idx) => (
                  <Typography.Text key={idx} className="text-sm">
                    • {text}
                  </Typography.Text>
                ))}
              </Space>
            </div>
          ),
          rowExpandable: (record) => record.breakdown.length > 0,
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total) => t("timesheet_page.total_records", { total }),
        }}
        locale={{
          emptyText: (
            <Empty
              image={
                <InboxOutlined style={{ fontSize: 64, color: "#bfbfbf" }} />
              }
              description={
                <Space direction="vertical" size="small">
                  <Typography.Text type="secondary">
                    {t("timesheet_page.no_data")}
                  </Typography.Text>
                </Space>
              }
            />
          ),
        }}
      />
    </Card>
  );
};
