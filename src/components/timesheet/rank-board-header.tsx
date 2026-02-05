"use client";

import { DatePicker, Flex, Space, Typography, theme } from "antd";
import { Dayjs } from "dayjs";
import React from "react";
import { useTranslation } from "react-i18next";

interface RankBoardHeaderProps {
  monthLabel: string;
  generatedAt: string | null;
  selectedMonth: Dayjs;
  onMonthChange: (date: Dayjs) => void;
  onRefresh: () => void; // แม้ไม่ได้ใช้ในส่วน UI นี้ แต่เก็บไว้ตาม Interface เดิม
  loading: boolean;
  isCompact: boolean;
}

/**
 * Component สำหรับส่วนหัวของบอร์ดอันดับ (Ant Design Optimized)
 */
export const RankBoardHeader: React.FC<RankBoardHeaderProps> = ({
  monthLabel,
  generatedAt,
  selectedMonth,
  onMonthChange,
  isCompact,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    // ใช้ Flex แทน Space เพื่อจัดการ Alignment และ Width 100% โดยไม่ต้องเขียน CSS
    <Flex justify="space-between" align="center" style={{ width: "100%" }}>
      {/* ส่วนด้านซ้าย: ข้อความเดือนและเวลาอัปเดต */}
      <Flex vertical>
        <Typography.Text
          strong
          style={{
            color: token.colorPrimary,
            fontSize: isCompact ? token.fontSizeSM : token.fontSize,
          }}
        >
          {monthLabel}
        </Typography.Text>

        {generatedAt && (
          <Typography.Text
            type="secondary"
            style={{ fontSize: token.fontSizeSM }}
          >
            {t("timesheet_components.last_updated", "อัปเดตล่าสุด")}{" "}
            {generatedAt}
          </Typography.Text>
        )}
      </Flex>

      {/* ส่วนด้านขวา: ตัวเลือกวันที่ */}
      <Space size={isCompact ? "small" : "middle"}>
        <DatePicker
          picker="month"
          allowClear={false}
          size={isCompact ? "small" : "middle"}
          value={selectedMonth}
          onChange={(value) => {
            if (value) onMonthChange(value);
          }}
          format="MMM BBBB"
        />
      </Space>
    </Flex>
  );
};
