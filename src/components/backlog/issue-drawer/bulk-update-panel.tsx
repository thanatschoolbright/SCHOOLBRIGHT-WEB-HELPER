"use client";

import AutoCategoryToggle from "@components/backlog/auto-category-toggle";
import {
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Typography,
  theme,
} from "antd";
import type { Dayjs } from "dayjs";
import type { OptionItem } from "./types";
import { useMemo } from "react";

export type BulkUpdatePanelProps = {
  autoCategoryEnabled: boolean;
  autoCategoryLoading: boolean;
  bulkCategoryIds: number[] | undefined;
  bulkDueDate: Dayjs | null | undefined;
  bulkMilestoneIds: number[] | undefined;
  bulkPriorityId: number | undefined;
  bulkStartDate: Dayjs | null | undefined;
  bulkStatusId: number | undefined;
  bulkUpdating: boolean;
  categoryOptions: OptionItem[];
  milestoneOptions: OptionItem[];
  onAutoCategoryChange: (checked: boolean) => void;
  onCategoryChange: (values: number[] | undefined) => void;
  onClear: () => void;
  onDueDateChange: (value: Dayjs | null | undefined) => void;
  onManageMilestone: () => void;
  onMilestoneChange: (values: number[] | undefined) => void;
  onPriorityChange: (value: number | undefined) => void;
  onStartDateChange: (value: Dayjs | null | undefined) => void;
  onStatusChange: (value: number | undefined) => void;
  onSubmit: () => void;
  priorityOptions: OptionItem[];
  selectedCount: number;
  statusOptions: OptionItem[];
  submitDisabled: boolean;
  showAutoCategoryToggle?: boolean;
};

//** กล่องควบคุมการอัปเดตแบบกลุ่ม (เลือก Status, Priority, Milestone, Category ฯลฯ)
export default function BulkUpdatePanel({
  autoCategoryEnabled,
  autoCategoryLoading,
  bulkCategoryIds,
  bulkDueDate,
  bulkMilestoneIds,
  bulkPriorityId,
  bulkStartDate,
  bulkStatusId,
  bulkUpdating,
  categoryOptions,
  milestoneOptions,
  onAutoCategoryChange,
  onCategoryChange,
  onClear,
  onDueDateChange,
  onManageMilestone,
  onMilestoneChange,
  onPriorityChange,
  onStartDateChange,
  onStatusChange,
  onSubmit,
  priorityOptions,
  selectedCount,
  statusOptions,
  submitDisabled,
  showAutoCategoryToggle = true,
}: BulkUpdatePanelProps) {
  const { token } = theme.useToken();
  const { colorBgContainer, colorBorderSecondary, colorBgBase } = token;
  const isDarkMode = colorBgBase?.toLowerCase() === "#141414";
  const cardStyle = useMemo(
    () => ({
      background: colorBgContainer,
      border: `1px solid ${colorBorderSecondary}`,
      borderRadius: 16,
      boxShadow: isDarkMode
        ? "0 12px 28px rgba(0,0,0,0.45)"
        : "0 12px 28px rgba(15, 23, 42, 0.06)",
    }),
    [colorBgContainer, colorBorderSecondary, isDarkMode]
  );

  return (
    <Card
      size="small"
      styles={{
        body: {
          padding: 12,
        },
      }}
      style={cardStyle}
      title={<Typography.Text strong>อัปเดตแบบกลุ่ม</Typography.Text>}
    >
      <Space align="center" size={8} wrap>
        <Typography.Text type="secondary">
          เลือกงานด้วย Checkbox เพื่ออัปเดตแบบกลุ่ม ({selectedCount})
        </Typography.Text>

        <Select
          allowClear
          options={statusOptions}
          placeholder="สถานะใหม่"
          style={{ minWidth: 200 }}
          value={bulkStatusId}
          onChange={(value) => onStatusChange(value as number | undefined)}
        />

        <Select
          allowClear
          options={priorityOptions}
          placeholder="ระดับความสำคัญใหม่"
          style={{ minWidth: 200 }}
          value={bulkPriorityId}
          onChange={(value) => onPriorityChange(value as number | undefined)}
        />

        <Space align="center" size={6}>
          <Select
            allowClear
            mode="multiple"
            options={milestoneOptions}
            placeholder="ไมล์สโตนใหม่"
            style={{ minWidth: 220 }}
            value={bulkMilestoneIds === undefined ? undefined : bulkMilestoneIds}
            onChange={(values) =>
              onMilestoneChange(
                Array.isArray(values) && values.length
                  ? (values as number[])
                  : []
              )
            }
          />
          <Button onClick={onManageMilestone}>จัดการไมล์สโตน</Button>
        </Space>

        {showAutoCategoryToggle ? (
          <AutoCategoryToggle
            disabled={autoCategoryLoading || bulkUpdating || !categoryOptions.length}
            enabled={autoCategoryEnabled}
            onChange={(checked) => onAutoCategoryChange(checked)}
          />
        ) : null}

        <Select
          allowClear
          disabled={autoCategoryEnabled}
          mode="multiple"
          options={categoryOptions}
          placeholder="หมวดหมู่ใหม่"
          style={{ minWidth: 220 }}
          value={bulkCategoryIds === undefined ? undefined : bulkCategoryIds}
          onChange={(values) =>
            onCategoryChange(
              Array.isArray(values) && values.length
                ? (values as number[])
                : []
            )
          }
        />

        <DatePicker
          allowClear
          placeholder="วันที่เริ่มต้น"
          style={{ minWidth: 160 }}
          value={bulkStartDate === undefined ? null : bulkStartDate}
          onChange={(value) => onStartDateChange(value ?? null)}
        />

        <DatePicker
          allowClear
          placeholder="วันที่ครบกำหนด"
          style={{ minWidth: 160 }}
          value={bulkDueDate === undefined ? null : bulkDueDate}
          onChange={(value) => onDueDateChange(value ?? null)}
        />

        <Space>
          <Button
            loading={bulkUpdating}
            type="primary"
            disabled={submitDisabled || (autoCategoryEnabled && !categoryOptions.length)}
            onClick={onSubmit}
          >
            อัปเดตแบบกลุ่ม
          </Button>
          <Button disabled={bulkUpdating} onClick={onClear}>
            ล้างค่า
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
