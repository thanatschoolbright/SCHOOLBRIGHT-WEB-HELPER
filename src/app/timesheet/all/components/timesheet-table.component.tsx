import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Progress,
  Empty,
  Button,
  message,
  Modal,
  Select,
  DatePicker,
  InputNumber,
  Steps,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import axios from "axios";
import { SummaryMetadata, SummaryRecord } from "../types/timesheet.types";
import {
  buildFullName,
  formatNickname,
  formatBreakdown,
  getPositionColor,
} from "../utils/timesheet.helpers";
import { StatusBadge } from "./status-badge.component";
import { fetchUserRanking } from "@/services/timesheet/find-ranking.service";

const { RangePicker } = DatePicker;

type TimesheetTableProps = {
  records: SummaryRecord[];
  loading: boolean;
  metadata?: SummaryMetadata | null;
  onRefetch?: () => void;
};

export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  records,
  loading,
  metadata,
  onRefetch,
}) => {
  const { t } = useTranslation("translate");
  const [filteredInfo, setFilteredInfo] = useState<
    Record<string, (string | number)[] | null>
  >({});
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | number>();
  const [selectedRange, setSelectedRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [manualHours, setManualHours] = useState<number | null>(null);
  const [autoFillProgress, setAutoFillProgress] = useState<
    {
      key: string;
      label: string;
      status: "wait" | "process" | "finish" | "error";
      description?: string;
    }[]
  >([]);
  const [rankingMap, setRankingMap] = useState<
    Record<string, { rank?: string | null; description?: string | null }>
  >({});

  const handleTableChange: TableProps<SummaryRecord>["onChange"] = (
    _pagination,
    filters
  ) => {
    setFilteredInfo(filters as Record<string, (string | number)[] | null>);
  };

  const workingDates = useMemo(() => {
    if (!metadata?.range) return [];
    const start = dayjs(metadata.range.start_date);
    const end = dayjs(metadata.range.end_date);
    if (!start.isValid() || !end.isValid()) return [];
    const days: string[] = [];
    let current = start;
    while (current.isBefore(end, "day") || current.isSame(end, "day")) {
      const day = current.day();
      if (day > 0 && day < 6) {
        days.push(current.format("YYYY-MM-DD"));
      }
      current = current.add(1, "day");
    }
    return days;
  }, [metadata]);

  const expectedHoursPerDay = useMemo(() => {
    if (metadata?.expected_hours_per_member && metadata?.working_days) {
      return metadata.expected_hours_per_member / metadata.working_days;
    }
    return 8;
  }, [metadata]);

  const handleAutoFill = async () => {
    setAutoFillOpen(true);
  };

  const handleSubmitAutoFill = async () => {
    if (!metadata) {
      message.error("ไม่พบช่วงวันที่สำหรับการกรอกอัตโนมัติ");
      return;
    }

    if (!selectedUser) {
      message.warning("กรุณาเลือกผู้ใช้");
      return;
    }

    const [start, end] = selectedRange;
    if (!start || !end) {
      message.warning("กรุณาเลือกช่วงวันที่");
      return;
    }

    const dates: string[] = [];
    let current = start.startOf("day");
    const endDay = end.startOf("day");
    while (current.isBefore(endDay, "day") || current.isSame(endDay, "day")) {
      if (current.day() > 0 && current.day() < 6) {
        dates.push(current.format("YYYY-MM-DD"));
      }
      current = current.add(1, "day");
    }

    const singleDay = dates.length === 1;

    setAutoFillLoading(true);
    try {
      const summaryResponse = await fetch(
        "/api/v1/timesheet/entry/check/summary",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_date: start.format("YYYY-MM-DD"),
            end_date: end.format("YYYY-MM-DD"),
          }),
        }
      );

      if (!summaryResponse.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลสรุปชั่วโมงได้");
      }

      const summaryBody = await summaryResponse.json();
      const summaryRecords: SummaryRecord[] = summaryBody?.data?.records ?? [];
      const summaryMeta: SummaryMetadata | null =
        summaryBody?.data?.metadata ?? null;

      const record = summaryRecords.find(
        (rec) => String(rec.admin_id) === String(selectedUser)
      );
      if (!record) {
        message.error("ไม่พบข้อมูลผู้ใช้ที่เลือก");
        return;
      }

      const perDay =
        summaryMeta?.expected_hours_per_member && summaryMeta?.working_days
          ? summaryMeta.expected_hours_per_member / summaryMeta.working_days
          : expectedHoursPerDay;

      const hoursByDate = new Map(
        record.breakdown.map((item) => [item.date, Number(item.hours) || 0])
      );

      const tasks: { date: string; hours: number }[] = [];
      dates.forEach((date) => {
        const existing = hoursByDate.get(date) ?? 0;
        const hours =
          singleDay && manualHours !== null && manualHours >= 0
            ? manualHours
            : Math.max(0, perDay - existing);
        if (hours > 0) {
          tasks.push({ date, hours: Number(hours.toFixed(2)) });
        }
      });

      if (!tasks.length) {
        message.info("ไม่มีวันที่ต้องกรอกเพิ่ม");
        return;
      }

      setAutoFillProgress(
        tasks.map((task, index) => ({
          key: `${task.date}-${index}`,
          label: `${task.date} • ${task.hours} ชม.`,
          status: "wait",
        }))
      );

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        setAutoFillProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "process" } : item
          )
        );
        await axios.post("/api/v1/timesheet/entry/automate-fill", {
          user_id: selectedUser,
          hours: task.hours,
          date: [task.date],
        });
        setAutoFillProgress((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: "finish", description: "สำเร็จ" }
              : item
          )
        );
      }
      message.success("อัปเดต Timesheet อัตโนมัติสำเร็จ");
      onRefetch?.();
      setAutoFillOpen(false);
    } catch (error: any) {
      console.error("[Timesheet][auto-fill]", error);
      const msg =
        error?.response?.data?.message_th ||
        error?.response?.data?.message_en ||
        error?.message ||
        "ไม่สามารถอัปเดต Timesheet อัตโนมัติได้";
      message.error(msg);
      setAutoFillProgress((prev) =>
        prev.map((item) =>
          item.status === "process"
            ? { ...item, status: "error", description: msg }
            : item
        )
      );
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleCloseModal = () => {
    setAutoFillOpen(false);
    setManualHours(null);
    setAutoFillProgress([]);
  };

  const singleDaySelected =
    selectedRange[0] &&
    selectedRange[1] &&
    selectedRange[0]!.isSame(selectedRange[1]!, "day");

  const userOptions = useMemo(
    () =>
      records.map((rec) => ({
        label: `${rec.full_name}${rec.nickname ? ` (${rec.nickname})` : ""}`,
        value: rec.admin_id,
      })),
    [records]
  );

  useEffect(() => {
    const loadRankings = async () => {
      if (!metadata || !records.length) return;
      const month = dayjs(metadata.range.start_date).format("MM");
      const year = dayjs(metadata.range.start_date).format("YYYY");
      try {
        const entries = await Promise.all(
          records.map(async (rec) => {
            try {
              const res = await fetchUserRanking({
                user_id: rec.admin_id,
                month,
                year,
                scope: "elapsed",
              });
              return {
                id: String(rec.admin_id),
                rank: res.record?.rank ?? null,
                description: res.record?.rank_description ?? null,
              };
            } catch {
              return { id: String(rec.admin_id), rank: null, description: null };
            }
          })
        );
        const map: Record<string, { rank?: string | null; description?: string | null }> = {};
        entries.forEach((item) => {
          map[item.id] = { rank: item.rank, description: item.description };
        });
        setRankingMap(map);
      } catch {
        // ignore ranking load errors
      }
    };
    loadRankings();
  }, [metadata, records]);

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
          <StatusBadge
            completionRate={record.completion_rate}
            rank={rankingMap[String(record.admin_id)]?.rank}
            description={rankingMap[String(record.admin_id)]?.description}
          />
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
      extra={
        <Button
          type="primary"
          onClick={handleAutoFill}
          loading={autoFillLoading}
          disabled={loading}
        >
          อัปเดต Timesheet โดยอัตโนมัติ
        </Button>
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

      <Modal
        title="อัปเดต Timesheet โดยอัตโนมัติ"
        open={autoFillOpen}
        onOk={handleSubmitAutoFill}
        onCancel={handleCloseModal}
        confirmLoading={autoFillLoading}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
      >
        <Space direction="vertical" size="middle" className="w-full">
          <div className="w-full">
            <Typography.Text strong>เลือกผู้ใช้</Typography.Text>
            <Select
              className="w-full mt-1"
              placeholder="เลือกผู้ใช้"
              options={userOptions}
              value={selectedUser}
              onChange={(value) => setSelectedUser(value)}
              showSearch
              optionFilterProp="label"
            />
          </div>

          <div className="w-full">
            <Typography.Text strong>เลือกวันที่</Typography.Text>
            <RangePicker
              className="w-full mt-1"
              value={selectedRange}
              onChange={(range) => setSelectedRange(range ?? [null, null])}
              allowClear
            />
          </div>

          <div className="w-full">
            <Typography.Text strong>
              ชั่วโมง (ใส่ได้เมื่อเลือกวันเดียว)
            </Typography.Text>
            <InputNumber
              className="w-full mt-1"
              placeholder="กรอกจำนวนชั่วโมง"
              min={0}
              step={0.25}
              value={manualHours ?? undefined}
              onChange={(value) => setManualHours(value ?? null)}
              disabled={!singleDaySelected}
            />
            {!singleDaySelected && (
              <Typography.Text type="secondary" className="text-xs">
                เมื่อเลือกหลายวัน ระบบจะคำนวณให้อัตโนมัติ
              </Typography.Text>
            )}
          </div>
        </Space>
        {autoFillProgress.length > 0 && (
          <div className="mt-4">
            <Typography.Text strong>สถานะการทำงาน</Typography.Text>
            <Steps
              direction="vertical"
              size="small"
              className="mt-2"
              items={autoFillProgress.map((item) => ({
                title: item.label,
                status: item.status,
                description: item.description,
              }))}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};
