"use client";

import {Progress, Space, Tag, theme, Typography} from "antd";
import dayjs from "dayjs";
import React from "react";

export interface DailySummaryItem {
    dateKey: string;
    displayDate: string;
    totalHours: number;
    percent: number;
    isCompleted: boolean;
    label: string;
}

interface DailyCardProps {
    item: DailySummaryItem;
    targetHours?: number;
    loading?: boolean;
}

/**
 * ฟังก์ชันเพิ่ม alpha ให้กับสี
 * @param color - สี
 * @param alpha - ค่า alpha (0-1)
 */
const addAlpha = (color: string, alpha: number) => {
    if (color.startsWith("#")) {
        let hex = color.slice(1);
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((char) => char + char)
                .join("");
        }
        const num = Number.parseInt(hex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (color.startsWith("rgb")) {
        const values = color
            .replace(/rgba?\(|\)|\s/g, "")
            .split(",")
            .slice(0, 3)
            .join(",");
        return `rgba(${values}, ${alpha})`;
    }

    return color;
};

/**
 * Component แสดงการ์ดสรุปรายวัน
 * @param props - Props ของ Component
 */
export const DailyCard: React.FC<DailyCardProps> = ({
                                                        item,
                                                        targetHours = 8,
                                                        loading = false,
                                                    }) => {
    const {token} = theme.useToken();
    const today = dayjs();

    //** คำนวณข้อมูลสำหรับแสดงผล */
    const percentForBar = Math.min(item.percent, 100);
    const remainingHours = Math.max(targetHours - item.totalHours, 0);
    const surplusHours = Math.max(item.totalHours - targetHours, 0);
    const dayDate = dayjs(item.dateKey);
    const isFutureDay = dayDate.isAfter(today, "day");
    const isCompleteDay = item.isCompleted;

    //** กำหนดสีตามสถานะ */
    const neutralAccent = token.colorBorderSecondary ?? "#94a3b8";
    const successAccent = token.colorSuccess ?? "#22c55e";
    const errorAccent = token.colorError ?? "#ef4444";
    const accentBase = isFutureDay
        ? neutralAccent
        : isCompleteDay
            ? successAccent
            : errorAccent;

    //** สร้างสไตล์การ์ด */
    const containerBg = token.colorBgElevated ?? token.colorBgContainer;
    const cardBackground = `linear-gradient(135deg, ${addAlpha(
        accentBase,
        isFutureDay ? 0.06 : 0.12
    )}, ${containerBg})`;
    const cardBorder = `1px solid ${addAlpha(accentBase, 0.35)}`;

    //** กำหนด Tag และสถานะ */
    const tagColor = isFutureDay
        ? undefined
        : isCompleteDay
            ? "success"
            : "error";
    const tagLabel = isFutureDay
        ? "ยังไม่ถึงกำหนด"
        : isCompleteDay
            ? `ครบ ${targetHours} ชั่วโมง`
            : `ยังไม่ครบ ${targetHours} ชั่วโมง`;
    const progressStatus = isFutureDay
        ? "normal"
        : isCompleteDay
            ? "success"
            : "exception";

    if (loading) {
        return (
            <div
                style={{
                    minWidth: 200,
                    height: 150,
                    background: token.colorBgContainer,
                    borderRadius: 16,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography.Text type="secondary">กำลังโหลด...</Typography.Text>
            </div>
        );
    }

    return (
        <div
            style={{
                minWidth: 200,
                background: cardBackground,
                borderRadius: 16,
                boxShadow: `0 12px 24px ${addAlpha(accentBase, 0.12)}`,
                padding: 16,
                border: cardBorder,
            }}
        >
            <Space direction="vertical" style={{width: "100%"}} size="small">
                {/* หัวข้อและ Tag */}
                <Space
                    align="center"
                    style={{
                        width: "100%",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <Typography.Text strong>{item.label}</Typography.Text>
                        <Typography.Paragraph
                            style={{margin: 0, color: token.colorTextSecondary}}
                        >
                            {item.displayDate}
                        </Typography.Paragraph>
                    </div>
                    {tagColor ? (
                        <Tag color={tagColor}>{tagLabel}</Tag>
                    ) : (
                        <Tag>{tagLabel}</Tag>
                    )}
                </Space>

                {/* Progress Bar */}
                <Progress
                    percent={percentForBar}
                    status={progressStatus}
                    strokeColor={accentBase}
                    trailColor={addAlpha(neutralAccent, 0.2)}
                    format={() => `${item.totalHours.toFixed(2)} ชม.`}
                />

                {/* ข้อความสถานะ */}
                {item.totalHours === 0 && !isFutureDay && (
                    <Typography.Text type="secondary">
                        ยังไม่มีข้อมูลการลงเวลา
                    </Typography.Text>
                )}
                {!isFutureDay && !isCompleteDay && item.totalHours > 0 && (
                    <Typography.Text type="secondary">
                        ขาดอีก {remainingHours.toFixed(2)} ชั่วโมง เพื่อครบ {targetHours} ชั่วโมง
                    </Typography.Text>
                )}
                {isFutureDay && (
                    <Typography.Text type="secondary">
                        วันทำงานนี้ยังไม่ถึงกำหนด
                    </Typography.Text>
                )}
                {isCompleteDay && item.percent > 100 && surplusHours > 0 && (
                    <Typography.Text type="secondary">
            <span
                role="img"
                aria-label="over-achieved"
                style={{marginRight: 4}}
            >
              🔥
            </span>
                        เกินเป้าหมาย {surplusHours.toFixed(2)} ชั่วโมง
                    </Typography.Text>
                )}
            </Space>
        </div>
    );
};
