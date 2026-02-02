import React from "react";
import { Row, Col, Card, theme } from "antd";
import { MonthlyRankBoard, MonthlyRankBoardRef } from "../monthly-rank-board";
import { WeeklySummary } from "@components/timesheet/weekly-summary";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TopUsage } from "../types/timesheet-entry.types";
import { DAILY_TARGET_HOURS } from "../utils/timesheet-entry.helpers";

interface StatsGridProps {
  adminId: number | undefined;
  rankBoardRef: React.RefObject<MonthlyRankBoardRef>;
  monthlySummary: any[];
  topProjectUsage: TopUsage | null;
  topFeatureUsage: TopUsage | null;
  loading: boolean;
  monthlyStats?: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  adminId,
  rankBoardRef,
  monthlySummary,
  topProjectUsage,
  topFeatureUsage,
  loading,
  monthlyStats = null,
}) => {
  const { token } = theme.useToken();
  const [variant, setVariant] = React.useState<"compact" | "wide">("compact");

  const leftColSpan = variant === "compact" ? 8 : 14;
  const rightColSpan = variant === "compact" ? 16 : 10;

  return (
    <Row gutter={[24, 24]}>
      {/* Monthly Rank Board */}
      <Col xs={24} xl={leftColSpan} style={{ transition: "all 0.3s ease" }}>
        <MonthlyRankBoard
          ref={rankBoardRef}
          currentAdminId={adminId}
          variant="compact"
          onVariantChange={setVariant}
        />
      </Col>

      {/* Right Side Stats */}
      <Col xs={24} xl={rightColSpan} style={{ transition: "all 0.3s ease" }}>
        <Row gutter={[16, 16]}>
          {/* Monthly Summary */}
          <Col span={24}>
            <WeeklySummary
              monthly_summary={monthlySummary}
              targetHours={DAILY_TARGET_HOURS}
              loading={loading}
              stats={monthlyStats}
            />
          </Col>

          {/* Top Project */}
          <Col xs={24} md={12}>
            {topProjectUsage ? (
              <TimesheetStatCard
                title="โปรเจ็คยอดนิยม"
                value={topProjectUsage.hours}
                color={token.colorSuccess}
                loading={loading}
                description={topProjectUsage.name}
              />
            ) : (
              <Card loading style={{ height: 140, borderRadius: 16 }} />
            )}
          </Col>

          {/* Top Feature */}
          <Col xs={24} md={12}>
            {topFeatureUsage ? (
              <TimesheetStatCard
                title="ฟีเจอร์ยอดนิยม"
                value={topFeatureUsage.hours}
                color={token.colorError}
                loading={loading}
                description={topFeatureUsage.name}
              />
            ) : (
              <Card loading style={{ height: 140, borderRadius: 16 }} />
            )}
          </Col>
        </Row>
      </Col>
    </Row>
  );
};
