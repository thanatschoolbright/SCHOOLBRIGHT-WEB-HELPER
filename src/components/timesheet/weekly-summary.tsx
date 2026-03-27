"use client";

import { CalendarOutlined } from "@ant-design/icons";
import {
  DatePicker,
  Divider,
  Flex,
  Progress,
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
import React, { useMemo } from "react";
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

  const color = useMemo(() => {
    if (isFuture) return token.colorTextQuaternary;
    if (item.totalHours >= targetHours) return token.colorSuccess;
    if (item.totalHours > 0) return token.colorWarning;
    if (isWeekend) return token.colorTextTertiary;
    return token.colorError;
  }, [item.totalHours, targetHours, isFuture, isWeekend, token]);

  const bg = useMemo(() => {
    if (isFuture) return "transparent";
    return addAlpha(color, isDark ? 0.15 : 0.08);
  }, [color, isFuture, isDark]);

  const border = useMemo(() => {
    if (isToday) return `2px solid ${token.colorPrimary}`;
    if (isFuture) return `1px dashed ${token.colorBorder}`;
    return `1px solid ${addAlpha(color, 0.3)}`;
  }, [isToday, isFuture, color, token]);

  return (
    <Tooltip
      title={
        <div style={{ padding: "4px" }}>
          <Typography.Text strong style={{ color: "#fff" }}>
            {dayDate.format("DD MMMM BBBB")}
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
            <span style={{ color: color }}>
              {item.totalHours} / {targetHours} ชม.
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>ความคืบหน้า:</span>
            <span>{item.percent}%</span>
          </div>
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
        }}
        className="hover:scale-105"
      >
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
          {Array.from({ length: 31 }).map((_, i) => (
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

  if (!monthly_summary?.length) return null;

  return (
    <div
      style={{
        width: "100%",
        padding: 24,
        background: token.colorBgContainer,
      }}
    >
      {/* Header Section */}
      <Flex
        align="center"
        justify="space-between"
        style={{ width: "100%", marginBottom: 24 }}
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
            <Space
              split={
                <Divider
                  type="vertical"
                  style={{ margin: "0 4px", height: 12 }}
                />
              }
              align="center"
            >
              <DatePicker
                picker="month"
                value={selected_date}
                onChange={(date) => date && on_date_change?.(date)}
                format="MMMM BBBB"
                allowClear={false}
                variant="borderless"
                size="small"
                style={{
                  padding: 0,
                  margin: 0,
                  height: "auto",
                  lineHeight: 1,
                }}
                className="month-picker-summary"
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                เป้าหมาย {targetHours} ชม./วัน
              </Typography.Text>
            </Space>
          </div>
        </Space>

        {stats && (
          <Space split={<Divider type="vertical" />} className="hidden sm:flex">
            <StatisticItem
              label="ชั่วโมงทั้งหมด"
              value={stats.totalHours.toFixed(1)}
              suffix={`/ ${stats.targetTotal}`}
              color={token.colorPrimary}
            />
            <StatisticItem
              label="วันที่ครบถ้วน"
              value={stats.completedDays}
              suffix={`/ ${stats.workingDays}`}
              color={token.colorSuccess}
            />
          </Space>
        )}
      </Flex>

      {/* Content Section */}
      <div style={{ padding: 0 }}>
        {/* Monthly Progress Bar */}
        {stats && (
          <div
            style={{
              marginBottom: 24,
              padding: "16px",
              background: token.colorFillAlter,
              borderRadius: 16,
            }}
          >
            <Flex
              justify="space-between"
              align="end"
              style={{ marginBottom: 8 }}
            >
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ความคืบหน้าของเดือนนี้
                </Typography.Text>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>
                  {stats.totalHours.toLocaleString()}{" "}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: "normal",
                      color: token.colorTextSecondary,
                    }}
                  >
                    ชั่วโมง
                  </span>
                </div>
              </div>
              <Tag
                color={stats.progress === 100 ? "success" : "processing"}
                style={{ borderRadius: 20, margin: 0 }}
              >
                {stats.progress}%
              </Tag>
            </Flex>
            <Progress
              percent={stats.progress}
              showInfo={false}
              strokeColor={{
                "0%": token.colorPrimary,
                "100%": token.colorSuccess,
              }}
              size={{ strokeWidth: 10 }}
            />
          </div>
        )}

        {/* Calendar Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."].map((day) => (
            <Typography.Text
              key={day}
              type="secondary"
              strong
              style={{ fontSize: 12 }}
            >
              {day}
            </Typography.Text>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
          }}
        >
          {/* Offset start of month */}
          {Array.from({
            length: (selected_date.startOf("month").day() + 6) % 7,
          }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {monthly_summary.map((item) => (
            <CompactDay
              key={item.dateKey}
              item={item}
              targetHours={targetHours}
              isDark={isDark}
              token={token}
            />
          ))}
        </div>

        {/* Legend */}
        <Flex gap={16} wrap="wrap" style={{ marginTop: 24, padding: "0 4px" }}>
          <LegendItem color={token.colorSuccess} label="ครบถ้วน" />
          <LegendItem color={token.colorWarning} label="ยังไม่ครบ" />
          <LegendItem color={token.colorError} label="ไม่ได้ลงเวลา" />
          <LegendItem color={token.colorTextQuaternary} label="เร็วๆ นี้" />
        </Flex>
      </div>
    </div>
  );
};

const StatisticItem = ({ label, value, suffix, color }: any) => (
  <div style={{ textAlign: "right" }}>
    <Typography.Text
      type="secondary"
      style={{ fontSize: 11, display: "block" }}
    >
      {label}
    </Typography.Text>
    <Typography.Text strong style={{ fontSize: 16, color }}>
      {value}{" "}
      <span style={{ fontSize: 11, color: "inherit", opacity: 0.7 }}>
        {suffix}
      </span>
    </Typography.Text>
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <Space size={4}>
    <div
      style={{ width: 10, height: 10, background: color, borderRadius: 3 }}
    />
    <Typography.Text style={{ fontSize: 11 }}>{label}</Typography.Text>
  </Space>
);

export type { MonthlySummaryProps as WeeklySummaryProps };
