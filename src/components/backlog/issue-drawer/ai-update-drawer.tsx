"use client";

import { Button, Card, Divider, Drawer, Skeleton, Space, Typography } from "antd";
import type { AiUpdateState } from "./types";

export type AiUpdateDrawerProps = {
  aiState: AiUpdateState;
  onApprove: () => void;
  onClose: () => void;
  onRegenerate: () => void;
  onUpdateText: (value: string) => void;
};

//** Drawer สรุปข้อความด้วย AI ให้ผู้ใช้ตรวจและยืนยัน
export default function AiUpdateDrawer({
  aiState,
  onApprove,
  onClose,
  onRegenerate,
  onUpdateText,
}: AiUpdateDrawerProps) {
  if (!aiState.open) return null;
  return (
    <Drawer
      open={aiState.open}
      title={`AI Update • ${aiState.issue?.issueKey || "-"}`}
      width={900}
      onClose={onClose}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          ระบบจะช่วยสรุป Task เป็น .MD ก่อนอนุมัติ (Minimal/อ่านง่าย)
        </Typography.Text>

        <Card
          size="small"
          styles={{ body: { padding: 12 } }}
          title={<Typography.Text strong>ข้อความเดิม</Typography.Text>}
        >
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: 10,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              minHeight: 200,
              padding: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {aiState.issue?.description || "-"}
          </div>
        </Card>

        <Card
          size="small"
          styles={{ body: { padding: 12 } }}
          title={<Typography.Text strong>สรุปโดย AI (.MD)</Typography.Text>}
        >
          {aiState.generating ? (
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          ) : (
            <textarea
              value={aiState.newText}
              onChange={(event) => onUpdateText(event.target.value)}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                minHeight: 240,
                padding: 12,
                width: "100%",
              }}
            />
          )}
        </Card>

        <Divider style={{ margin: "8px 0 0" }} />

        <Space style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button disabled={aiState.generating} loading={aiState.generating} onClick={onRegenerate}>
            Regenerate
          </Button>
          <Button
            disabled={!aiState.newText || aiState.generating}
            type="primary"
            onClick={onApprove}
          >
            อนุมัติการแก้ไข
          </Button>
        </Space>
      </Space>
    </Drawer>
  );
}
