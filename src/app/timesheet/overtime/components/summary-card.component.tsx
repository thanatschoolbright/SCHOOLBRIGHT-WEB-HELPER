"use client";

import React from "react";
import { Card, theme, Typography } from "antd";

const { Text } = Typography;
const { useToken } = theme;

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  subValue?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  color,
  loading,
  subValue,
}) => {
  const { token } = useToken();

  return (
    <Card
      
      className="shadow-sm hover:shadow-md transition-all duration-300 h-full border-b-4"
      style={{ borderBottomColor: color, borderRadius: token.borderRadiusLG }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div>
            <Text
              type="secondary"
              className="text-sm font-medium uppercase tracking-wide"
            >
              {title}
            </Text>
            <div className="mt-1">
              <Text strong style={{ fontSize: "28px", lineHeight: 1.2 }}>
                {value}
              </Text>
            </div>
            {subValue && (
              <div className="mt-1">
                <Text type="secondary" className="text-xs">
                  {subValue}
                </Text>
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            <span style={{ fontSize: "24px" }}>{icon}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
