"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  PieChartOutlined,
  ProjectOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Card, Col, Empty, Row, Spin, Statistic, Tag } from "antd";
import React, { useEffect, useState } from "react";

interface ProjectStats {
  health: {
    total: number;
    active: number;
    closed: number;
    success_rate: number;
  };
  trackings: Record<string, number>;
  by_category: Record<string, number>;
}

interface ProjectDashboardProps {
  currentAdminId?: number;
}

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  open: "#1890ff",
  close: "#52c41a",
  closed: "#52c41a",
  Development: "#722ed1",
  กำลังพัฒนา: "#722ed1",
  รวบรวมความต้องการ: "#faad14",
  "Requirement & Analysis": "#faad14",
  "Requirement Analysis": "#faad14",
  "System Design": "#13c2c2",
  ออกแบบระบบ: "#13c2c2",
  "QA & Testing": "#eb2f96",
  กำลังทดสอบ: "#eb2f96",
  "Deployment & Done": "#52c41a",
  "เสร็จสิ้น/ส่งมอบ": "#52c41a",
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  EXTERNAL: "#ff7a45",
  INTERNAL: "#1890ff",
  MAINTENANCE: "#faad14",
};

export const ProjectDashboardComponent: React.FC<ProjectDashboardProps> = ({
  currentAdminId,
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProjectStats | null>(null);

  const fetchProjectStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-user": currentAdminId?.toString() || "",
        },
        body: JSON.stringify({ limit: 1000, page: 1 }),
      });

      const result = await res.json();

      if (result.status === 200 && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch project stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectStats();
  }, [currentAdminId]);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <Empty description="ไม่พบข้อมูลสถิติโครงการ" />
      </Card>
    );
  }

  const health = stats.health || {
    total: 0,
    active: 0,
    closed: 0,
    success_rate: 0,
  };
  const trackings = stats.trackings || {};
  const by_category = stats.by_category || {};

  return (
    <div className="space-y-4">
      {/* Overall Health */}
      <Card
        title={
          <span>
            <PieChartOutlined style={{ marginRight: 8 }} />
            สุขภาพโครงการโดยรวม
          </span>
        }
        bordered={false}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" style={{ background: "#f0f5ff" }}>
              <Statistic
                title="โครงการทั้งหมด"
                value={health.total || 0}
                prefix={<ProjectOutlined />}
                suffix="โครงการ"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" style={{ background: "#fffbe6" }}>
              <Statistic
                title="กำลังดำเนินการ"
                value={health.active || 0}
                prefix={<ClockCircleOutlined />}
                suffix="โครงการ"
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" style={{ background: "#f6ffed" }}>
              <Statistic
                title="ปิดโครงการแล้ว"
                value={health.closed || 0}
                prefix={<CheckCircleOutlined />}
                suffix="โครงการ"
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless" style={{ background: "#e6f7ff" }}>
              <Statistic
                title="อัตราความสำเร็จ"
                value={health.success_rate || 0}
                prefix={<CheckCircleOutlined />}
                suffix="%"
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* Status Tracking */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <span>
                <TagsOutlined style={{ marginRight: 8 }} />
                สถานะโครงการ (Project Status)
              </span>
            }
            bordered={false}
            style={{ height: "100%" }}
          >
            {!trackings || Object.keys(trackings).length === 0 ? (
              <Empty description="ไม่มีข้อมูลสถานะ" />
            ) : (
              <div className="space-y-3">
                {Object.entries(trackings)
                  .sort(([, a], [, b]) => (b || 0) - (a || 0))
                  .map(([status, count]) => {
                    const color = STATUS_COLORS[status] || "#d9d9d9";
                    const percentage =
                      health.total > 0
                        ? Math.round(((count || 0) / health.total) * 100)
                        : 0;

                    return (
                      <div
                        key={status}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: "#fafafa",
                          borderRadius: "8px",
                          border: `1px solid ${color}20`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: color,
                              marginRight: 12,
                            }}
                          />
                          <span style={{ fontWeight: 500 }}>{status}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Tag color={color} style={{ margin: 0 }}>
                            {count || 0} โครงการ
                          </Tag>
                          <span style={{ color: "#8c8c8c", fontSize: "12px" }}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </Col>

        {/* Category Distribution */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <FolderOpenOutlined style={{ marginRight: 8 }} />
                ประเภทโครงการ (Category)
              </span>
            }
            bordered={false}
            style={{ height: "100%" }}
          >
            {!by_category || Object.keys(by_category).length === 0 ? (
              <Empty description="ไม่มีข้อมูลประเภท" />
            ) : (
              <div className="space-y-3">
                {Object.entries(by_category)
                  .sort(([, a], [, b]) => (b || 0) - (a || 0))
                  .map(([category, count]) => {
                    const color = CATEGORY_COLORS[category] || "#d9d9d9";
                    const percentage =
                      health.total > 0
                        ? Math.round(((count || 0) / health.total) * 100)
                        : 0;

                    let label = category;
                    if (category === "EXTERNAL") label = "โครงการภายนอก";
                    else if (category === "INTERNAL") label = "โครงการภายใน";
                    else if (category === "MAINTENANCE")
                      label = "โครงการบำรุงรักษา";

                    return (
                      <div
                        key={category}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px",
                          background: "#fafafa",
                          borderRadius: "8px",
                          border: `1px solid ${color}20`,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: color,
                                marginRight: 12,
                              }}
                            />
                            <span style={{ fontWeight: 500 }}>{label}</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <Tag color={color} style={{ margin: 0 }}>
                              {count || 0} โครงการ
                            </Tag>
                            <span
                              style={{ color: "#8c8c8c", fontSize: "12px" }}
                            >
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
