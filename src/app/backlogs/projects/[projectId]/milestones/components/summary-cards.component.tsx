"use client";

import { Card, Col, Row, Statistic } from "antd";
import React from "react";

type SummaryCardsProps = {
  total: number;
  active: number;
  archived: number;
  titleTotal: string;
  titleActive: string;
  titleArchived: string;
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  total,
  active,
  archived,
  titleTotal,
  titleActive,
  titleArchived,
}) => (
  <Row gutter={[12, 12]} wrap>
    <Col xs={24} sm={8}>
      <Card
        size="small"
        style={{
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
        }}
      >
        <Statistic title={titleTotal} value={total} />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card
        size="small"
        style={{
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
        }}
      >
        <Statistic title={titleActive} value={active} />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card
        size="small"
        style={{
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
        }}
      >
        <Statistic title={titleArchived} value={archived} />
      </Card>
    </Col>
  </Row>
);
