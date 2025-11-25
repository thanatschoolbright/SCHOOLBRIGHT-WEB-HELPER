"use client";

import React from "react";
import { Button, Card, Col, Empty, Row, Skeleton, Space, Typography } from "antd";
import MilestoneCard from "@components/backlog/milestones/milestone-card";
import type { Milestone } from "../types/milestones.types";

type MilestoneListProps = {
  milestones: Milestone[];
  loading: boolean;
  deletingId: number | null;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  title: string;
  emptyText: string;
  refreshText: string;
  helperText: string;
};

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  loading,
  deletingId,
  onEdit,
  onDelete,
  onRefresh,
  title,
  emptyText,
  refreshText,
  helperText,
}) => (
  <Card styles={{ body: { padding: 24 } }} title={title}>
    {loading ? (
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`milestone-skeleton-${index}`} active paragraph={{ rows: 2 }} />
        ))}
      </Space>
    ) : milestones.length ? (
      <>
        <Row gutter={[20, 20]} wrap>
          {milestones.map((item) => (
            <Col key={item.id} xs={24} md={12} lg={8}>
              <MilestoneCard
                deleting={deletingId === item.id}
                milestone={item}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            </Col>
          ))}
        </Row>
      </>
    ) : (
      <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
    )}
    <Space direction="vertical" size={12} style={{ marginTop: 24, width: "100%" }}>
      <Typography.Text type="secondary">{helperText}</Typography.Text>
      <Button onClick={onRefresh} type="default">
        {refreshText}
      </Button>
    </Space>
  </Card>
);
