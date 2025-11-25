"use client";

import { Button, Card, Space, Typography } from "antd";

type FallbackErrorProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export default function FallbackError({
  title,
  description,
  actionLabel,
  onAction,
}: FallbackErrorProps): JSX.Element {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Card className="shadow-md" style={{ borderRadius: 16 }}>
        <Space direction="vertical" size={12} align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary" className="max-w-md text-center">
            {description}
          </Typography.Text>
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
