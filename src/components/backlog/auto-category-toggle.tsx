"use client";

import { RobotOutlined } from "@ant-design/icons";
import { Flex, Switch, Typography, theme } from "antd";
import { memo } from "react";

export type AutoCategoryToggleProps = {
  disabled?: boolean;
  enabled: boolean;
  onChange: (checked: boolean) => void;
};

function AutoCategoryToggleComponent({
  disabled,
  enabled,
  onChange,
}: AutoCategoryToggleProps) {
  const { token } = theme.useToken();

  return (
    <div
      onClick={() => !disabled && onChange(!enabled)}
      style={{
        padding: "20px 24px",
        borderRadius: 16,
        border: `1px solid ${enabled ? "#91caff" : token.colorBorderSecondary}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Flex align="center" justify="space-between">
        <Flex gap={16} align="center">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${enabled ? token.colorBorder : "transparent"}`,
              boxShadow: "none",
            }}
          >
            <RobotOutlined
              style={{
                fontSize: 24,
                color: enabled ? token.colorPrimary : token.colorTextSecondary,
              }}
            />
          </div>
          <div>
            <Typography.Text strong style={{ fontSize: 16, display: "block" }}>
              วิเคราะห์หมวดหมู่ (Gemini)
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 13, display: "block", marginTop: 2 }}
            >
              จำแนกประเภทงานอัตโนมัติจากเนื้อหา
            </Typography.Text>
          </div>
        </Flex>
        <Switch
          checked={enabled}
          disabled={disabled}
          onChange={(checked) => onChange(checked)}
          onClick={(_, e) => e.stopPropagation()}
        />
      </Flex>
    </div>
  );
}

const AutoCategoryToggle = memo(AutoCategoryToggleComponent);

export default AutoCategoryToggle;
