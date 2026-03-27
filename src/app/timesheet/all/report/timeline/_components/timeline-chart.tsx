// ✨ Component สำหรับแสดงกราฟภาพรวม Project Timeline (Gantt Chart)
"use client";

import {
  BranchesOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Card,
  Empty,
  Space,
  Tag,
  theme,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useTimelineStore } from "../_state/timeline-store";

const { Text } = Typography;

const TimelineChart: React.FC = () => {
  const { token } = theme.useToken();
  const { timelineData, isLoading, fetchTimeline } = useTimelineStore();

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // ✨ จัดกลุ่มข้อมูลให้เป็น Timeline Items ตามหลัก Visualized Specification
  const timelineItems = useMemo(() => {
    const items: any[] = [];

    if (!timelineData || timelineData.length === 0) return [];

    timelineData.forEach((project) => {
      // 1. ส่วนของโครงการหลัก (Main Project)
      items.push({
        color: token.colorPrimary,
        dot: <ProjectOutlined style={{ fontSize: "16px" }} />,
        children: (
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text strong style={{ fontSize: 16 }}>
                  {project.name}
                </Text>
                <Tag color="orange" bordered={false}>
                  {project.status_name || project.status}
                </Tag>
              </div>
              <Space split={<Text type="secondary">|</Text>} size={8}>
                <Text type="secondary" size="small">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {dayjs(project.start_date).format("DD MMM YYYY")} -{" "}
                  {dayjs(project.end_date).format("DD MMM YYYY")}
                </Text>
              </Space>
            </Space>

            {/* 2. ส่วนของโครงการย่อย (Sub Project / Features) */}
            {project.children && project.children.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  marginLeft: 8,
                  borderLeft: `1px dashed ${token.colorBorder}`,
                  paddingLeft: 16,
                }}
              >
                <Timeline
                  items={project.children.map((sub) => ({
                    color: token.colorInfo,
                    dot: <BranchesOutlined style={{ fontSize: "12px" }} />,
                    children: (
                      <Space
                        direction="vertical"
                        size={2}
                        style={{ width: "100%" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>{sub.name}</Text>
                          <Badge
                            status="processing"
                            text={sub.status}
                            style={{ fontSize: 12 }}
                          />
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(sub.start_date).format("DD/MM/YYYY")} -{" "}
                          {dayjs(sub.end_date).format("DD/MM/YYYY")}
                        </Text>
                      </Space>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        ),
      });
    });

    return items;
  }, [timelineData, token]);

  if (timelineItems.length === 0 && !isLoading) {
    return (
      <Card
        styles={{ body: { padding: 48, textAlign: "center" } }}
        style={{ borderColor: token.colorBorderSecondary }}
      >
        <Empty description="ไม่พบข้อมูลลำดับเวลาของโครงการ" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <UnorderedListOutlined />
          <span>ลำดับเวลาและการดำเนินโครงการ (Project Timeline)</span>
        </Space>
      }
      styles={{ body: { padding: "24px 24px 0 24px" } }}
      style={{
        borderColor: token.colorBorderSecondary,
        boxShadow: token.boxShadowTertiary,
      }}
      loading={isLoading}
    >
      <div
        style={{
          maxHeight: 800,
          overflowY: "auto",
          padding: "12px 0",
        }}
      >
        <Timeline mode="left" items={timelineItems} />
      </div>
    </Card>
  );
};

export default TimelineChart;
