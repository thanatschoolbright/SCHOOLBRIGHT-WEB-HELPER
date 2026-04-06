// ✨ Component สำหรับแสดงกราฟภาพรวม Project Timeline (Gantt Chart)
"use client";

import {
  BranchesOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Space,
  Tag,
  theme,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useTimelineStore } from "../_state/timeline-store";

const { Text } = Typography;

const TimelineChart: React.FC = () => {
  const { token } = theme.useToken();
  const { timelineData, isFetching, setModal } = useTimelineStore();

  // ✨ จัดกลุ่มข้อมูลให้เป็น Timeline Items ตามหลัก Visualized Specification
  const timelineItems = useMemo(() => {
    const items: any[] = [];

    if (!timelineData || timelineData.length === 0) return [];

    timelineData.forEach((project) => {
      const projectColor = project.color_hex || token.colorPrimary;
      const featureColor = project.color_hex_feature || token.colorInfo;

      // 1. ส่วนของโครงการหลัก (Main Project)
      items.push({
        color: projectColor,
        dot: (
          <Avatar
            size={24}
            icon={<ProjectOutlined />}
            style={{ backgroundColor: projectColor }}
          />
        ),
        children: (
          <div style={{ marginBottom: 32 }}>
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
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  {dayjs(project.start_date).format("DD/MM/YYYY")} -{" "}
                  {dayjs(project.end_date).format("DD/MM/YYYY")}
                </Text>
              </Space>
            </Space>

            {/* 2. ส่วนของโครงการย่อย (Sub Project / Features) */}
            {project.children && project.children.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  marginLeft: 8,
                  borderLeft: `1px dashed ${token.colorBorder}`,
                  paddingLeft: 20,
                }}
              >
                <Timeline
                  items={project.children.map((sub) => ({
                    color: sub.color_hex || featureColor,
                    dot: (
                      <BranchesOutlined
                        style={{ fontSize: "14px", color: sub.color_hex || featureColor }}
                      />
                    ),
                    children: (
                      <Space
                        direction="vertical"
                        size={2}
                        style={{ width: "100%", paddingBottom: 8 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Space>
                            <Text style={{ fontSize: 14 }}>{sub.name}</Text>
                            <Tooltip title="แก้ไขโครงการย่อย">
                              <Button
                                type="text"
                                size="small"
                                icon={
                                  <EditOutlined
                                    style={{
                                      fontSize: 12,
                                      color: token.colorLink,
                                    }}
                                  />
                                }
                                onClick={() =>
                                  setModal({
                                    open: true,
                                    mode: "edit",
                                    data: sub,
                                  })
                                }
                                style={{
                                  padding: 0,
                                  height: "auto",
                                  lineHeight: 1,
                                }}
                              />
                            </Tooltip>
                          </Space>
                          <Badge
                            status="processing"
                            text={
                              <Text style={{ fontSize: 12 }}>{sub.status}</Text>
                            }
                          />
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
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
  }, [timelineData, token, setModal]);

  if (timelineItems.length === 0 && !isFetching) {
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
        <Space style={{ padding: "8px 0" }}>
          <UnorderedListOutlined />
          <span>ลำดับเวลาและการดำเนินโครงการ (Project Timeline)</span>
        </Space>
      }
      styles={{ body: { padding: "32px 32px 0 32px" } }}
      style={{
        borderColor: token.colorBorderSecondary,
        boxShadow: token.boxShadowTertiary,
        marginBottom: 24,
      }}
      loading={isFetching}
    >
      <div
        style={{
          maxHeight: 800,
          overflowY: "auto",
          padding: "24px 0 32px 0",
        }}
      >
        <Timeline mode="left" items={timelineItems} style={{ marginLeft: 8 }} />
      </div>
    </Card>
  );
};

export default TimelineChart;
