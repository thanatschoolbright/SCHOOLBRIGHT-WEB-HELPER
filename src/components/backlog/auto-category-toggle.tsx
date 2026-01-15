"use client";

import { Space, Switch, Typography, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { memo } from "react";

export type AutoCategoryToggleProps = {
  disabled?: boolean;
  enabled: boolean;
  onChange: (checked: boolean) => void;
};

//** ปุ่มสลับสำหรับสั่งให้ Gemini จัด Category ให้โดยอัตโนมัติ
function AutoCategoryToggleComponent({
  disabled,
  enabled,
  onChange,
}: AutoCategoryToggleProps) {
  return (
    <Space direction="vertical" size={4} style={{ minWidth: 220 }}>
      <Typography.Text strong className="flex items-center gap-1">
        วิเคราะห์หมวดหมู่ด้วย AI
        <Tooltip title="ระบบจะใช้ Gemini วิเคราะห์เนื้อหาของงาน และเลือกหมวดหมู่ที่เหมาะสมที่สุดให้โดยอัตโนมัติ">
          <InfoCircleOutlined className="text-gray-300 cursor-help" />
        </Tooltip>
      </Typography.Text>
      <Space align="center" size={12}>
        <Switch
          checked={enabled}
          disabled={disabled}
          onChange={onChange}
          checkedChildren="เปิด"
          unCheckedChildren="ปิด"
          style={{ backgroundColor: enabled ? "#1677ff" : undefined }}
        />
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          เลือกหมวดหมู่อัตโนมัติ
        </Typography.Text>
      </Space>
    </Space>
  );
}

const AutoCategoryToggle = memo(AutoCategoryToggleComponent);

export default AutoCategoryToggle;
