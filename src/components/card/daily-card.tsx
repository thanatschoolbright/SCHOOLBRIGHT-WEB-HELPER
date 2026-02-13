"use client";

import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  FireFilled,
} from "@ant-design/icons";
import {
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
import React, { useMemo } from "react";

export interface DailySummaryItem {
  dateKey: string;
  displayDate: string;
  totalHours: number;
  percent: number;
  isCompleted: boolean;
  label: string;
}

interface DailyCardProps {
  item: DailySummaryItem;
  targetHours?: number;
  loading?: boolean;
}

const addAlpha = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const num = Number.parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith("rgb")) {
    const values = color
      .replace(/rgba?\(|\)|\s/g, "")
      .split(",")
      .slice(0, 3)
      .join(",");
    return `rgba(${values}, ${alpha})`;
  }
  return color;
};

export const DailyCard: React.FC<DailyCardProps> = ({
  item,
  targetHours = 8,
  loading = false,
}) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  const computedData = useMemo(() => {
    const today = dayjs();
    const dayDate = dayjs(item.dateKey);
    const isFutureDay = dayDate.isAfter(today, "day");

    let accentColor = token.colorError;
    let statusIcon = <ExclamationCircleFilled />;
    let statusLabel = "ยังไม่ครบ";
    let bgOpacity = isDark ? 0.15 : 0.05;
    let borderOpacity = isDark ? 0.3 : 0.1;

    if (isFutureDay) {
      accentColor = token.colorTextQuaternary;
      statusIcon = <ClockCircleFilled />;
      statusLabel = "เร็วๆ นี้";
    } else if (item.isCompleted) {
      accentColor = token.colorSuccess;
      statusIcon = <CheckCircleFilled />;
      statusLabel = "ครบถ้วน";
      bgOpacity = isDark ? 0.2 : 0.08;
    } else if (item.totalHours > 0) {
      accentColor = token.colorWarning;
      statusIcon = <ExclamationCircleFilled />;
      statusLabel = "กำลังลงเวลา";
    }

    const cardBackground = isDark
      ? `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${addAlpha(
          accentColor,
          0.05,
        )} 100%)`
      : `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${addAlpha(
          accentColor,
          0.02,
        )} 100%)`;

    return {
      isFutureDay,
      percentForBar: Math.min(item.percent, 100),
      remainingHours: Math.max(targetHours - item.totalHours, 0),
      surplusHours: Math.max(item.totalHours - targetHours, 0),
      accentColor,
      cardBackground,
      statusIcon,
      statusLabel,
      bgOpacity,
      borderOpacity,
    };
  }, [item, targetHours, token, isDark]);

  if (loading) {
    return (
      <div
        style={{
          background: token.colorBgContainer,
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 16,
          minWidth: 200,
          height: 140,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Flex justify="space-between">
            <Skeleton.Input active size="small" style={{ width: 80 }} />
            <Skeleton.Avatar active size="small" shape="circle" />
          </Flex>
          <Skeleton title={false} paragraph={{ rows: 2 }} active />
        </Space>
      </div>
    );
  }

  return (
    <div
      style={{
        minWidth: 200,
        background: computedData.cardBackground,
        borderRadius: 16,
        padding: "16px 14px 12px",
        border: `1px solid ${addAlpha(
          computedData.accentColor,
          computedData.borderOpacity,
        )}`,
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = addAlpha(
          computedData.accentColor,
          isDark ? 0.6 : 0.4,
        );
        e.currentTarget.style.backgroundColor = addAlpha(
          computedData.accentColor,
          isDark ? 0.1 : 0.03,
        );
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = addAlpha(
          computedData.accentColor,
          computedData.borderOpacity,
        );
        e.currentTarget.style.backgroundColor = isDark ? "transparent" : "";
      }}
    >
      {/* Decorative Accent Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: computedData.accentColor,
          opacity: 0.8,
        }}
      />

      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <Flex justify="space-between" align="start">
          <Flex vertical gap={2}>
            <Typography.Text
              strong
              style={{ fontSize: 14, color: token.colorTextHeading }}
            >
              {item.label}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CalendarOutlined style={{ fontSize: 11 }} />
              {item.displayDate}
            </Typography.Text>
          </Flex>

          <div
            style={{
              padding: 6,
              borderRadius: 10,
              background: addAlpha(
                computedData.accentColor,
                computedData.bgOpacity,
              ),
              color: computedData.accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            {computedData.statusIcon}
          </div>
        </Flex>

        <div>
          <Flex justify="space-between" align="end" style={{ marginBottom: 4 }}>
            <Flex vertical gap={0}>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                ก้าวหน้า
              </Typography.Text>
              <Typography.Text
                strong
                style={{ fontSize: 13, color: computedData.accentColor }}
              >
                {item.totalHours.toFixed(2)}{" "}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: token.colorTextSecondary,
                  }}
                >
                  / {targetHours} ชั่วโมง
                </span>
              </Typography.Text>
            </Flex>
            <Typography.Text
              strong
              style={{ fontSize: 11, color: computedData.accentColor }}
            >
              {Math.round(computedData.percentForBar)}%
            </Typography.Text>
          </Flex>

          <Progress
            percent={computedData.percentForBar}
            strokeColor={{
              "0%": computedData.accentColor,
              "100%": addAlpha(computedData.accentColor, 0.7),
            }}
            trailColor={
              isDark ? token.colorFillTertiary : token.colorFillSecondary
            }
            showInfo={false}
            size={{ strokeWidth: 6 }}
            strokeLinecap="round"
          />
        </div>

        <Flex align="center" style={{ minHeight: 20 }}>
          {computedData.isFutureDay ? (
            <Tag
              bordered={false}
              icon={<ClockCircleOutlined />}
              style={{
                borderRadius: 6,
                margin: 0,
                fontSize: 10,
                padding: "0 6px",
              }}
            >
              รอ
            </Tag>
          ) : computedData.remainingHours > 0 ? (
            <Flex align="center" gap={4}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: token.colorWarning,
                  boxShadow: `0 0 6px ${token.colorWarning}`,
                }}
              />
              <Typography.Text
                style={{ fontSize: 11, color: token.colorTextSecondary }}
              >
                ขาดอีก{" "}
                <b style={{ color: token.colorWarning }}>
                  {computedData.remainingHours.toFixed(2)}
                </b>{" "}
                ชม.
              </Typography.Text>
            </Flex>
          ) : computedData.surplusHours > 0 ? (
            <Tooltip title="ยอดเยี่ยม! คุณทำงานเกินเป้าหมาย">
              <Tag
                color="gold"
                bordered={false}
                icon={<FireFilled />}
                style={{
                  borderRadius: 6,
                  margin: 0,
                  padding: "0 8px",
                  fontWeight: 600,
                  fontSize: 11,
                  background: isDark ? "rgba(255, 215, 0, 0.15)" : "",
                }}
              >
                +{computedData.surplusHours.toFixed(2)} ชม.
              </Tag>
            </Tooltip>
          ) : (
            <Tag
              color="success"
              bordered={false}
              icon={<CheckCircleFilled />}
              style={{
                borderRadius: 6,
                margin: 0,
                padding: "0 8px",
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              ครบถ้วน
            </Tag>
          )}
        </Flex>
      </Space>
    </div>
  );
};
