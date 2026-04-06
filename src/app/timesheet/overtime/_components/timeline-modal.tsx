"use client";

import {
  CalendarOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Flex,
  Modal,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useMemo, useState } from "react";
import { OT_STATUS, OvertimeRecord } from "../types/overtime.types";

dayjs.extend(buddhistEra);
dayjs.locale("th");

interface TimelineModalProps {
  visible: boolean;
  onClose: () => void;
  dataSource: OvertimeRecord[];
}

/** สีตาม status ของ OT */
const STATUS_BG_MAP: Record<string, string> = {
  pending: "#faad14",
  approved: "#52c41a",
  rejected: "#ff4d4f",
  paid: "#13c2c2",
  payment_failed: "#fa541c",
};

/** คำนวณ duration รวม (ชม.) จาก descriptions */
const calcTotalHours = (record: OvertimeRecord): number => {
  if (!record.descriptions?.length) return 0;
  return record.descriptions.reduce(
    (sum, d) => sum + Number(d.duration || 0),
    0,
  );
};

/** ดึงชื่อวันที่ OT ทั้งหมดจาก descriptions */
const getOtDates = (record: OvertimeRecord): string[] => {
  if (!record.descriptions?.length) return record.request_date ? [record.request_date] : [];
  return [
    ...new Set(
      record.descriptions
        .map((d) => d.date || d.startDate || "")
        .filter(Boolean),
    ),
  ];
};

/**
 * Timeline Modal — แสดง OT ทุกคนในรูปแบบ Gantt Timeline ตามวันที่ทำ OT
 * แกน X = วันที่ในเดือน, แกน Y = รายชื่อพนักงาน
 */
const TimelineModal: React.FC<TimelineModalProps> = ({
  visible,
  onClose,
  dataSource,
}) => {
  const { token } = theme.useToken();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  // สร้างรายชื่อวันในเดือนที่เลือก
  const daysInMonth = useMemo(() => {
    const count = selectedMonth.daysInMonth();
    return Array.from({ length: count }, (_, i) =>
      selectedMonth.date(i + 1),
    );
  }, [selectedMonth]);

  // กรอง records ที่มี OT ในเดือนที่เลือก
  const filteredRecords = useMemo(() => {
    const monthKey = selectedMonth.format("YYYY-MM");
    return dataSource.filter((record) => {
      const dates = getOtDates(record);
      return dates.some((d) => d.startsWith(monthKey)) ||
        (record.request_date || "").startsWith(monthKey);
    });
  }, [dataSource, selectedMonth]);

  // จัดกลุ่มตาม requester_id (1 แถว = 1 พนักงาน)
  const employeeRows = useMemo(() => {
    const map = new Map<string, { name: string; records: OvertimeRecord[] }>();
    filteredRecords.forEach((record) => {
      const key = String(record.requester_id || record.created_by || "unknown");
      const name =
        record.requester_name ||
        record.employee_name ||
        record.full_name ||
        `User ${key}`;
      if (!map.has(key)) map.set(key, { name, records: [] });
      map.get(key)!.records.push(record);
    });
    return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }));
  }, [filteredRecords]);

  // เช็คว่า record มี OT วันนั้นหรือไม่
  const hasOtOnDay = (record: OvertimeRecord, day: dayjs.Dayjs): boolean => {
    const dayKey = day.format("YYYY-MM-DD");
    const dates = getOtDates(record);
    if (dates.some((d) => d.startsWith(dayKey))) return true;
    // fallback: ใช้ request_date
    return (record.request_date || "").startsWith(dayKey);
  };

  const DAY_COL_WIDTH = 36;
  const NAME_COL_WIDTH = 160;

  const today = dayjs();
  const isToday = (day: dayjs.Dayjs) => day.isSame(today, "day");
  const isWeekend = (day: dayjs.Dayjs) => day.day() === 0 || day.day() === 6;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 1200, top: 24 }}
      styles={{
        body: { padding: 0 },
        header: {
          padding: "16px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
      title={
        <Flex align="center" gap={10}>
          <CalendarOutlined style={{ color: token.colorPrimary }} />
          <Typography.Title level={5} style={{ margin: 0 }}>
            Timeline OT รายคน
          </Typography.Title>
          <Tag color="blue" style={{ margin: 0 }}>
            {filteredRecords.length} รายการ
          </Tag>
        </Flex>
      }
    >
      {/* Header: Month Navigation */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: "12px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
        }}
      >
        <Flex align="center" gap={12}>
          <Button
            type="text"
            shape="circle"
            icon={<LeftOutlined />}
            onClick={() => setSelectedMonth((m) => m.subtract(1, "month"))}
          />
          <Typography.Title level={5} style={{ margin: 0, minWidth: 160, textAlign: "center" }}>
            {selectedMonth.format("MMMM BBBB")}
          </Typography.Title>
          <Button
            type="text"
            shape="circle"
            icon={<RightOutlined />}
            onClick={() => setSelectedMonth((m) => m.add(1, "month"))}
          />
          <Button
            size="small"
            type="text"
            style={{ color: token.colorPrimary, fontSize: 12 }}
            onClick={() => setSelectedMonth(dayjs())}
          >
            เดือนนี้
          </Button>
        </Flex>

        {/* Legend */}
        <Flex gap={12} align="center" wrap="wrap">
          {OT_STATUS.map((s) => (
            <Flex key={s.value} align="center" gap={4}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: STATUS_BG_MAP[s.value] || token.colorBorder,
                  flexShrink: 0,
                }}
              />
              <Typography.Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                {s.text}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      </Flex>

      {/* Timeline Grid */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "60vh" }}>
        {/* Column Headers (วันที่) */}
        <div
          style={{
            display: "flex",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* ช่องชื่อพนักงาน */}
          <div
            style={{
              minWidth: NAME_COL_WIDTH,
              width: NAME_COL_WIDTH,
              padding: "8px 12px",
              fontWeight: 700,
              fontSize: 12,
              color: token.colorTextSecondary,
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              position: "sticky",
              left: 0,
              background: token.colorBgContainer,
              zIndex: 11,
            }}
          >
            <Flex align="center" gap={4}>
              <UserOutlined />
              พนักงาน
            </Flex>
          </div>

          {/* วันที่แต่ละวัน */}
          {daysInMonth.map((day) => (
            <div
              key={day.format("DD")}
              style={{
                minWidth: DAY_COL_WIDTH,
                width: DAY_COL_WIDTH,
                textAlign: "center",
                padding: "4px 2px",
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                background: isToday(day)
                  ? token.colorPrimaryBg
                  : isWeekend(day)
                    ? token.colorBgLayout
                    : token.colorBgContainer,
              }}
            >
              <Typography.Text
                style={{
                  fontSize: 10,
                  fontWeight: isToday(day) ? 700 : 400,
                  color: isToday(day)
                    ? token.colorPrimary
                    : isWeekend(day)
                      ? token.colorTextQuaternary
                      : token.colorTextSecondary,
                  display: "block",
                }}
              >
                {day.format("dd")}
              </Typography.Text>
              <Typography.Text
                style={{
                  fontSize: 12,
                  fontWeight: isToday(day) ? 700 : 600,
                  color: isToday(day) ? token.colorPrimary : token.colorText,
                  display: "block",
                }}
              >
                {day.format("D")}
              </Typography.Text>
            </div>
          ))}
        </div>

        {/* Rows (แต่ละพนักงาน) */}
        {employeeRows.length === 0 ? (
          <Flex
            justify="center"
            align="center"
            style={{ padding: 48, color: token.colorTextQuaternary }}
          >
            <Typography.Text type="secondary">
              ไม่มีข้อมูล OT ในเดือนนี้
            </Typography.Text>
          </Flex>
        ) : (
          employeeRows.map((employee, rowIdx) => {
            // คำนวณ total hours รวมของพนักงานในเดือนนี้
            const totalMonthHours = employee.records.reduce(
              (sum, r) => sum + calcTotalHours(r),
              0,
            );

            return (
              <div
                key={employee.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  background:
                    rowIdx % 2 === 0
                      ? token.colorBgContainer
                      : token.colorBgLayout,
                  minHeight: 48,
                }}
              >
                {/* ชื่อพนักงาน */}
                <div
                  style={{
                    minWidth: NAME_COL_WIDTH,
                    width: NAME_COL_WIDTH,
                    padding: "8px 12px",
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    position: "sticky",
                    left: 0,
                    background:
                      rowIdx % 2 === 0
                        ? token.colorBgContainer
                        : token.colorBgLayout,
                    zIndex: 5,
                  }}
                >
                  <Flex align="center" gap={8}>
                    <Avatar
                      size={28}
                      style={{
                        background: token.colorPrimary,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {employee.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Flex vertical gap={0}>
                      <Typography.Text
                        ellipsis
                        style={{ fontSize: 12, fontWeight: 600, maxWidth: 100 }}
                      >
                        {employee.name}
                      </Typography.Text>
                      <Typography.Text
                        style={{ fontSize: 10, color: token.colorTextSecondary }}
                      >
                        <ClockCircleOutlined style={{ marginRight: 2 }} />
                        {totalMonthHours.toFixed(1)} ชม.
                      </Typography.Text>
                    </Flex>
                  </Flex>
                </div>

                {/* เซลล์แต่ละวัน */}
                {daysInMonth.map((day) => {
                  // ค้นหา records ที่มี OT วันนั้น
                  const dayRecords = employee.records.filter((r) =>
                    hasOtOnDay(r, day),
                  );
                  const hasOt = dayRecords.length > 0;
                  const firstRecord = dayRecords[0];

                  return (
                    <div
                      key={day.format("DD")}
                      style={{
                        minWidth: DAY_COL_WIDTH,
                        width: DAY_COL_WIDTH,
                        borderRight: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isToday(day)
                          ? token.colorPrimaryBg
                          : isWeekend(day)
                            ? `${token.colorWarningBg}55`
                            : "transparent",
                        position: "relative",
                      }}
                    >
                      {hasOt && firstRecord && (
                        <Tooltip
                          title={
                            <Flex vertical gap={4}>
                              <Typography.Text style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                                {day.format("D MMMM BBBB")}
                              </Typography.Text>
                              {dayRecords.map((r) => {
                                const statusInfo = OT_STATUS.find(
                                  (s) => s.value === r.status,
                                );
                                return (
                                  <Flex key={r.id} gap={6} align="center">
                                    <Badge
                                      color={statusInfo?.color || "gray"}
                                      text={
                                        <span style={{ color: "#fff", fontSize: 11 }}>
                                          {statusInfo?.text || r.status} •{" "}
                                          {calcTotalHours(r).toFixed(1)} ชม.
                                        </span>
                                      }
                                    />
                                  </Flex>
                                );
                              })}
                              {dayRecords.length > 1 && (
                                <Typography.Text style={{ color: "#fadb14", fontSize: 11 }}>
                                  ⚠️ OT ซ้ำ {dayRecords.length} รายการในวันเดียว
                                </Typography.Text>
                              )}
                            </Flex>
                          }
                          placement="top"
                        >
                          <div
                            style={{
                              width: DAY_COL_WIDTH - 6,
                              height: 28,
                              borderRadius: 6,
                              background:
                                STATUS_BG_MAP[firstRecord.status || ""] ||
                                token.colorPrimary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              position: "relative",
                              // เส้นขีดด้านล่างถ้ามีซ้ำ
                              outline:
                                dayRecords.length > 1
                                  ? `2px solid ${token.colorWarning}`
                                  : "none",
                            }}
                          >
                            <Typography.Text
                              style={{
                                color: "#fff",
                                fontSize: 9,
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            >
                              {calcTotalHours(firstRecord) > 0
                                ? `${calcTotalHours(firstRecord).toFixed(0)}h`
                                : "OT"}
                            </Typography.Text>
                            {/* Badge แสดงจำนวนซ้ำ */}
                            {dayRecords.length > 1 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: -6,
                                  right: -6,
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  background: token.colorWarning,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: "#fff",
                                }}
                              >
                                {dayRecords.length}
                              </div>
                            )}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary */}
      <Flex
        justify="flex-end"
        align="center"
        gap={16}
        style={{
          padding: "10px 24px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
        }}
      >
        <Typography.Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          <span style={{ color: token.colorWarning, marginRight: 4 }}>■</span>
          Weekend
        </Typography.Text>
        <Typography.Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          <span style={{ color: token.colorPrimary, marginRight: 4 }}>■</span>
          วันนี้
        </Typography.Text>
        <Typography.Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          กรอบสีเหลือง = OT ซ้ำในวันเดียวกัน
        </Typography.Text>
      </Flex>
    </Modal>
  );
};

export default TimelineModal;
