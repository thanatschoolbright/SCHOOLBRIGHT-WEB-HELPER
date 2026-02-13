"use client";

import { EditOutlined, OpenAIOutlined } from "@ant-design/icons";
import { Flex, Switch, Typography, theme } from "antd";
import { memo } from "react";

export type AutoAiDescriptionToggleComponentProps = {
  disabled?: boolean;
  enabled: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  activeColor?: string;
};

function AutoAiDescriptionToggleComponent({
  disabled,
  enabled,
  onChange,
  label = "สรุปรายละเอียดด้วย AI",
  description = "ย่อเนื้อหาให้สั้นกระชับและคงใจความสำคัญ",
  activeColor = "#0c7ff2",
}: AutoAiDescriptionToggleComponentProps) {
  const { token } = theme.useToken();
  const isChatGPT = label.toLowerCase().includes("chatgpt");

  return (
    <div
      onClick={() => !disabled && onChange(!enabled)}
      style={{
        padding: "16px 20px",
        borderRadius: 12,
        border: `1px solid ${enabled ? (isChatGPT ? "#b7eb8f" : "#91caff") : token.colorBorderSecondary}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Flex align="center" justify="space-between">
        <Flex gap={12} align="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${enabled ? token.colorBorder : "transparent"}`,
              boxShadow: "none",
            }}
          >
            {isChatGPT ? (
              <OpenAIOutlined
                style={{
                  fontSize: 18,
                  color: enabled ? "#52c41a" : token.colorTextSecondary,
                }}
              />
            ) : (
              <EditOutlined
                style={{
                  fontSize: 18,
                  color: enabled ? activeColor : token.colorTextSecondary,
                }}
              />
            )}
          </div>
          <div>
            <Typography.Text strong style={{ fontSize: 14, display: "block" }}>
              {label}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 1 }}
            >
              {description}
            </Typography.Text>
          </div>
        </Flex>
        <Switch
          size="small"
          checked={enabled}
          disabled={disabled}
          onChange={(checked) => onChange(checked)}
          onClick={(_, e) => e.stopPropagation()}
        />
      </Flex>
    </div>
  );
}

const AutoAiDescriptionToggle = memo(AutoAiDescriptionToggleComponent);

export default AutoAiDescriptionToggle;
