"use client";

import React from "react";
import { Card, theme, Typography } from "antd";

const { Text } = Typography;
const { useToken } = theme;

interface SummaryCardProps {
  title: string | React.ReactNode;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  subValue?: string | React.ReactNode;
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
      className="summary-card shadow-lg hover:shadow-2xl transition-all duration-500 h-full border-0 overflow-hidden relative group"
      style={{
        borderRadius: token.borderRadiusLG,
        background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        border: `2px solid ${color}30`,
      }}
      bodyStyle={{ padding: "24px", position: "relative", zIndex: 1 }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div
            className="h-4 rounded-lg w-2/3"
            style={{ backgroundColor: `${color}30` }}
          ></div>
          <div
            className="h-10 rounded-lg w-4/5"
            style={{ backgroundColor: `${color}20` }}
          ></div>
          <div
            className="h-3 rounded-lg w-1/2"
            style={{ backgroundColor: `${color}15` }}
          ></div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="mb-2">
              {typeof title === "string" ? (
                <Text
                  type="secondary"
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: `${color}`, opacity: 0.8 }}
                >
                  {title}
                </Text>
              ) : (
                title
              )}
            </div>
            <div className="mt-2 mb-3">
              <Text
                strong
                className="group-hover:scale-105 transition-transform duration-300 inline-block"
                style={{
                  fontSize: "36px",
                  lineHeight: 1.2,
                  color: color,
                  textShadow: `0 2px 8px ${color}20`,
                }}
              >
                {value}
              </Text>
            </div>
            {subValue && (
              <div className="mt-2">
                {typeof subValue === "string" ? (
                  <Text type="secondary" className="text-xs">
                    {subValue}
                  </Text>
                ) : (
                  subValue
                )}
              </div>
            )}
          </div>
          <div
            className="p-4 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              boxShadow: `0 8px 16px ${color}40`,
            }}
          >
            <span style={{ fontSize: "28px", color: "#fff" }}>{icon}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .summary-card {
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
};
