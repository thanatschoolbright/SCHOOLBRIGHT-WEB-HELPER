import { Card, Statistic, Typography } from "antd";
import { UserSummaryMetric } from "../types/user-profile.types";

interface SummaryCardsProps {
  metrics: UserSummaryMetric[];
}

export const SummaryCards = ({ metrics }: SummaryCardsProps) => (
  <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
    {metrics.map((metric) => (
      <Card
        key={metric.key}
        className="group border-none bg-gradient-to-br from-slate-50 to-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <Typography.Text className="text-sm text-slate-500">
              {metric.label}
            </Typography.Text>
            <Statistic
              value={metric.value}
              valueStyle={{
                color:
                  metric.tone === "primary"
                    ? "#1677ff"
                    : metric.tone === "success"
                    ? "#16a34a"
                    : "#d97706",
              }}
            />
            <Typography.Text className="text-xs text-slate-500">
              {metric.description}
            </Typography.Text>
          </div>
          <div className="rounded-full bg-white px-3 py-2 text-lg shadow-inner">
            {metric.icon}
          </div>
        </div>
      </Card>
    ))}
  </div>
);
