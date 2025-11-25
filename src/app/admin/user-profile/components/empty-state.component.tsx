import { FileSearchOutlined } from "@ant-design/icons";
import { Button, Card, Typography } from "antd";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

export const EmptyState = ({ title, description, actionLabel, onAction }: EmptyStateProps) => (
  <Card className="border-dashed bg-gradient-to-b from-slate-50 to-white text-center shadow-none">
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
        <FileSearchOutlined className="text-2xl" />
      </div>
      <Typography.Title level={4} className="!mb-1">
        {title}
      </Typography.Title>
      <Typography.Text type="secondary">{description}</Typography.Text>
      {onAction ? (
        <Button type="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  </Card>
);
