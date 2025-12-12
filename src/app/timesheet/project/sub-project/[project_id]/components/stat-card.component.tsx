import React from "react";
import { Card, Statistic, Skeleton, Typography, theme } from "antd";

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  suffix,
  loading,
}) => {
  const { token } = theme.useToken();
  return (
    <Card
      className="shadow-sm hover:shadow-md transition-all duration-300 h-full"
      style={{ borderRadius: token.borderRadiusLG }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
        <Statistic
          title={<Text type="secondary">{title}</Text>}
          value={value}
          prefix={
            <span style={{ color, marginRight: 8, fontSize: 20 }}>{icon}</span>
          }
          suffix={
            suffix && (
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                {suffix}
              </Text>
            )
          }
          valueStyle={{ fontWeight: 700, color: token.colorTextHeading }}
        />
      </Skeleton>
    </Card>
  );
};
