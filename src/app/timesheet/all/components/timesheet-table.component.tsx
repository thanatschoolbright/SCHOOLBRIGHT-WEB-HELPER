"use client";

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
  Modal,
  Select,
  DatePicker,
  InputNumber,
  Steps,
  Avatar,
  Flex,
} from "antd";
import { toast } from "sonner";
import type { ColumnsType, TableProps } from "antd/es/table";
import {
  UserOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  TrophyOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
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
const { Text } = Typography;

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

  // --- States ---
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
  const [autoFillProgress, setAutoFillProgress] = useState<any[]>([]);
  const [rankingMap, setRankingMap] = useState<Record<string, any>>({});

  // --- Memos ---
  const userOptions = useMemo(
    () =>
      records.map((rec) => ({
        label: `${buildFullName(rec)} ${formatNickname(rec.nickname)}`,
        value: rec.admin_id,
      })),
    [records]
  );

  const expectedHoursPerDay = useMemo(() => {
    if (metadata?.expected_hours_per_member && metadata?.working_days) {
      return metadata.expected_hours_per_member / metadata.working_days;
    }
    return 8;
  }, [metadata]);

  // --- Ranking Loader ---
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
              return {
                id: String(rec.admin_id),
                rank: null,
                description: null,
              };
            }
          })
        );
        const map: any = {};
        entries.forEach((item) => {
          map[item.id] = { rank: item.rank, description: item.description };
        });
        setRankingMap(map);
      } catch (e) {
        console.error(e);
      }
    };
    loadRankings();
  }, [metadata, records]);

  // --- Handlers ---
  const handleTableChange: TableProps<SummaryRecord>["onChange"] = (
    _pagination,
    filters
  ) => {
    setFilteredInfo(filters as Record<string, (string | number)[] | null>);
  };

  const handleSubmitAutoFill = async () => {
    if (!metadata) return toast.error("ไม่พบข้อมูลช่วงวันที่");
    if (!selectedUser) return toast.error("กรุณาเลือกผู้ใช้");
    const [start, end] = selectedRange;
    if (!start || !end) return toast.error("กรุณาเลือกช่วงวันที่");

    setAutoFillLoading(true);
    try {
      const summaryResponse = await axios.post(
        "/api/v1/timesheet/entry/check/summary",
        {
          start_date: start.format("YYYY-MM-DD"),
          end_date: end.format("YYYY-MM-DD"),
        }
      );

      const userRecord = summaryResponse.data?.data?.records?.find(
        (rec: any) => String(rec.admin_id) === String(selectedUser)
      );

      if (!userRecord) throw new Error("ไม่พบข้อมูลผู้ใช้งานในระบบ");

      const tasks: { date: string; hours: number }[] = [];
      let current = start.startOf("day");
      const last = end.startOf("day");

      while (current.isBefore(last, "day") || current.isSame(last, "day")) {
        if (current.day() > 0 && current.day() < 6) {
          const dateStr = current.format("YYYY-MM-DD");
          const existingHours =
            userRecord.breakdown.find((b: any) => b.date === dateStr)?.hours ||
            0;
          const hoursToFill =
            start.isSame(end, "day") && manualHours !== null
              ? manualHours
              : Math.max(0, expectedHoursPerDay - existingHours);

          if (hoursToFill > 0)
            tasks.push({ date: dateStr, hours: hoursToFill });
        }
        current = current.add(1, "day");
      }

      if (tasks.length === 0) {
        toast.info("ไม่มีข้อมูลที่ต้องอัปเดตเพิ่มเติม");
        setAutoFillOpen(false);
        return;
      }

      setAutoFillProgress(
        tasks.map((t) => ({
          label: `${t.date} (${t.hours} ชม.)`,
          status: "wait",
        }))
      );

      for (let i = 0; i < tasks.length; i++) {
        setAutoFillProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "process" } : item
          )
        );
        await axios.post("/api/v1/timesheet/entry/automate-fill", {
          user_id: selectedUser,
          hours: tasks[i].hours,
          date: [tasks[i].date],
        });
        setAutoFillProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "finish" } : item
          )
        );
      }

      toast.success("อัปเดตข้อมูลสำเร็จ");
      onRefetch?.();
      setAutoFillOpen(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setAutoFillLoading(false);
    }
  };

  // --- Column Definitions ---
  const columns: ColumnsType<SummaryRecord> = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "rank",
        width: 70,
        align: "center",
        fixed: "left",
        render: (rank: number) => (
          <div className="relative inline-flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-gray-500 bg-opacity-10">
              {rank}
            </div>
            {rank <= 3 && (
              <TrophyOutlined className="absolute -top-2 -right-2 text-yellow-500 text-xs" />
            )}
          </div>
        ),
      },
      {
        title: "ชื่อ-นามสกุล",
        key: "name",
        width: 280,
        fixed: "left",
        render: (_value, record) => (
          <Space size={12}>
            <Avatar
              src={record.image_profile}
              icon={<UserOutlined />}
              size={42}
              className="border border-solid border-gray-500 border-opacity-10 shadow-sm"
            />
            <div className="flex flex-col">
              <Text strong className="text-sm leading-tight">
                {buildFullName(record)}
              </Text>
              <Text type="secondary" className="text-xs">
                {formatNickname(record.nickname)} •{" "}
                {record.employee_code || "N/A"}
              </Text>
            </div>
          </Space>
        ),
      },
      {
        title: "เกรด",
        key: "grade",
        align: "center",
        width: 100,
        render: (_value, record) => (
          <StatusBadge
            completionRate={record.completion_rate}
            rank={rankingMap[String(record.admin_id)]?.rank}
            description={rankingMap[String(record.admin_id)]?.description}
          />
        ),
      },
      {
        title: "ความคืบหน้า",
        dataIndex: "completion_rate",
        key: "completion_rate",
        width: 220,
        render: (percent, record) => {
          const isDone = percent >= 100;
          return (
            <div className="flex flex-col gap-1">
              <Progress
                percent={Number(percent.toFixed(1))}
                size="small"
                strokeColor={isDone ? "#22c55e" : "#3b82f6"}
                showInfo={false}
                trailColor="rgba(128, 128, 128, 0.1)"
              />
              <Flex justify="space-between">
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {record.progress_text}
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 10,
                    color: isDone ? "#22c55e" : "#3b82f6",
                  }}
                >
                  {percent.toFixed(1)}%
                </Text>
              </Flex>
            </div>
          );
        },
      },
      {
        title: "ตำแหน่ง",
        dataIndex: "position",
        key: "position",
        width: 150,
        filters: Array.from(new Set(records.map((rec) => rec.position))).map(
          (pos) => ({ text: pos, value: pos })
        ),
        onFilter: (value, record) => record.position === value,
        render: (position: string) => (
          <Tag
            color={getPositionColor(position)}
            className="border-0 rounded-full px-3 text-[10px] uppercase font-bold tracking-wider"
          >
            {position}
          </Tag>
        ),
      },
      {
        title: "ข้อมูลติดต่อ",
        key: "contact",
        width: 200,
        render: (_, record) => (
          <div className="flex flex-col gap-1">
            <Text type="secondary" className="text-[11px] truncate w-40">
              <MailOutlined className="mr-1" /> {record.email || "-"}
            </Text>
            <Text type="secondary" className="text-[11px]">
              <PhoneOutlined className="mr-1" /> {record.tel || "-"}
            </Text>
          </div>
        ),
      },
      {
        title: "สถานะ",
        dataIndex: "status_label",
        key: "status_label",
        width: 120,
        render: (status: string) => {
          const isWarning = status.includes("ขาด");
          return (
            <Tag
              color={isWarning ? "volcano" : "green"}
              className="m-0 rounded-md border-0 bg-opacity-20"
              style={{
                backgroundColor: isWarning
                  ? "rgba(255, 77, 79, 0.1)"
                  : "rgba(82, 196, 26, 0.1)",
              }}
            >
              <span className="flex items-center gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWarning ? "bg-red-500" : "bg-green-500"
                  }`}
                />
                {status}
              </span>
            </Tag>
          );
        },
      },
    ],
    [records, rankingMap, t]
  );

  return (
    <Card
      className="border-0 shadow-sm rounded-xl overflow-hidden"
      extra={
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={() => setAutoFillOpen(true)}
          loading={autoFillLoading}
          className="shadow-sm border-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          shape="round"
        >
          เติมข้อมูลอัตโนมัติ
        </Button>
      }
    >
      <Table<SummaryRecord>
        rowKey={(record) => String(record.admin_id)}
        columns={columns}
        dataSource={records}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-4 mx-4 mb-4 rounded-xl border border-dashed border-gray-500 border-opacity-20 bg-gray-500 bg-opacity-5">
              <Flex align="center" gap={8} className="mb-3">
                <InfoCircleOutlined className="text-blue-500" />
                <Text strong className="text-xs uppercase tracking-widest">
                  รายละเอียดเวลาการทำงาน
                </Text>
              </Flex>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
                {formatBreakdown(record.breakdown).map((text, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[12px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-sm shadow-blue-500" />
                    <Text type="secondary">{text}</Text>
                  </div>
                ))}
              </div>
            </div>
          ),
          rowExpandable: (record) => record.breakdown.length > 0,
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          className: "px-4 pb-4",
          showTotal: (total) => (
            <Text type="secondary" className="text-xs">
              พบข้อมูลพนักงานทั้งหมด {total} รายการ
            </Text>
          ),
        }}
      />

      <Modal
        title={
          <Flex align="center" gap={8}>
            <ThunderboltOutlined className="text-yellow-500" />
            <span>อัปเดต Timesheet อัตโนมัติ</span>
          </Flex>
        }
        open={autoFillOpen}
        onOk={handleSubmitAutoFill}
        onCancel={() => setAutoFillOpen(false)}
        confirmLoading={autoFillLoading}
        width={500}
        centered
      >
        <Space direction="vertical" size="large" className="w-full mt-4">
          <Flex vertical gap={4}>
            <Text strong className="text-xs uppercase">
              1. เลือกพนักงาน
            </Text>
            <Select
              className="w-full"
              placeholder="ค้นหาชื่อพนักงาน..."
              options={userOptions}
              value={selectedUser}
              onChange={setSelectedUser}
              showSearch
              size="large"
            />
          </Flex>

          <Flex vertical gap={4}>
            <Text strong className="text-xs uppercase">
              2. ช่วงวันที่ต้องการเติมข้อมูล
            </Text>
            <RangePicker
              className="w-full"
              size="large"
              value={selectedRange}
              onChange={(r) => setSelectedRange(r ?? [null, null])}
            />
          </Flex>

          {selectedRange[0]?.isSame(selectedRange[1], "day") && (
            <Flex vertical gap={4}>
              <Text strong className="text-xs uppercase">
                3. จำนวนชั่วโมง (ระบุเองเฉพาะกรณีเลือกวันเดียว)
              </Text>
              <InputNumber
                className="w-full"
                placeholder="ตัวอย่าง: 8"
                min={0}
                max={24}
                value={manualHours}
                onChange={(v) => setManualHours(v)}
                size="large"
              />
            </Flex>
          )}

          {autoFillProgress.length > 0 && (
            <div className="p-4 rounded-lg bg-gray-500 bg-opacity-5 max-h-40 overflow-y-auto">
              <Steps
                direction="vertical"
                size="small"
                items={autoFillProgress.map((item) => ({
                  title: item.label,
                  status: item.status,
                }))}
              />
            </div>
          )}
        </Space>
      </Modal>
    </Card>
  );
};
