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

    // ✨ จัดรูปแบบข้อมูลให้เหมาะสมกับการแสดงผล Timeline
    timelineData.forEach((project) => {
      const pStart = project.start_date
        ? dayjs(project.start_date).toDate()
        : new Date();
      const pEnd = project.end_date
        ? dayjs(project.end_date).toDate()
        : dayjs(pStart).add(1, "month").toDate();

      flattened.push({
        id: project.id,
        name: project.name,
        range: [pStart, pEnd],
        type: "โครงการหลัก",
        status: project.status_name || project.status,
      });

      if (project.children) {
        project.children.forEach((feature) => {
          const fStart = feature.start_date
            ? dayjs(feature.start_date).toDate()
            : pStart;
          const fEnd = feature.end_date
            ? dayjs(feature.end_date).toDate()
            : project.end_date
              ? pEnd
              : dayjs(fStart).add(7, "day").toDate();

          flattened.push({
            id: feature.id,
            name: `${project.name} | ${feature.name}`, // ✨ ใส่ชื่อโครงการหลักเพื่อป้องกันแกน Y ซ้อนทับกัน
            range: [fStart, fEnd],
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
    yField: "range",
    colorField: "type",
    // ✨ ปรับขนาดความสูงอัตโนมัติตามปริมาณข้อมูล (เพิ่มความสูงขั้นต่ำต่อแถว)
    autoFit: true,
    height: Math.max(600, chartData.length * 40),
    scrollbar: {
      y: { ratio: 0.5 },
    },
    // ✨ ปรับแต่งขนาดแท่งกราฟ
    barWidthRatio: 0.8,
    // ✨ ปรับแต่งแกน Y (เวลา)
    axis: {
      y: {
        labelFormatter: (val: any) => dayjs(val).format("DD/MM/YYYY"),
        grid: true,
      },
      x: {
        label: {
          autoHide: false,
          autoRotate: false,
          overflow: "ellipsis",
          maxWidth: 200,
          style: {
            fontSize: 12,
            fontWeight: 500,
          },
        },
      },
    },
    // ✨ ปรับตำแหน่ง Label ให้แสดงสถานะบนแท่งกราฟ
    label: {
      text: "status",
      position: "inside",
      style: {
        fill: "#fff",
        fontSize: 10,
        textAlign: "center",
      },
    },
    // ✨ ปรับแต่ง Tooltip ให้แสดงข้อมูลครบถ้วน
    tooltip: {
      title: "name",
      items: [
        (data: any) => ({
          name: "ประเภท",
          value: data.type,
        }),
        (data: any) => ({
          name: "ช่วงเวลา",
          value: `${dayjs(data.range[0]).format("DD/MM/YYYY")} - ${dayjs(data.range[1]).format("DD/MM/YYYY")}`,
        }),
        (data: any) => ({
          name: "สถานะ",
          value: data.status,
        }),
      ],
    },
    coordinate: { transform: [{ type: "transpose" }] },
    // ✨ ปรับแต่งสีแจ่มๆ
    scale: {
      color: {
        range: ["#fa8c16", token.colorPrimary], // สีส้มสำหรับโครงการหลัก, สีฟ้าสำหรับโครงการย่อย
      },
    },
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
      <div
        style={{
          minHeight: 600,
          overflowY: "auto",
          maxHeight: 1200, // ✨ จำกัดความสูงสูงสุดเพื่อไม่ให้ดัน Layout
          paddingRight: 8,
        }}
      >
        {/* ใช้ Bar Chart แบบ Range เพื่อจำลอง Gantt Chart เนื่องจาก Gantt type อาจไม่มีใน v2 */}
        {Bar && <Bar {...config} />}
      </div>
    </Card>
  );
};

export default TimelineChart;
