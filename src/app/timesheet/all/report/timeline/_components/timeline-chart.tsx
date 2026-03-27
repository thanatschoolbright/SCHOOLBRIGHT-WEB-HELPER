// ✨ Component สำหรับแสดงกราฟภาพรวม Project Timeline (Gantt Chart)
"use client";

import { UnorderedListOutlined } from "@ant-design/icons";
import { Card, Result, theme } from "antd";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo } from "react";
import { useTimelineStore } from "../_state/timeline-store";

// Import Ant Design Plots Dynamic
// @ts-ignore
const Bar = dynamic(
  () => import("@ant-design/plots").then((mod) => mod.Bar as any),
  { ssr: false },
);

const TimelineChart: React.FC = () => {
  const { token } = theme.useToken();
  const { timelineData, isLoading, fetchTimeline } = useTimelineStore();

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const chartData = useMemo(() => {
    const flattened: any[] = [];

    timelineData.forEach((project) => {
      flattened.push({
        id: project.id,
        name: project.name,
        start: project.start_date || new Date().toISOString(),
        end: project.end_date || dayjs().add(1, "month").toISOString(),
        type: "โครงการหลัก",
        status: project.status_name || project.status,
      });

      if (project.children) {
        project.children.forEach((feature) => {
          flattened.push({
            id: feature.id,
            name: `↳ ${feature.name}`,
            start: feature.start_date || project.start_date,
            end: feature.end_date || project.end_date || dayjs().toISOString(),
            type: "โครงการย่อย",
            status: feature.status,
          });
        });
      }
    });

    return flattened;
  }, [timelineData]);

  const config = {
    data: chartData,
    xField: "name",
    yField: ["start", "end"],
    colorField: "type",
    label: {
      text: "status",
      position: "inside",
    },
    coordinate: { transform: [{ type: "transpose" }] },
  };

  if (chartData.length === 0 && !isLoading) {
    return (
      <Card
        styles={{ body: { padding: 16 } }}
        style={{ borderColor: token.colorBorderSecondary }}
      >
        <Result status="info" title="ไม่พบข้อมูลโครงการในช่วงเวลาที่เลือก" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          ภาพรวมลำดับเวลาโครงการ (Project Timeline)
        </span>
      }
      styles={{ body: { padding: 16 } }}
      style={{ borderColor: token.colorBorderSecondary }}
      loading={isLoading}
    >
      <div style={{ height: 600 }}>
        {/* ใช้ Bar Chart แบบ Range เพื่อจำลอง Gantt Chart เนื่องจาก Gantt type อาจไม่มีใน v2 */}
        {Bar && <Bar {...config} />}
      </div>
    </Card>
  );
};

export default TimelineChart;
