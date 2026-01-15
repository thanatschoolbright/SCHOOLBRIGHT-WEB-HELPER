"use client";

import { Space, Switch, Typography, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { memo } from "react";

export type AutoAiDescriptionToggleComponentProps = {
  disabled?: boolean;
  enabled: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  activeColor?: string;
};

//** ปุ่มสลับสำหรับสั่งให้ AI สรุปรายละเอียดให้โดยอัตโนมัติ
function AutoAiDescriptionToggleComponent({
  disabled,
  enabled,
  onChange,
  label = "สรุปรายละเอียดด้วย AI",
  description = "เมื่อเปิด ระบบจะสรุปรายละเอียดให้อัตโนมัติ",
  activeColor = "#0c7ff2",
}: AutoAiDescriptionToggleComponentProps) {
  return (
    <Space direction="vertical" size={4} style={{ minWidth: 220 }}>
      <Typography.Text strong className="flex items-center gap-1">
        {label}
        <Tooltip title={description}>
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
          style={{ backgroundColor: enabled ? activeColor : undefined }}
        />
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {enabled ? "เปิดใช้งานระบบสรุป" : "ปิดระบบสรุป"}
        </Typography.Text>
      </Space>
    </Space>
  );
}

const AutoAiDescriptionToggle = memo(AutoAiDescriptionToggleComponent);

export default AutoAiDescriptionToggle;
