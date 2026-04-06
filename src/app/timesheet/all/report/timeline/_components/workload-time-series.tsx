"use client";

import { AreaChartOutlined } from "@ant-design/icons";
import { Line } from "@ant-design/plots";
import { Card, Empty, Spin, theme } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useTimelineStore } from "../_stores/timeline-store";

dayjs.extend(isBetween);

/**
 * ✨ Component แสดงแผนภูมิภาพรวมภาระงานรายเดือน (Monthly Workload Forecast)
 * แสดงจำนวนโครงการย่อย (Features) ที่ต้องเสร็จในแต่ละเดือนของปีปัจจุบัน
 */
const WorkloadTimeSeries = () => {
  const { token } = theme.useToken();
  const { timelineData, isFetching } = useTimelineStore();

  /**
   * 📊 เตรียมข้อมูลสำหรับ Time Series (จำนวนงานที่จะจบในแต่ละเดือน)
   */
  const processData = () => {
    const currentYear = dayjs().year();
    const monthlyCounts: Record<string, number> = {};

    // เริ่มต้น 12 เดือนของปีปัจจุบัน
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    months.forEach((m) => {
      monthlyCounts[m] = 0;
    });

    // รวมจำนวนงานย่อยที่จบในแต่ละเดือน
    timelineData.forEach((project: any) => {
      if (project.children && Array.isArray(project.children)) {
        project.children.forEach((feature: any) => {
          if (feature.end_date) {
            const endDate = dayjs(feature.end_date);
            if (endDate.year() === currentYear) {
              const monthIndex = endDate.month(); // 0-11
              const monthName = months[monthIndex];
              if (monthlyCounts[monthName] !== undefined) {
                monthlyCounts[monthName] += 1;
              }
            }
          }
        });
      }
    });

    return months.map((month) => ({
      month,
      count: monthlyCounts[month],
    }));
  };

  const chartData = processData();

  const config = {
    data: chartData,
    xField: "month",
    yField: "count",
    smooth: true,
    padding: "auto",
    point: {
      size: 5,
      shape: "diamond",
      style: {
        fill: "white",
        stroke: token.colorPrimary,
        lineWidth: 2,
      },
    },
    tooltip: {
      showMarkers: true,
      title: (d: any) => d.month,
      items: [
        (d: any) => ({
          name: "จำนวนงาน",
          value: d.count + " รายการ",
        }),
      ],
    },
    lineStyle: {
      stroke: token.colorPrimary,
      lineWidth: 3,
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    yAxis: {
      min: 0,
      tickCount: 5,
    },
    interactions: [{ type: "marker-active" }],
  };

  return (
    <Card
      title={
        <span style={{ fontWeight: 600 }}>
          <AreaChartOutlined
            style={{ marginRight: 8, color: token.colorPrimary }}
          />
          แผนภูมิปริมาณงานที่ต้องแล้วเสร็จ (Monthly Workload Forecast{" "}
          {dayjs().year()})
        </span>
      }
      styles={{ body: { padding: 24, minHeight: 400 } }}
      style={{
        marginTop: 24,
        borderColor: token.colorBorderSecondary,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {isFetching ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 350,
          }}
        >
          <Spin>
            <div style={{ paddingTop: 40 }}>กำลังประมวลผลข้อมูล...</div>
          </Spin>
        </div>
      ) : chartData.length > 0 ? (
        <Line {...config} />
      ) : (
        <Empty description="ไม่พบข้อมูลงานสำหรับแสดงผลในปีนี้" />
      )}
    </Card>
  );
};

export default WorkloadTimeSeries;
