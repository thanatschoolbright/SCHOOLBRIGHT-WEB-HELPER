"use client";

import React from "react";
import {Button, Card, Divider, Drawer, Flex, Skeleton, Space, theme, Typography,} from "antd";
import type {AiUpdateState} from "./types";

//** Drawer สำหรับให้ผู้ใช้ตรวจสอบข้อความที่สรุปโดย AI ก่อนอนุมัติ
export type AiUpdateDrawerProps = {
    aiState: AiUpdateState;
    onApprove: () => void;
    onClose: () => void;
    onRegenerate: () => void;
    onUpdateText: (value: string) => void;
};

export default function AiUpdateDrawer({
                                           aiState,
                                           onApprove,
                                           onClose,
                                           onRegenerate,
                                           onUpdateText,
                                       }: AiUpdateDrawerProps) {
    const {token} = theme.useToken();

    if (!aiState.open) return null;

    // 🎨 สไตล์พื้นฐานตามโทน Ant Design (รองรับ Dark / Light mode)
    const baseBoxStyle: React.CSSProperties = {
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: token.paddingSM,
        whiteSpace: "pre-wrap",
        color: token.colorText,
    };

    const textAreaStyle: React.CSSProperties = {
        ...baseBoxStyle,
        minHeight: 240,
        resize: "vertical",
        width: "100%",
    };

    return (
        <Drawer
            open={aiState.open}
            onClose={onClose}
            width={900}
            title={
                <Typography.Title level={5} style={{margin: 0}}>
                    AI Update • {aiState.issue?.issueKey || "-"}
                </Typography.Title>
            }
            styles={{
                body: {
                    background: token.colorBgLayout,
                    paddingInline: token.paddingLG,
                    paddingBlock: token.paddingMD,
                },
                header: {
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                },
            }}
        >
            <Space direction="vertical" size="large" style={{width: "100%"}}>
                {/* 📘 คำอธิบาย */}
                <Typography.Text type="secondary">
                    ระบบจะช่วยสรุป Task เป็น .MD ก่อนอนุมัติ (เน้นความ Minimal และอ่านง่าย)
                </Typography.Text>

                {/* 🧩 ข้อความเดิม */}
                <Card
                    size="small"
                    title={<Typography.Text strong>ข้อความเดิม</Typography.Text>}
                    styles={{
                        body: {padding: token.paddingSM},
                    }}
                >
                    <div
                        style={{
                            ...baseBoxStyle,
                            minHeight: 200,
                            background: token.colorBgContainerDisabled,
                        }}
                    >
                        {aiState.issue?.description || "-"}
                    </div>
                </Card>

                {/* 🤖 ข้อความที่สรุปโดย AI */}
                <Card
                    size="small"
                    title={<Typography.Text strong> สรุปโดย AI (.MD)</Typography.Text>}
                    styles={{
                        body: {padding: token.paddingSM},
                    }}
                >
                    {aiState.generating ? (
                        <Skeleton active paragraph={{rows: 10}}/>
                    ) : (
                        <textarea
                            value={aiState.newText}
                            onChange={(e) => onUpdateText(e.target.value)}
                            style={textAreaStyle}
                            rows={10}
                        />
                    )}
                </Card>

                <Divider style={{margin: 0}}/>

                {/* ✅ ปุ่มควบคุม */}
                <Flex justify="flex-end" gap="small">
                    {/* ปุ่มให้ AI สร้างใหม่ */}
                    <Button
                        disabled={aiState.generating}
                        loading={aiState.generating}
                        onClick={onRegenerate}
                    >
                        สร้างใหม่ (Regenerate)
                    </Button>

                    {/* ปุ่มอนุมัติ */}
                    <Button
                        type="primary"
                        disabled={!aiState.newText || aiState.generating}
                        onClick={onApprove}
                    >
                        อนุมัติการแก้ไข
                    </Button>
                </Flex>
            </Space>
        </Drawer>
    );
}
