import React, { useMemo } from "react";
import { Card, Col, Row, Statistic, Tag, Space, Skeleton } from "antd";
import {
  AreaChartOutlined,
  CalendarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { SummaryRecord, SummaryMetadata } from "../types/timesheet.types";
import { calculateSummaryMetrics } from "../utils/timesheet.helpers";

type SummaryCardsProps = {
  records: SummaryRecord[];
  metadata: SummaryMetadata | null;
  loading: boolean;
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  records,
  metadata,
  loading,
}) => {
  const { t } = useTranslation("translate");

  const summaryCards = useMemo(() => {
    const totalExpected = metadata?.total_expected_hours_all_members ?? 0;
    const { totalHours, avgCompletion } = calculateSummaryMetrics(
      records,
      totalExpected
    );

    const todayHours = records.reduce((sum, record) => {
      const today = new Date().toISOString().split("T")[0];
      const todayBreakdown = record.breakdown.find((b) => b.date === today);
      return sum + (todayBreakdown?.hours ?? 0);
    }, 0);

    const pendingCount = records.filter((r) => r.completion_rate < 100).length;

    return [
      {
        title: t("timesheet_page.summary_today_hours"),
        value: todayHours,
        suffix: t("timesheet_page.hours_unit"),
        icon: <ClockCircleOutlined />,
        color: "#1677ff",
      },
      {
        title: t("timesheet_page.summary_total_hours"),
        value: totalHours,
        suffix: t("timesheet_page.hours_unit"),
        icon: <AreaChartOutlined />,
        color: "#52c41a",
      },
      {
        title: t("timesheet_page.summary_expected_hours"),
        value: totalExpected,
        suffix: t("timesheet_page.hours_unit"),
        icon: <CalendarOutlined />,
        color: "#faad14",
      },
      {
        title: t("timesheet_page.summary_avg_completion"),
        value: avgCompletion,
        suffix: "%",
        icon: <TrophyOutlined />,
        color: avgCompletion >= 100 ? "#52c41a" : "#d4380d",
      },
    ];
  }, [records, metadata, t]);

  if (loading) {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Col key={i} xs={24} sm={12} lg={6}>
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {summaryCards.map((item, index) => (
        <Col key={index} xs={24} sm={12} lg={6}>
          <Card
            className="rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
            }}
          >
            <Space align="center" size="middle">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)`,
                }}
              >
                <span style={{ color: item.color, fontSize: 24 }}>
                  {item.icon}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-gray-500 text-sm mb-1">{item.title}</div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                  <span className="text-gray-400 text-sm">{item.suffix}</span>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
