import React from "react";
import { Card, Skeleton, Statistic, Typography, theme } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

interface TimesheetStatCardProps {
  //** หัวข้อของการ์ด */
  title: React.ReactNode;
  //** ค่าที่แสดง */
  value: number;
  //** หน่วย */
  suffix?: string;
  //** สี accent */
  color?: string;
  //** สถานะการโหลด */
  loading?: boolean;
  //** ข้อมูลเพิ่มเติม */
  description?: string;
  icon?: React.ReactNode;
}

export const TimesheetStatCard: React.FC<TimesheetStatCardProps> = ({
  title,
  value,
  suffix = "ชั่วโมง",
  color = "#1677ff",
  loading = false,
  description,
  icon,
}) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase === "#0B0F19";

  return (
    <Card
      loading={loading}
      style={{
        minWidth: 200,
        borderRadius: 24,
        border: `1px solid ${
          isDark ? token.colorBorderSecondary : `${color}15`
        }`,
        background: isDark
          ? `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${color}10 100%)`
          : `linear-gradient(135deg, #ffffff 0%, ${color}08 100%)`,
        boxShadow: isDark ? "none" : `0 10px 20px -5px ${color}15`,
        position: "relative",
        overflow: "hidden",
      }}
      styles={{
        body: { padding: "24px" },
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `${color}10`,
          filter: "blur(20px)",
        }}
      />
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          {/* ไอคอนและหัวข้อ */}
          <div style={{ marginBottom: 12 }}>
            <Typography.Text
              style={{
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: isDark
                  ? token.colorTextSecondary
                  : token.colorTextHeading,
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: 6,
                  borderRadius: 10,
                  background: `${color}15`,
                  color: color,
                }}
              >
                {icon || <ClockCircleOutlined />}
              </div>
              {title}
            </Typography.Text>
          </div>

          {/* ค่าสถิติ */}
          <Statistic
            value={value}
            suffix={suffix}
            valueStyle={{
              color,
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          />

          {/* คำอธิบาย */}
          {description && (
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 12,
                marginTop: 4,
                display: "block",
              }}
            >
              {description}
            </Typography.Text>
          )}
        </>
      )}
    </Card>
  );
};
