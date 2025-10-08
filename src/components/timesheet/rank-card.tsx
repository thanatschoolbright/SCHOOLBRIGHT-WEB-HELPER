"use client";

import {Avatar, Card, Progress, Space, Tag, theme, Typography} from "antd";
import {
    CloseCircleOutlined,
    CrownOutlined,
    SmileOutlined,
    ThunderboltOutlined,
    TrophyOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import React from "react";

import {SummaryRecord} from "@/types/timesheet";

interface RankCardProps {
    record: SummaryRecord;
    isCompact: boolean;
}

const rankAccentMap: Record<string, {
    color: string;
    tagColor?: string;
}> = {
    S: {color: "#166534", tagColor: "success"},
    A: {color: "#166534", tagColor: "success"},
    B: {color: "#1d4ed8", tagColor: "processing"},
    C: {color: "#f59e0b", tagColor: "warning"},
    D: {color: "#dc2626", tagColor: "error"},
    E: {color: "#7f1d1d", tagColor: "default"},
};

const fallbackAccent = {
    color: "#334155",
    tagColor: "default" as const,
};

const iconByRank: Record<string, React.ReactNode> = {
    S: <ThunderboltOutlined style={{color: "#166534"}}/>,
    A: <CrownOutlined style={{color: "#f59e0b"}}/>,
    B: <TrophyOutlined style={{color: "#1d4ed8"}}/>,
    C: <SmileOutlined style={{color: "#f59e0b"}}/>,
    D: <WarningOutlined style={{color: "#dc2626"}}/>,
    E: <CloseCircleOutlined style={{color: "#7f1d1d"}}/>,
};

const addAlpha = (hex: string, alpha: number) => {
    if (!hex?.startsWith("#")) return hex;
    let h = hex.slice(1);
    if (h.length === 3)
        h = h
            .split("")
            .map((c) => c + c)
            .join("");
    const num = parseInt(h, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatName = (record: SummaryRecord) => {
    if (record.nickname) {
        return `${record.nickname}`;
    }
    return record.full_name ?? "-";
};

const formatHoursLabel = (record: SummaryRecord) => {
    return `${record.total_hours.toFixed(2)} / ${record.expected_hours.toFixed(
        2
    )} ชม.`;
};

const formatCompletionLabel = (record: SummaryRecord) =>
    `${record.completion_rate.toFixed(0)}%`;

/**
 * Component สำหรับแสดงการ์ดอันดับของผู้ใช้แต่ละคน
 * @param props - Props ของ Component
 */
export const RankCard: React.FC<RankCardProps> = ({record, isCompact}) => {
    const {token} = theme.useToken();
    const accent = rankAccentMap[record.rank] ?? fallbackAccent;

    const chipStyle: React.CSSProperties =
        record.rank === "S"
            ? {
                background:
                    "linear-gradient(90deg, rgba(255,223,102,0.25), rgba(120,255,214,0.25), rgba(102,204,255,0.25))",
                border: `1px solid ${addAlpha("#22c55e", 0.4)}`,
                boxShadow: "0 0 12px rgba(34,197,94,0.35)",
            }
            : record.rank === "A"
                ? {
                    background:
                        "linear-gradient(90deg, rgba(255,215,0,0.18), rgba(255,182,72,0.18), rgba(255,239,184,0.18))",
                    border: `1px solid ${addAlpha("#f59e0b", 0.25)}`,
                }
                : {
                    background: addAlpha(accent.color, 0.08),
                    border: `1px solid ${addAlpha(accent.color, 0.18)}`,
                };

    const progressPercent = record.expected_hours
        ? Math.min(100, (record.total_hours / record.expected_hours) * 100)
        : 0;

    return (
        <Card
            key={record.admin_id}
            size="small"
            style={{
                background: token.colorBgContainer,
                borderRadius: 10,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                borderLeft: `4px solid ${accent.color}`,
                boxShadow: "none",
            }}
        >
            <Space
                align="start"
                style={{width: "100%"}}
                size={isCompact ? 12 : 16}
            >
                <Avatar
                    style={{
                        backgroundColor: token.colorFillTertiary,
                        color: token.colorTextSecondary,
                    }}
                >
                    {record.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                </Avatar>
                <Space
                    direction="vertical"
                    size={isCompact ? 6 : 8}
                    style={{flex: 1, minWidth: 0}}
                >
                    <Space
                        style={{
                            width: "100%",
                            justifyContent: "space-between",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "4px 8px",
                                borderRadius: 999,
                                ...chipStyle,
                                maxWidth: isCompact ? 220 : 260,
                            }}
                            title={`${formatName(record)} · Rank ${record.rank}`}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                }}
                            >
                                {iconByRank[record.rank as keyof typeof iconByRank]}
                            </span>
                            <Typography.Text
                                ellipsis
                                style={{
                                    fontWeight: 600,
                                    color: token.colorText,
                                    maxWidth: isCompact ? 140 : 180,
                                }}
                            >
                                {formatName(record)}
                            </Typography.Text>
                            <Tag
                                color={accent.tagColor ?? "default"}
                                style={{marginInlineStart: 0}}
                            >
                                Rank {record.rank}
                            </Tag>
                        </div>
                        <Typography.Text strong>
                            {formatCompletionLabel(record)}
                        </Typography.Text>
                    </Space>

                    <Typography.Text type="secondary">
                        {record.rank_description || "-"}
                    </Typography.Text>

                    <Progress
                        percent={Number(progressPercent.toFixed(1))}
                        strokeColor={accent.color}
                        trailColor={token.colorFillSecondary}
                        format={() => formatHoursLabel(record)}
                    />
                </Space>
            </Space>
        </Card>
    );
};

