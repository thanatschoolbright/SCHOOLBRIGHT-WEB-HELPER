"use client";

import { Button, DatePicker, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <Space
      style={{ width: "100%", justifyContent: "space-between" }}
      align="center"
    >
      <Space direction="vertical" size={0}>
        <Typography.Text
          strong
          style={{ fontSize: isCompact ? 12 : 14, color: "#1677ff" }}
        >
          {monthLabel}
        </Typography.Text>
        {generatedAt && (
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            {t("timesheet_components.last_updated", "อัปเดตล่าสุด")}{" "}
            {generatedAt}
          </Typography.Text>
        )}
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
          format="MMM BBBB"
        />
      </Space>
    </Space>
  );
};
