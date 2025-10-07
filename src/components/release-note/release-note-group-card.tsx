"use client";
//** Accordion แสดงกลุ่ม Release Notes โดยใช้ Collapse ของ Ant Design (Minimal โทนขาว)
import React from "react";
import {Collapse, Divider, Space, Tag, theme, Typography} from "antd";
import type {ReleaseNoteGroup, ReleaseNoteItem} from "@components/release-note/types";
import dayjs from "dayjs";

//** map สีของ Tag ตามประเภทการเปลี่ยนแปลง
const typeColor: Record<ReleaseNoteItem["type"], string> = {
    add: "green",
    update: "blue",
    remove: "red",
};

type Props = {
    group: ReleaseNoteGroup;
};

export default function ReleaseNoteGroupCard({group}: Props) {
    const {token} = theme.useToken();

    //** สร้าง panelItems สำหรับ Collapse โดยใช้ prop items แทน children ตาม API ใหม่ของ Ant Design
    const panelItems = [
        {
            key: group.date,
            label: (
                <Space direction="vertical" size={0}>
                    {/* แปลงวันที่ให้อยู่ในรูปแบบไทย DD/MM/YYYY */}
                    <Typography.Text strong>{dayjs(group.date).format("DD/MM/YYYY")}</Typography.Text>
                    <Typography.Text type="secondary">Release Notes</Typography.Text>
                </Space>
            ),
            children: (
                <Space direction="vertical" style={{width: "100%"}} size={10}>
                    {group.release_note.map((item, idx) => (
                        <div key={`${group.date}-${idx}`}>
                            <Space align="start" style={{width: "100%"}}>
                                <Tag color={typeColor[item.type]}>{item.emoji}</Tag>
                                <Typography.Text style={{color: token.colorText}}>
                                    {item.message}
                                </Typography.Text>
                            </Space>
                            {idx < group.release_note.length - 1 ? (
                                <Divider style={{margin: "10px 0"}}/>
                            ) : null}
                        </div>
                    ))}
                </Space>
            ),
        },
    ];

    return (
        <Collapse
            accordion
            style={{
                background: token.colorBgContainer,
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`
            }}
            items={panelItems}
        />
    );
}
