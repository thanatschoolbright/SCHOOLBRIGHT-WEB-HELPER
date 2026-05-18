"use client";

import { ClockCircleOutlined, RobotOutlined } from "@ant-design/icons";
import { Badge, Card, Space, Switch, Tag, Typography } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { BotItem } from "../_api/bot-management-service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

interface BotCardProps {
  bot: BotItem;
  isAdmin: boolean;
  isToggling: boolean;
  onToggle: (key: string, enabled: boolean, nameTh: string) => void;
}

// การ์ดแสดงสถานะและควบคุม Bot รายตัว
export function BotCard({ bot, isAdmin, isToggling, onToggle }: BotCardProps) {
  const updatedAtFormatted = bot.updated_at
    ? dayjs(bot.updated_at).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm น.")
    : null;

  return (
    <Card
      styles={{ body: { padding: 20 } }}
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Space>
            <RobotOutlined style={{ fontSize: 20, color: bot.enabled ? "#52c41a" : "#d9d9d9" }} />
            <Typography.Text strong style={{ fontSize: "1rem" }}>
              {bot.name_th}
            </Typography.Text>
          </Space>
          <Switch
            checked={bot.enabled}
            loading={isToggling}
            disabled={!isAdmin}
            onChange={(checked) => onToggle(bot.key, checked, bot.name_th)}
            checkedChildren="เปิด"
            unCheckedChildren="ปิด"
          />
        </Space>

        <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
          {bot.description}
        </Typography.Text>

        <Space wrap>
          <Badge
            status={bot.enabled ? "processing" : "default"}
            text={
              <Typography.Text style={{ fontSize: "0.8rem" }}>
                {bot.enabled ? "กำลังทำงาน" : "หยุดทำงาน"}
              </Typography.Text>
            }
          />
          <Tag icon={<ClockCircleOutlined />} color="blue" style={{ fontSize: "0.78rem" }}>
            {bot.schedule_th}
          </Tag>
          <Tag color="default" style={{ fontSize: "0.78rem", fontFamily: "monospace" }}>
            {bot.cronjob_name}
          </Tag>
        </Space>

        {updatedAtFormatted && (
          <Typography.Text type="secondary" style={{ fontSize: "0.78rem" }}>
            อัปเดตล่าสุด: {updatedAtFormatted}
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}
