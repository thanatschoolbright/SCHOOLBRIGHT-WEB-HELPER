import React from "react";
import { Row, Col, Card } from "antd";
import { MonthlyRankBoard, MonthlyRankBoardRef } from "../monthly-rank-board";
import { WeeklySummary } from "@components/timesheet/weekly-summary";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TopUsage } from "../types/timesheet-entry.types";
import { DAILY_TARGET_HOURS } from "../utils/timesheet-entry.helpers";

interface StatsGridProps {
  adminId: number | undefined;
  rankBoardRef: React.RefObject<MonthlyRankBoardRef>;
  weeklySummary: any[];
  topProjectUsage: TopUsage | null;
  topFeatureUsage: TopUsage | null;
  loading: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  adminId,
  rankBoardRef,
  weeklySummary,
  topProjectUsage,
  topFeatureUsage,
  loading,
}) => {
  return (
    <Row gutter={[16, 16]}>
      {/* Monthly Rank Board */}
      <Col xs={24} xl={14}>
        <div style={{ height: "100%" }}>
          <MonthlyRankBoard
            ref={rankBoardRef}
            currentAdminId={adminId}
            variant="wide"
          />
        </div>
      </Col>

      {/* Right Side Stats */}
      <Col xs={24} xl={10}>
        <Row gutter={[16, 16]}>
          {/* Weekly Summary */}
          <Col span={24}>
            <WeeklySummary
              weeklySummary={weeklySummary}
              targetHours={DAILY_TARGET_HOURS}
              loading={loading}
            />
          </Col>

          {/* Top Project */}
          <Col span={12}>
            {topProjectUsage ? (
              <TimesheetStatCard
                title="โปรเจ็คยอดนิยม"
                value={topProjectUsage.hours}
                color="#52c41a"
                loading={loading}
                description={topProjectUsage.name}
              />
            ) : (
              <Card loading style={{ height: 140, borderRadius: 16 }} />
            )}
          </Col>

          {/* Top Feature */}
          <Col span={12}>
            {topFeatureUsage ? (
              <TimesheetStatCard
                title="ฟีเจอร์ยอดนิยม"
                value={topFeatureUsage.hours}
                color="#ff4d4f"
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
