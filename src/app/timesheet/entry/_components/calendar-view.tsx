"use client";

import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Calendar,
  type CalendarProps,
  Card,
  Flex,
  Popover,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { CellRenderInfo } from "rc-picker/lib/interface";
import dayjs, { Dayjs } from "dayjs";
import React, { useMemo, useState } from "react";
import { TimesheetEntry } from "../types/timesheet-entry.types";

interface CalendarViewProps {
  /** ข้อมูล Timesheet ทั้งหมด */
  entries: TimesheetEntry[];
  /** ฟังก์ชันเมื่อคลิกที่ Entry */
  onEntryClick: (record: TimesheetEntry) => void;
}

/** Map สีตาม status */
const STATUS_COLOR_MAP: Record<string, string> = {
  IN_PROGRESS: "processing",
  DONE: "success",
  APPROVED: "cyan",
  REJECTED: "error",
  DRAFT: "default",
};

/**
 * Component แสดง Timesheet ในรูปแบบ Calendar View
 * Group ข้อมูลตามวัน แสดง hours รวม และ entries แต่ละรายการ
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onEntryClick,
}) => {
  const { token } = theme.useToken();
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  // Group entries ตามวัน (YYYY-MM-DD)
  const entriesByDate = useMemo(() => {
    const map: Record<string, TimesheetEntry[]> = {};
    entries.forEach((entry) => {
      const key = dayjs(entry.date).format("YYYY-MM-DD");
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    });
    return map;
  }, [entries]);

  // คำนวณ hours รวมต่อวัน
  const hoursByDate = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(entriesByDate).forEach(([date, dayEntries]) => {
      map[date] = dayEntries.reduce(
        (sum, e) => sum + Number(e.hours || 0),
        0,
      );
    });
    return map;
  }, [entriesByDate]);

  /** Render เนื้อหาในแต่ละ Cell ของ Calendar */
  const dateCellRender = (value: Dayjs, info: CellRenderInfo<Dayjs>): React.ReactNode => {
    if (info.type !== "date") return null;
    const key = value.format("YYYY-MM-DD");
    const dayEntries = entriesByDate[key] || [];
    const totalHours = hoursByDate[key] || 0;

    if (dayEntries.length === 0) return null;

    const isEnough = totalHours >= 8;

    const popoverContent = (
      <Flex vertical gap={8} style={{ maxWidth: 280 }}>
        <Flex justify="space-between" align="center">
          <Typography.Text strong style={{ fontSize: 13 }}>
            {value.format("DD MMMM BBBB")}
          </Typography.Text>
          <Tag
            color={isEnough ? "success" : "warning"}
            style={{ borderRadius: 8, margin: 0 }}
          >
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {totalHours.toFixed(1)} ชม.
          </Tag>
        </Flex>
        <div
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            paddingTop: 8,
          }}
        >
          <Flex vertical gap={6}>
            {dayEntries.map((entry) => {
              const statusLabel =
                STATUS_OPTIONS.find((s) => s.value === entry.status)
                  ?.label_th || entry.status;
              return (
                <Flex
                  key={entry.id}
                  gap={8}
                  align="flex-start"
                  style={{
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: token.colorBgLayout,
                    transition: "background 0.2s",
                  }}
                  onClick={() => onEntryClick(entry)}
                >
                  <ApartmentOutlined
                    style={{
                      color: token.colorPrimary,
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text
                      strong
                      ellipsis
                      style={{ fontSize: 12 }}
                    >
                      {entry.project_name}
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      ellipsis
                      style={{ fontSize: 11 }}
                    >
                      {entry.feature_name || "General Task"}
                    </Typography.Text>
                  </Flex>
                  <Flex vertical align="flex-end" gap={2} style={{ flexShrink: 0 }}>
                    <Typography.Text strong style={{ fontSize: 12, color: token.colorPrimary }}>
                      {Number(entry.hours).toFixed(1)}h
                    </Typography.Text>
                    <Tag
                      bordered={false}
                      color={STATUS_COLOR_MAP[entry.status] || "default"}
                      style={{ fontSize: 10, margin: 0, borderRadius: 4 }}
                    >
                      {statusLabel}
                    </Tag>
                  </Flex>
                </Flex>
              );
            })}
          </Flex>
        </div>
      </Flex>
    );

    return (
      <Popover
        content={popoverContent}
        trigger="click"
        placement="bottom"
        overlayStyle={{ zIndex: 1050 }}
      >
        <Flex
          vertical
          gap={2}
          style={{ cursor: "pointer", padding: "0 2px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* แถบสรุป hours รวมของวัน */}
          <Tooltip
            title={`รวม ${totalHours.toFixed(1)} ชม. | ${dayEntries.length} รายการ`}
          >
            <div
              style={{
                background: isEnough
                  ? token.colorSuccessBg
                  : token.colorWarningBg,
                border: `1px solid ${isEnough ? token.colorSuccessBorder : token.colorWarningBorder}`,
                borderRadius: 6,
                padding: "2px 6px",
                marginBottom: 2,
              }}
            >
              <Typography.Text
                strong
                style={{
                  fontSize: 11,
                  color: isEnough
                    ? token.colorSuccess
                    : token.colorWarning,
                }}
              >
                <ClockCircleOutlined style={{ marginRight: 3 }} />
                {totalHours.toFixed(1)} ชม.
              </Typography.Text>
            </div>
          </Tooltip>

          {/* แสดงรายการแรก 2 รายการ + badge สำหรับที่เหลือ */}
          {dayEntries.slice(0, 2).map((entry) => (
            <Badge
              key={entry.id}
              color={
                entry.status === "DONE"
                  ? "green"
                  : entry.status === "IN_PROGRESS"
                    ? "blue"
                    : entry.status === "APPROVED"
                      ? "cyan"
                      : entry.status === "REJECTED"
                        ? "red"
                        : "gray"
              }
              text={
                <Typography.Text
                  ellipsis
                  style={{ fontSize: 11, maxWidth: 100, display: "inline-block" }}
                >
                  {entry.project_name}
                </Typography.Text>
              }
            />
          ))}
          {dayEntries.length > 2 && (
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              +{dayEntries.length - 2} รายการ
            </Typography.Text>
          )}
        </Flex>
      </Popover>
    );
  };

  const headerRender: NonNullable<CalendarProps<Dayjs>["headerRender"]> = ({ value, onChange }) => {
    const monthLabel = value.format("MMMM BBBB");

    // คำนวณ hours รวมทั้งเดือนที่กำลังดูอยู่
    const monthKey = value.format("YYYY-MM");
    const monthTotalHours = Object.entries(hoursByDate)
      .filter(([date]) => date.startsWith(monthKey))
      .reduce((sum, [, h]) => sum + h, 0);

    const monthEntryCount = Object.entries(entriesByDate)
      .filter(([date]) => date.startsWith(monthKey))
      .reduce((sum, [, list]) => sum + list.length, 0);

    return (
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex align="center" gap={12}>
          <Button
            type="text"
            shape="circle"
            icon={<LeftOutlined />}
            onClick={() => {
              const prev = value.subtract(1, "month");
              setCurrentMonth(prev);
              onChange(prev);
            }}
          />
          <Typography.Title level={5} style={{ margin: 0 }}>
            {monthLabel}
          </Typography.Title>
          <Button
            type="text"
            shape="circle"
            icon={<RightOutlined />}
            onClick={() => {
              const next = value.add(1, "month");
              setCurrentMonth(next);
              onChange(next);
            }}
          />
          <Button
            size="small"
            type="text"
            onClick={() => {
              const today = dayjs();
              setCurrentMonth(today);
              onChange(today);
            }}
            style={{ color: token.colorPrimary, fontSize: 12 }}
          >
            วันนี้
          </Button>
        </Flex>

        {/* สรุป hours รวมของเดือน */}
        <Flex gap={8} align="center">
          <Tag color="blue" style={{ borderRadius: 8, margin: 0 }}>
            {monthEntryCount} รายการ
          </Tag>
          <Tag
            color={monthTotalHours >= 160 ? "success" : "warning"}
            style={{ borderRadius: 8, margin: 0 }}
          >
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            รวม {monthTotalHours.toFixed(1)} ชม.
          </Tag>
        </Flex>
      </Flex>
    );
  };

  return (
    <Card
      variant="outlined"
      styles={{ body: { padding: 0 } }}
      style={{
        margin: "24px 0",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        background: token.colorBgContainer,
      }}
    >
      <Calendar
        value={currentMonth}
        onChange={(date) => setCurrentMonth(date as Dayjs)}
        headerRender={headerRender as any}
        cellRender={dateCellRender as any}
        style={{ padding: "0 8px 16px" }}
      />
    </Card>
  );
};
