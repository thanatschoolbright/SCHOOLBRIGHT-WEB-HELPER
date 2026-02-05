"use client";

import { SummaryRecord } from "@/types/timesheet";
import {
  CloseCircleFilled,
  CrownFilled,
  SmileFilled,
  ThunderboltFilled,
  TrophyFilled,
  WarningFilled,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Card,
  ConfigProvider,
  Flex,
  Progress,
  Tag,
  theme,
  Typography,
} from "antd";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface RankCardProps {
  record: SummaryRecord;
  isCompact: boolean;
  isCurrentUser?: boolean;
  rank?: string;
  avatar_url?: string | null;
}

// --- Simplified Configuration ---
const rankConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  S: { color: "#D97706", icon: <ThunderboltFilled /> },
  A: { color: "#16A34A", icon: <CrownFilled /> },
  B: { color: "#2563EB", icon: <TrophyFilled /> },
  C: { color: "#EA580C", icon: <SmileFilled /> },
  D: { color: "#DC2626", icon: <WarningFilled /> },
  E: { color: "#475569", icon: <CloseCircleFilled /> },
};

export const RankCard: React.FC<RankCardProps> = ({
  record,
  isCompact,
  isCurrentUser = false,
  rank,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const config = rankConfig[record.rank] || rankConfig.E;
  const displayRank = rank || String(record.order);

  // คำนวณเปอร์เซ็นต์
  const progressPercent = useMemo(
    () =>
      record.expected_hours
        ? Math.min(100, (record.total_hours / record.expected_hours) * 100)
        : 0,
    [record.total_hours, record.expected_hours],
  );

  const cardContent = (
    <Card
      hoverable
      size="small"
      // ใช้ builtin styles prop ของ Ant Design 5.x
      styles={{
        body: { padding: isCompact ? token.paddingSM : token.paddingLG },
      }}
    >
      <Flex align="center" gap="middle">
        {/* 1. Rank Number (ใช้ Typography ในการคุมขนาด) */}
        {!isCompact && (
          <Flex vertical align="center" justify="center" gap={0}>
            <Text type="secondary" strong style={{ fontSize: 10 }}>
              RANK
            </Text>
            <Title level={4} style={{ margin: 0 }}>
              {displayRank}
            </Title>
          </Flex>
        )}

        {/* 2. Avatar with Icon Badge */}
        <Badge count={config.icon} offset={[-4, 32]} color={config.color}>
          <Avatar
            size={isCompact ? 40 : 48}
            src={record.avatar_url} // รองรับถ้ารูปมีมาใน record
            style={{
              backgroundColor: isCurrentUser
                ? token.colorPrimaryBg
                : token.colorFillAlter,
              color: isCurrentUser ? token.colorPrimary : config.color,
            }}
          >
            {record.full_name?.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>

        {/* 3. Main Content */}
        <Flex vertical flex={1} gap="small">
          {/* Row: Name & Progress Text */}
          <Flex justify="space-between" align="baseline">
            <Flex align="center" gap="x-small">
              <Text strong ellipsis>
                {record.nickname || record.full_name}
              </Text>
              {isCompact && (
                <Tag
                  color={config.color}
                  bordered={false}
                  style={{
                    marginLeft: 8,
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {record.rank}
                </Tag>
              )}
            </Flex>
            <Text strong style={{ color: config.color }}>
              {record.completion_rate.toFixed(0)}%
            </Text>
          </Flex>

          {/* Row: Subtitle & Hours */}
          <Flex justify="space-between">
            <Text
              type="secondary"
              ellipsis
              style={{ fontSize: token.fontSizeSM }}
            >
              {record.rank_description || t("no_info", "ไม่มีข้อมูล")}
            </Text>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {record.total_hours.toFixed(1)} /{" "}
              {record.expected_hours.toFixed(1)} {t("hr", "ชม.")}
            </Text>
          </Flex>

          {/* Progress Bar */}
          <Progress
            percent={progressPercent}
            strokeColor={config.color}
            showInfo={false}
            size="small"
          />
        </Flex>
      </Flex>
    </Card>
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            // ใช้ Token ในการคุม Border และ Shadow แทน CSS Object
            colorBorderSecondary: isCurrentUser
              ? token.colorPrimary
              : token.colorBorderSecondary,
            boxShadowTertiary: isCurrentUser
              ? `0 0 0 4px ${token.colorPrimaryBg}`
              : token.boxShadowTertiary,
          },
        },
      }}
    >
      {isCompact ? (
        cardContent
      ) : (
        <Badge.Ribbon text={`${record.rank} Grade`} color={config.color}>
          {cardContent}
        </Badge.Ribbon>
      )}
    </ConfigProvider>
  );
};

// สกัด Title มาใช้เพื่อความสวยงาม
const { Title } = Typography;
