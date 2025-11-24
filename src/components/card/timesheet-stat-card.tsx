import React from "react";
import { Card, Skeleton, Statistic, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

interface TimesheetStatCardProps {
  //** หัวข้อของการ์ด */
  title: string;
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
  return (
    <Card
      loading={loading}
      style={{
        minWidth: 200,

        borderRadius: 12,
      }}
      styles={{
        body: { padding: "20px" },
      }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          {/* ไอคอนและหัวข้อ */}
          <div style={{ marginBottom: 8 }}>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {icon || <ClockCircleOutlined style={{ color }} />}
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
