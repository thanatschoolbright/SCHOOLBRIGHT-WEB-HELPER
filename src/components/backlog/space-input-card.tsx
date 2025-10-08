"use client";
//** การ์ดสำหรับกรอก Space และโหลดโปรเจ็กต์จาก Backlog
import React from "react";
import {Button, Card, Input, Space, Typography} from "antd";

type Props = {
    space: string;
    setSpace: (value: string) => void;
    onLoad: () => void;
    loading: boolean;
};

export default function SpaceInputCard({space, setSpace, onLoad, loading}: Props) {
    return (
        <Card size="small" style={{padding: 16}} loading={loading}>
            <Space direction="vertical" style={{width: "100%"}} size={8}>
                <Typography.Text strong>แบ็กล็อก (คีย์ API)</Typography.Text>
                <Typography.Text type="secondary">
                    กรอก Space (subdomain) เช่น <b>schoolbright</b> (ค่าเริ่มต้น: jabjai)
                    แล้วกดปุ่มเพื่อโหลดรายการโปรเจ็กต์
                </Typography.Text>
                <Space>
                    <Input
                        placeholder="เช่น jabjai"
                        value={space}
                        onChange={(e) => setSpace(e.target.value.trim())}
                        style={{width: 260}}
                    />
                    <Button
                        type="primary"
                        onClick={onLoad}
                        loading={loading}
                        disabled={!space.trim()}
                    >
                        โหลดโปรเจ็กต์
                    </Button>
                </Space>
            </Space>
        </Card>
    );
}
