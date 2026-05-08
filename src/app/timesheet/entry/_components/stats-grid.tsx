"use client";

import { Col, Row } from "antd";
import dayjs from "dayjs";
import React from "react";
import { MonthlyRankBoard } from "./monthly-rank-board";

interface StatsGridProps {
  admin_id: number | undefined;
  rank_board_ref: React.RefObject<any>;
  loading: boolean;
  selected_date?: dayjs.Dayjs;
  on_date_change?: (date: dayjs.Dayjs) => void;
}

// ✨ แสดงส่วนสถิติและอันดับ — เฉพาะ MonthlyRankBoard
export const StatsGrid: React.FC<StatsGridProps> = ({
  admin_id,
  rank_board_ref,
}) => {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <MonthlyRankBoard
          ref={rank_board_ref}
          currentAdminId={admin_id}
          variant="compact"
        />
      </Col>
    </Row>
  );
};
