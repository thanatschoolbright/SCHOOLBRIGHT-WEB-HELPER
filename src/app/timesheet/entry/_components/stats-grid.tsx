"use client";

import { WeeklySummary } from "@/components/timesheet/weekly-summary";
import { Col, Row, theme } from "antd";
import dayjs from "dayjs";
import React from "react";
import { MonthlyRankBoard } from "./monthly-rank-board";

/**
 * Interface สำหรับ Props ของ StatsGrid
 */
interface StatsGridProps {
  /** Admin ID ของผู้ใช้งานปัจจุบัน */
  admin_id: number | undefined;
  /** Reference สำหรับเรียกฟังก์ชันภายใน MonthlyRankBoard */
  rank_board_ref: React.RefObject<any>;
  /** ข้อมูลสรุปรายเดือนสำหรับแสดงใน WeeklySummary */
  monthly_summary: any[];
  /** สถานะการโหลดข้อมูลตารางหลัก */
  loading: boolean;
  /** สถานะการโหลดข้อมูลสรุปรายเดือน */
  monthly_summary_loading?: boolean;
  /** สถิติรายเดือน */
  monthly_stats?: any;
  /** วันที่ที่เลือกแสดงผล */
  selected_date?: dayjs.Dayjs;
  /** ฟังก์ชันเมื่อมีการเปลี่ยนวันที่ */
  on_date_change?: (date: dayjs.Dayjs) => void;
}

/**
 * Component แสดงส่วนสถิติและอันดับ (Stats & Ranking)
 * ประกอบด้วย MonthlyRankBoard และ WeeklySummary
 */
export const StatsGrid: React.FC<StatsGridProps> = ({
  admin_id,
  rank_board_ref,
  monthly_summary,
  monthly_summary_loading = false,
  monthly_stats = null,
  selected_date,
  on_date_change,
}) => {
  const { token } = theme.useToken();

  // กำหนดค่ามาตรฐานสำหรับชั่วโมงทำงานต่อวัน
  const DAILY_TARGET_HOURS = 8;

  return (
    <Row gutter={[24, 24]} style={{ alignItems: "stretch" }}>
      {/* ส่วนแสดงอันดับ (Rank Board) */}
      <Col xs={24} lg={12} style={{ display: "flex", flexDirection: "column" }}>
        <MonthlyRankBoard
          ref={rank_board_ref}
          currentAdminId={admin_id}
          variant="compact"
        />
      </Col>

      {/* ส่วนแสดงสรุปรายสัปดาห์/เดือน (Weekly Summary) */}
      <Col xs={24} lg={12}>
        <div
          style={{
            height: "100%",
            display: "flex",
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 24,
            overflow: "hidden",
            background: token.colorBgContainer,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <WeeklySummary
            monthly_summary={monthly_summary}
            targetHours={DAILY_TARGET_HOURS}
            loading={monthly_summary_loading}
            stats={monthly_stats}
            selected_date={selected_date}
            on_date_change={on_date_change}
          />
        </div>
      </Col>
    </Row>
  );
};
