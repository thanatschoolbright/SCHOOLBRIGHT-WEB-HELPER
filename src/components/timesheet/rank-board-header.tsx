"use client";

import { Button, DatePicker, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import React from "react";

interface RankBoardHeaderProps {
  monthLabel: string;
  generatedAt: string | null;
  selectedMonth: Dayjs;
  onMonthChange: (date: Dayjs) => void;
  onRefresh: () => void;
  loading: boolean;
  isCompact: boolean;
}

/**
 * Component สำหรับส่วนหัวของบอร์ดอันดับ
 * @param props - Props ของ Component
 */
export const RankBoardHeader: React.FC<RankBoardHeaderProps> = ({
  monthLabel,
  generatedAt,
  selectedMonth,
  onMonthChange,
  onRefresh,
  loading,
  isCompact,
}) => {
  return (
    <Space
      style={{ width: "100%", justifyContent: "space-between" }}
      align="start"
    >
      <Space direction="vertical" size={isCompact ? 2 : 4}>
        <Typography.Text strong style={{ letterSpacing: 0.5 }}>
          อันดับการทำเวลาประจำเดือน
        </Typography.Text>
        <Typography.Text type="secondary">
          {monthLabel}
          {generatedAt ? ` · อัปเดตล่าสุด ${generatedAt}` : ""}
        </Typography.Text>
      </Space>
      <Space size={isCompact ? 4 : 8}>
        <DatePicker
          picker="month"
          allowClear={false}
          size={isCompact ? "small" : "middle"}
          value={selectedMonth}
          onChange={(value) => {
            if (value) {
              onMonthChange(value);
            }
          }}
        />
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          disabled={loading}
          size={isCompact ? "small" : "middle"}
        >
          รีเฟรช
        </Button>
      </Space>
    </Space>
  );
};
