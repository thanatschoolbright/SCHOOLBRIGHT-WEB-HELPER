import React from "react";
import {
  Card,
  Flex,
  Statistic,
  Progress,
  Typography,
  Tooltip,
  Skeleton,
  theme,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export type SummaryCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  iconBg?: string;
  percent?: number;
  suffix?: string;
  tooltip?: React.ReactNode;
  isLoading?: boolean;
};

/**
 * บัตรแสดงข้อมูลสรุป (Premium Design)
 * แสดงชื่อหัวข้อ ค่าสถิติ พร้อมไอคอนและแถบความคืบหน้า
 */
const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  iconBg,
  percent = 100,
  suffix,
  tooltip,
  isLoading = false,
}) => {
  const { token } = theme.useToken();

  const cardStyle: React.CSSProperties = {
    background: token.colorBgContainer,
    borderRadius: 16,
    border: `1px solid ${token.colorBorderSecondary}`,
    height: "100%",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
  };

  const cardHoverStyle = {
    transform: "translateY(-4px)",
    boxShadow: `0 12px 24px -4px ${token.colorPrimary}20, 0 8px 16px -8px ${token.colorPrimary}30`,
    borderColor: token.colorPrimary,
  };

  const iconBoxStyle = (c?: string, bg?: string): React.CSSProperties => ({
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    color: c || token.colorPrimary,
    background: bg || token.colorFillSecondary,
    transition: "all 0.3s ease",
  });

  if (isLoading) {
    return (
      <Card style={cardStyle} styles={{ body: { padding: 24 } }}>
        <Skeleton active paragraph={{ rows: 2 }} title={{ width: "60%" }} />
      </Card>
    );
  }

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={cardStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, cardHoverStyle);
        const iconBox = e.currentTarget.querySelector(
          ".icon-box",
        ) as HTMLElement;
        if (iconBox) {
          iconBox.style.transform = "rotate(5deg) scale(1.1)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = token.colorBorderSecondary;
        const iconBox = e.currentTarget.querySelector(
          ".icon-box",
        ) as HTMLElement;
        if (iconBox) {
          iconBox.style.transform = "rotate(0deg) scale(1)";
        }
      }}
    >
      <Flex justify="space-between" align="start">
        <Flex vertical gap={4}>
          <Tooltip title={tooltip || subtitle} placement="topLeft" arrow>
            <Text
              type="secondary"
              style={{ fontSize: 14, cursor: "help", fontWeight: 500 }}
            >
              {title}{" "}
              <InfoCircleOutlined style={{ fontSize: 10, opacity: 0.5 }} />
            </Text>
          </Tooltip>
          <Statistic
            value={value}
            valueStyle={{
              fontWeight: 700,
              fontSize: 32,
              color: token.colorText,
            }}
            suffix={
              suffix && (
                <span
                  style={{
                    fontSize: 14,
                    color: token.colorTextQuaternary,
                  }}
                >
                  {suffix}
                </span>
              )
            }
          />
        </Flex>
        {icon && (
          <div className="icon-box" style={iconBoxStyle(color, iconBg)}>
            {icon}
          </div>
        )}
      </Flex>
      <div style={{ marginTop: 16 }}>
        <Progress
          percent={percent}
          showInfo={false}
          strokeColor={color || token.colorPrimary}
          trailColor={token.colorFillSecondary}
          size="small"
        />
      </div>
    </Card>
  );
};

export default SummaryCard;
