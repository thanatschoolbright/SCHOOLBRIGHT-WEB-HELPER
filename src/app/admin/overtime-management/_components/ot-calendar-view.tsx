"use client";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { CalendarOutlined, UnorderedListOutlined } from "@ant-design/icons";
import type { CalendarMode } from "antd/es/calendar/generateCalendar";
import {
  Badge,
  Button,
  Calendar,
  Card,
  Col,
  Drawer,
  Flex,
  Row,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CalendarOtItem {
  id: number;
  requester_name: string;
  requester_employee_code: string;
  department: string;
  status: string;
  request_date: string;
  descriptions?: { start_date?: string; end_date?: string }[];
}

interface DayOtSummary {
  approved: number;
  pending: number;
  rejected: number;
  paid: number;
  items: CalendarOtItem[];
}

type ViewMode = CalendarMode;

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; badgeStatus: "success" | "warning" | "error" | "processing" | "default" }
> = {
  approved: { color: "#52c41a", label: "อนุมัติแล้ว", badgeStatus: "success" },
  pending: { color: "#faad14", label: "รออนุมัติ", badgeStatus: "warning" },
  rejected: { color: "#ff4d4f", label: "ปฏิเสธ", badgeStatus: "error" },
  paid: { color: "#1677ff", label: "จ่ายเงินแล้ว", badgeStatus: "processing" },
};

// แปลงสถานะเป็น Tag สี
const StatusTag = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { color: "#d9d9d9", label: status, badgeStatus: "default" as const };
  return (
    <Tag color={cfg.color} style={{ fontSize: 11, margin: 0 }}>
      {cfg.label}
    </Tag>
  );
};

interface OtCalendarViewProps {
  onViewDetail?: (record: CalendarOtItem) => void;
}

/**
 * Calendar View แสดงรายการ OT รายวัน แบบ color-coded ตามสถานะ
 * รองรับ Drill-down คลิกวันเพื่อดูรายชื่อพนักงาน
 */
export default function OtCalendarView({ onViewDetail }: OtCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [calendarData, setCalendarData] = useState<Record<string, DayOtSummary>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode] = useState<ViewMode>("month");
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    date: string;
    items: CalendarOtItem[];
  }>({ open: false, date: "", items: [] });

  // โหลด OT ทั้งเดือนที่กำลังดูอยู่
  const loadMonthData = useCallback(async (month: Dayjs) => {
    setIsLoading(true);
    try {
      const from = month.startOf("month").toISOString();
      const to = month.endOf("month").toISOString();
      const res = await callApiService.post("/api/v1/timesheet/overtime/read", {
        limit: 500,
        offset: 0,
        from,
        to,
      });

      if (res?.data?.status !== 200) return;

      const records: CalendarOtItem[] = Array.isArray(res.data.data)
        ? res.data.data
        : [];

      // จัดกลุ่ม OT ตามวันที่ request_date
      const grouped: Record<string, DayOtSummary> = {};

      for (const item of records) {
        const dateKey = dayjs(item.request_date).format("YYYY-MM-DD");
        if (!grouped[dateKey]) {
          grouped[dateKey] = { approved: 0, pending: 0, rejected: 0, paid: 0, items: [] };
        }
        grouped[dateKey].items.push(item);
        const status = item.status as keyof DayOtSummary;
        if (status in grouped[dateKey] && status !== "items") {
          (grouped[dateKey][status] as number)++;
        }
      }

      setCalendarData(grouped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth, loadMonthData]);

  // นับ OT ทั้งหมดในเดือนแยกตามสถานะ สำหรับ Legend
  const monthlySummary = useMemo(() => {
    const summary = { approved: 0, pending: 0, rejected: 0, paid: 0, total: 0 };
    for (const day of Object.values(calendarData)) {
      summary.approved += day.approved;
      summary.pending += day.pending;
      summary.rejected += day.rejected;
      summary.paid += day.paid;
      summary.total += day.items.length;
    }
    return summary;
  }, [calendarData]);

  // Render Badge สีในแต่ละวันของ Calendar
  const dateCellRender = useCallback(
    (value: Dayjs) => {
      const dateKey = value.format("YYYY-MM-DD");
      const dayData = calendarData[dateKey];
      if (!dayData || dayData.items.length === 0) return null;

      const dots = (
        Object.entries(STATUS_CONFIG) as [
          keyof typeof STATUS_CONFIG,
          (typeof STATUS_CONFIG)[string],
        ][]
      )
        .filter(([key]) => dayData[key as keyof DayOtSummary] as number > 0)
        .map(([key, cfg]) => (
          <Badge
            key={key}
            color={cfg.color}
            count={(dayData[key as keyof DayOtSummary] as number)}
            size="small"
            style={{ fontSize: 10 }}
          />
        ));

      return (
        <Flex vertical gap={2} align="center">
          {dots}
        </Flex>
      );
    },
    [calendarData],
  );

  // คลิกที่วัน → เปิด Drawer แสดงรายชื่อ OT วันนั้น
  const handleSelectDate = useCallback(
    (value: Dayjs) => {
      const dateKey = dayjs(value.toString()).format("YYYY-MM-DD");
      const dayData = calendarData[dateKey];
      if (!dayData || dayData.items.length === 0) return;
      setDrawerState({
        open: true,
        date: dayjs(value.toString()).format("DD/MM/YYYY"),
        items: dayData.items,
      });
    },
    [calendarData],
  );

  // เปลี่ยนเดือนจาก Calendar header
  const handlePanelChange = useCallback((value: Dayjs) => {
    setCurrentMonth(dayjs(value.toString()));
  }, []);

  return (
    <>
      <Card
        styles={{ body: { padding: 16 } }}
        title={
          <Flex align="center" gap={8}>
            <UnorderedListOutlined style={{ fontSize: "1rem" }} />
            <Typography.Text strong>ปฏิทิน OT รายเดือน</Typography.Text>
          </Flex>
        }
        extra={
          <Flex align="center" gap={12}>
            {/* Legend */}
            {(Object.entries(STATUS_CONFIG) as [string, (typeof STATUS_CONFIG)[string]][]).map(
              ([, cfg]) => (
                <Flex key={cfg.label} align="center" gap={4}>
                  <Badge color={cfg.color} />
                  <Typography.Text style={{ fontSize: 12 }}>{cfg.label}</Typography.Text>
                </Flex>
              ),
            )}
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => loadMonthData(currentMonth)}
              loading={isLoading}
            >
              รีเฟรช
            </Button>
          </Flex>
        }
      >
        {/* สรุปจำนวน OT รายเดือน */}
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col span={6}>
            <Card size="small" styles={{ body: { padding: "6px 12px" } }}>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>ทั้งหมด</Typography.Text>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {monthlySummary.total} รายการ
              </Typography.Title>
            </Card>
          </Col>
          {(Object.entries(STATUS_CONFIG) as [string, (typeof STATUS_CONFIG)[string]][]).map(
            ([key, cfg]) => (
              <Col span={4} key={key}>
                <Card size="small" styles={{ body: { padding: "6px 12px" } }}>
                  <Typography.Text style={{ fontSize: 11, color: cfg.color }}>{cfg.label}</Typography.Text>
                  <Typography.Title level={5} style={{ margin: 0, color: cfg.color }}>
                    {monthlySummary[key as keyof typeof monthlySummary]}
                  </Typography.Title>
                </Card>
              </Col>
            ),
          )}
        </Row>

        <Spin spinning={isLoading}>
          <Calendar
            mode={viewMode}
            cellRender={(current, info) => {
              if (info.type === "date") return dateCellRender(dayjs(current.toString()));
              return null;
            }}
            onSelect={(value) => handleSelectDate(dayjs(value.toString()))}
            onPanelChange={(value) => handlePanelChange(dayjs(value.toString()))}
          />
        </Spin>
      </Card>

      {/* Drawer แสดงรายชื่อ OT ของวันที่เลือก */}
      <Drawer
        title={
          <Flex align="center" gap={8}>
            <CalendarOutlined />
            <span>รายการ OT วันที่ {drawerState.date}</span>
            <Tag>{drawerState.items.length} รายการ</Tag>
          </Flex>
        }
        open={drawerState.open}
        onClose={() => setDrawerState((prev) => ({ ...prev, open: false }))}
        width={480}
      >
        <Flex vertical gap={12}>
          {drawerState.items.map((item) => (
            <Card
              key={item.id}
              size="small"
              styles={{ body: { padding: 12 } }}
              hoverable={!!onViewDetail}
              onClick={() => onViewDetail?.(item)}
            >
              <Flex justify="space-between" align="flex-start">
                <Flex vertical gap={4}>
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {item.requester_name}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    รหัส: {item.requester_employee_code || "-"} · {item.department || "-"}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    OT #{item.id}
                  </Typography.Text>
                </Flex>
                <StatusTag status={item.status} />
              </Flex>
            </Card>
          ))}
          {drawerState.items.length === 0 && (
            <Typography.Text type="secondary">ไม่มีรายการ OT</Typography.Text>
          )}
        </Flex>
      </Drawer>
    </>
  );
}
