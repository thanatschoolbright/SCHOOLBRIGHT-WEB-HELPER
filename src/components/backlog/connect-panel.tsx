"use client";
//** แผงเชื่อมต่อ Backlog (Minimal) - กรอก Space และกด Connect/Refresh
import { Button, Card, Input, Space, Typography } from "antd";

type Props = {
  space: string;
  setSpace: (v: string) => void;
  connecting?: boolean;
  onConnect: () => void;
  onRefresh: () => void;
};

export default function BacklogConnectPanel({
  space,
  setSpace,
  connecting,
  onConnect,
  onRefresh,
}: Props) {
  return (
    <Card size="small" styles={{ body: { padding: 16 } }}>
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        {/* 1) หัวข้อคำอธิบาย */}
        <Typography.Text strong>เชื่อมต่อ Backlog (OAuth 2.0)</Typography.Text>
        <Typography.Text type="secondary">
          กรอก Space (subdomain) เช่น myteam แล้วคลิก Connect เพื่อเข้าสู่ระบบ
        </Typography.Text>

        {/* 2) ช่องกรอก + ปุ่ม */}
        <Space>
          {/* {* ช่องกรอก Space *} */}
          <Input
            placeholder="เช่น schoolbright"
            value={space}
            onChange={(e) => setSpace(e.target.value.trim())}
            style={{ width: 260 }}
          />
          {/* {* ปุ่ม Connect *} */}
          <Button type="primary" onClick={onConnect} loading={connecting}>
            Connect
          </Button>
          {/* {* ปุ่ม Refresh Projects *} */}
          <Button onClick={onRefresh}>Refresh Projects</Button>
        </Space>
      </Space>
    </Card>
  );
}
