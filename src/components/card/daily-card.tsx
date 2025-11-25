"use client";

import {
  Progress,
  Space,
  Tag,
  theme,
  Typography,
  Skeleton,
  Tooltip,
} from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  FireFilled,
} from "@ant-design/icons";
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

  const computedData = useMemo(() => {
    const today = dayjs();
    const dayDate = dayjs(item.dateKey);
    const isFutureDay = dayDate.isAfter(today, "day");

    const neutralAccent = token.colorTextQuaternary;
    const successAccent = token.colorSuccess;
    const warningAccent = token.colorWarning;
    const errorAccent = token.colorError;

    let accentColor = errorAccent;
    let statusIcon = <ExclamationCircleFilled style={{ color: errorAccent }} />;
    let statusLabel = "Incomplete";
    let bgOpacity = 0.04;

    if (isFutureDay) {
      accentColor = neutralAccent;
      statusIcon = (
        <ClockCircleFilled style={{ color: token.colorTextTertiary }} />
      );
      statusLabel = "Upcoming";
    } else if (item.isCompleted) {
      accentColor = successAccent;
      statusIcon = <CheckCircleFilled style={{ color: successAccent }} />;
      statusLabel = "Completed";
      bgOpacity = 0.08;
    } else if (item.totalHours > 0) {
      accentColor = warningAccent;
      statusIcon = <ExclamationCircleFilled style={{ color: warningAccent }} />;
      statusLabel = "In Progress";
    }

    const cardBackground = `linear-gradient(145deg, ${
      token.colorBgContainer
    } 40%, ${addAlpha(accentColor, bgOpacity)} 100%)`;

    return {
      isFutureDay,
      percentForBar: Math.min(item.percent, 100),
      remainingHours: Math.max(targetHours - item.totalHours, 0),
      surplusHours: Math.max(item.totalHours - targetHours, 0),
      accentColor,
      cardBackground,
      statusIcon,
      statusLabel,
    };
  }, [item, targetHours, token]);

  if (loading) {
    return (
      /* Render ส่วน Loading State:
         ใช้ Skeleton แทนการใช้ Text ธรรมดา เพื่อให้ UI ดูลื่นไหลและ Modern 
         รักษาโครงสร้างความกว้างและความสูงให้ใกล้เคียงกับการ์ดจริงเพื่อลด Layout Shift
      */
      <div
        style={{
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 20,
          minWidth: 240,
          height: 156,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton.Input active size="small" style={{ width: 80 }} />
            <Skeleton.Button
              active
              size="small"
              shape="round"
              style={{ width: 60 }}
            />
          </div>
          <Skeleton paragraph={{ rows: 2 }} active />
        </Space>
      </div>
    );
  }

  return (
    /* Render ส่วน Main Card:
       ใช้ div ปรับแต่ง style เองแทน Card ของ AntD เพื่อรองรับ Custom Gradient Background
       และเพิ่ม transition สำหรับ hover interaction
    */
    <div
      style={{
        minWidth: 240,
        background: computedData.cardBackground,
        borderRadius: token.borderRadiusLG,
        // ใช้ Box Shadow แบบ Soft เงาฟุ้งเพื่อให้ดูลอยตัวและสะอาดตา
        boxShadow: `0 4px 20px ${addAlpha(token.colorTextBase, 0.05)}`,
        padding: 20,
        border: `1px solid ${addAlpha(computedData.accentColor, 0.2)}`,
        position: "relative",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        // Interaction: เมื่อเอาเมาส์วาง ให้การ์ดยกตัวขึ้นเล็กน้อยและเงาเข้มขึ้น
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 28px ${addAlpha(
          computedData.accentColor,
          0.15
        )}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 20px ${addAlpha(
          token.colorTextBase,
          0.05
        )}`;
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        {/* Header Section:
           แสดงข้อมูลวันที่และ Status Badge
           ใช้ Flexbox (justify-between) เพื่อดันข้อมูลไปชิดซ้าย-ขวา
        */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <Typography.Text strong style={{ fontSize: 16, display: "block" }}>
              {item.label}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              <ClockCircleFilled style={{ marginRight: 6, fontSize: 12 }} />
              {item.displayDate}
            </Typography.Text>
          </div>

          {/* Status Tag: ใช้สีที่คำนวณมา (accentColor) เพื่อให้ Badge ตรงกับ Theme ของการ์ด */}
          <Tag
            bordered={false}
            color={addAlpha(computedData.accentColor, 0.15)}
            style={{
              color: computedData.accentColor,
              marginRight: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 600,
              borderRadius: 12,
              padding: "2px 10px",
            }}
          >
            {computedData.statusIcon}
            {computedData.statusLabel}
          </Tag>
        </div>

        {/* Body Section: Progress Bar
           แสดงหลอดพลังงานการทำงาน ปรับ styling ให้ดูโค้งมน (strokeLinecap="round")
        */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ความคืบหน้า
            </Typography.Text>
            <Typography.Text strong style={{ color: computedData.accentColor }}>
              {item.totalHours.toFixed(2)} / {targetHours} ชม.
            </Typography.Text>
          </div>
          <Progress
            percent={computedData.percentForBar}
            strokeColor={computedData.accentColor}
            trailColor={token.colorFillSecondary}
            showInfo={false}
            strokeLinecap="round"
            size={["100%", 8]}
          />
        </div>

        {/* Footer Section: Contextual Message
           แสดงข้อความสรุปสถานะ เช่น ขาดอีกกี่ชั่วโมง หรือ ทำเกินเป้าหมาย (Overachieved)
           กรณี FutureDay จะแสดงข้อความสีจาง
        */}
        <div style={{ minHeight: 22 }}>
          {computedData.isFutureDay ? (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              รอการดำเนินการ
            </Typography.Text>
          ) : computedData.remainingHours > 0 ? (
            <Typography.Text type="warning" style={{ fontSize: 13 }}>
              ขาดอีก <b>{computedData.remainingHours.toFixed(2)}</b> ชม.
              ตามเป้าหมาย
            </Typography.Text>
          ) : computedData.surplusHours > 0 ? (
            <Tooltip title="ยอดเยี่ยม! คุณทำงานเกินเป้าหมาย">
              <Tag color="gold" style={{ border: "none", margin: 0 }}>
                <Space size={4}>
                  <FireFilled />
                  <span>
                    เกินเป้า +{computedData.surplusHours.toFixed(2)} ชม.
                  </span>
                </Space>
              </Tag>
            </Tooltip>
          ) : (
            <Typography.Text type="success" style={{ fontSize: 13 }}>
              ลงเวลาครบตามเป้าหมายแล้ว
            </Typography.Text>
          )}
        </div>
      </Space>
    </div>
  );
};
