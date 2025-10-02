"use client";

import { Space, Switch, Typography } from "antd";
import { memo } from "react";

export type AutoCategoryToggleProps = {
  disabled?: boolean;
  enabled: boolean;
  onChange: (checked: boolean) => void;
};

//** ปุ่มสลับสำหรับสั่งให้ Gemini จัด Category ให้โดยอัตโนมัติ
function AutoCategoryToggleComponent({ disabled, enabled, onChange }: AutoCategoryToggleProps) {
  return (
    <Space direction="vertical" size={4} style={{ minWidth: 220 }}>
      <Typography.Text strong>สรุปหมวดหมู่ด้วย Gemini</Typography.Text>
      <Space align="center" size={12}>
        <Switch
          checked={enabled}
          disabled={disabled}
          onChange={onChange}
          checkedChildren="เปิด"
          unCheckedChildren="ปิด"
          style={{ backgroundColor: enabled ? "#0c7ff2" : undefined }}
        />
        <Typography.Text type="secondary">
          เมื่อเปิด ระบบจะเลือกหมวดหมู่ที่เหมาะสมอัตโนมัติ
        </Typography.Text>
      </Space>
    </Space>
  );
}

const AutoCategoryToggle = memo(AutoCategoryToggleComponent);

export default AutoCategoryToggle;
