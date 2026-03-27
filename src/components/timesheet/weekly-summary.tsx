"use client";

import { CalendarOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Progress,
  Row,
  Skeleton,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

dayjs.extend(buddhistEra);
dayjs.locale("th");

import { DailySummaryItem } from "@components/card/daily-card";

interface MonthlySummaryProps {
  monthly_summary: DailySummaryItem[];
  targetHours?: number;
  loading?: boolean;
  stats?: {
    totalHours: number;
    completedDays: number;
    workingDays: number;
    targetTotal: number;
    progress: number;
  } | null;
  selected_date?: dayjs.Dayjs;
  on_date_change?: (date: dayjs.Dayjs) => void;
}

const addAlpha = (color: string, alpha: number) => {
  if (!color) return "";
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

/**
 * Compact Day Component for Calendar View
 */
const CompactDay: React.FC<{
  item: DailySummaryItem;
  targetHours: number;
  isDark: boolean;
  token: any;
}> = ({ item, targetHours, isDark, token }) => {
  const dayDate = dayjs(item.dateKey);
  const today = dayjs();
  const isToday = dayDate.isSame(today, "day");
  const isFuture = dayDate.isAfter(today, "day");
  const isWeekend = dayDate.day() === 0 || dayDate.day() === 6;

  const isOT = item.totalHours > targetHours;

  let color: string;
  if (isFuture) color = token.colorTextQuaternary;
  else if (item.totalHours > targetHours) color = token.colorSuccessActive; // OT สีเข้มกว่า
  else if (item.totalHours >= targetHours) color = token.colorSuccess;
  else if (item.totalHours > 0) color = token.colorWarning;
  else if (isWeekend) color = token.colorTextTertiary;
  else color = token.colorError;

  let bg: string;
  if (isFuture) bg = "transparent";
  else if (isOT) bg = addAlpha(token.colorSuccess, isDark ? 0.25 : 0.15); // OT พื้นหลังเข้มขึ้น
  else bg = addAlpha(color, isDark ? 0.15 : 0.08);

  let border: string;
  if (isToday) border = `2px solid ${token.colorPrimary}`;
  else if (isOT) border = `2px solid ${token.colorSuccess}`; // OT ขอบชัดขึ้น
  else if (isFuture) border = `1px dashed ${token.colorBorder}`;
  else border = `1px solid ${addAlpha(color, 0.3)}`;

  return (
    <Tooltip
      title={
        <div style={{ padding: "4px" }}>
          <Typography.Text strong style={{ color: "#fff" }}>
            {dayDate.format("DD MMMM BBBB")}{" "}
            {isOT && (
              <Tag
                color="success"
                style={{ border: "none", fontSize: 10, marginLeft: 4 }}
              >
                OT
              </Tag>
            )}
          </Typography.Text>
          <Divider
            style={{ margin: "8px 0", background: "rgba(255,255,255,0.2)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span>ชั่วโมงงาน:</span>
            <span
              style={{
                color: isOT ? token.colorSuccess : color,
                fontWeight: isOT ? 700 : 400,
              }}
            >
              {item.totalHours} / {targetHours} ชม.
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>ความคืบหน้า:</span>
            <span>{item.percent}%</span>
          </div>
          {isOT && (
            <div
              style={{ marginTop: 4, fontSize: 11, color: token.colorSuccess }}
            >
              * มีการทำ OT เกิน {targetHours} ชม.
            </div>
          )}
        </div>
      }
    >
      <div
        style={{
          aspectRatio: "1/1",
          background: bg,
          border: border,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
          boxShadow: isOT
            ? `0 4px 12px ${addAlpha(token.colorSuccess, 0.2)}`
            : "none",
        }}
        className="hover:scale-105"
      >
        {isOT && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "0 16px 16px 0",
              borderColor: `transparent ${token.colorSuccess} transparent transparent`,
              zIndex: 1,
            }}
          />
        )}
        <Typography.Text
          strong
          style={{
            fontSize: 14,
            color: isToday
              ? token.colorPrimary
              : isWeekend && !item.totalHours
                ? token.colorTextTertiary
                : token.colorText,
            zIndex: 1,
          }}
        >
          {item.label}
        </Typography.Text>

        {item.totalHours > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: 4,
              width: `${Math.min(item.percent, 100)}%`,
              background: color,
              borderRadius: "0 2px 2px 0",
            }}
          />
        )}

        {isToday && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              background: token.colorPrimary,
              borderRadius: "50%",
            }}
          />
        )}
      </div>
    </Tooltip>
  );
};

export const WeeklySummary: React.FC<MonthlySummaryProps> = ({
  monthly_summary,
  targetHours = 8,
  loading = false,
  stats: externalStats = null,
  selected_date = dayjs(),
  on_date_change,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";
  const [isCollapsed, setIsCollapsed] = useState(true);

  const stats = useMemo(() => {
    if (externalStats) return externalStats;
    if (!monthly_summary?.length) return null;
    const totalHours = monthly_summary.reduce(
      (acc, curr) => acc + curr.totalHours,
      0,
    );
    const completedDays = monthly_summary.filter(
      (d) => d.totalHours >= targetHours,
    ).length;
    const workingDays = monthly_summary.filter((d) => {
      const day = dayjs(d.dateKey).day();
      return day !== 0 && day !== 6;
    }).length;
    const targetTotal = workingDays * targetHours;
    const progress = Math.min(
      Math.round((totalHours / (targetTotal || 1)) * 100),
      100,
    );

    return { totalHours, completedDays, workingDays, targetTotal, progress };
  }, [monthly_summary, targetHours]);

  const calendarDays = useMemo(() => {
    if (!monthly_summary?.length) return [];
    if (!isCollapsed) return monthly_summary;

    // Is Collapsed: Show only current week + next week (total 14 items if possible)
    const today = dayjs();
    const currentWeekStart = today.startOf("week");
    const currentIndex = monthly_summary.findIndex((item) =>
      dayjs(item.dateKey).isSame(currentWeekStart, "day"),
    );

    if (currentIndex === -1) return monthly_summary.slice(0, 14);

    const start = Math.max(0, currentIndex);
    return monthly_summary.slice(start, start + 14);
  }, [monthly_summary, isCollapsed]);

  if (loading) {
    return (
      <div style={{ width: "100%", padding: 24 }}>
        <Skeleton.Input
          active
          size="small"
          style={{ width: 200, marginBottom: 24 }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton.Button
              key={i}
              active
              style={{
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 12,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        padding: 24,
        background: token.colorBgContainer,
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        style={{ width: "100%", marginBottom: 16 }}
      >
        <Space size="middle">
          <div
            style={{
              padding: "8px",
              background: token.colorPrimaryBg,
              borderRadius: "10px",
              color: token.colorPrimary,
              display: "flex",
            }}
          >
            <CalendarOutlined style={{ fontSize: 18 }} />
          </div>
          <div>
            <Typography.Text strong style={{ fontSize: 16, display: "block" }}>
              สรุปเวลาทำงานรายเดือน
            </Typography.Text>
          </div>
        </Space>
        <Space>
          <DatePicker
            picker="month"
            value={selected_date}
            onChange={(date) => date && on_date_change?.(date)}
            format="MMMM BBBB"
            allowClear={false}
            size="small"
          />
          <Button
            type="text"
            size="small"
            icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ borderRadius: 8, color: token.colorTextSecondary }}
          >
            {isCollapsed ? "ขยาย" : "หุบ"}
          </Button>
        </Space>
      </Flex>

      {!monthly_summary?.length ? (
        <Flex
          justify="center"
          align="center"
          style={{
            height: 120,
            background: token.colorFillAlter,
            borderRadius: 20,
          }}
        >
          <Typography.Text type="secondary">
            ไม่พบข้อมูลของเดือนนี้
          </Typography.Text>
        </Flex>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {calendarDays.map((item, i) => (
              <CompactDay
                key={i}
                item={item}
                targetHours={targetHours}
                isDark={isDark}
                token={token}
              />
            ))}
          </div>

          <Divider style={{ margin: "16px 0", opacity: 0.5 }} />

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Flex vertical gap={12}>
                <Flex justify="space-between">
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    ความคืบหน้าชั่วโมงงานทั้งหมด
                  </Typography.Text>
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {stats?.totalHours || 0} / {stats?.targetTotal || 0} ชม.
                  </Typography.Text>
                </Flex>
                <Progress
                  percent={stats?.progress || 0}
                  strokeColor={{
                    "0%": token.colorPrimary,
                    "100%": token.colorSuccess,
                  }}
                  trailColor={token.colorFillAlter}
                  size={["100%", 10]}
                />
              </Flex>
            </Col>
            <Col xs={24} md={12}>
              <Flex gap={12} justify="space-around">
                <Flex vertical align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    วันทำงาน
                  </Typography.Text>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {stats?.workingDays || 0}
                  </Typography.Text>
                </Flex>
                <Divider
                  type="vertical"
                  style={{ height: "100%", margin: 0 }}
                />
                <Flex vertical align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    เป้าหมายครบ (วัน)
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{ fontSize: 16, color: token.colorSuccess }}
                  >
                    {stats?.completedDays || 0}
                  </Typography.Text>
                </Flex>
                <Divider
                  type="vertical"
                  style={{ height: "100%", margin: 0 }}
                />
                <Flex vertical align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    ขาด (ชั่วโมง)
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 16,
                      color:
                        (stats?.targetTotal || 0) - (stats?.totalHours || 0) > 0
                          ? token.colorError
                          : token.colorSuccess,
                    }}
                  >
                    {Math.max(
                      0,
                      (stats?.targetTotal || 0) - (stats?.totalHours || 0),
                    )}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

WeeklySummary.displayName = "WeeklySummary";
