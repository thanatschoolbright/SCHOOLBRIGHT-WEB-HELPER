"use client";

import { Collapse, Skeleton } from "antd";
import React from "react";

import { DailyCard, DailySummaryItem } from "@components/card/daily-card";

interface WeeklySummaryProps {
  weeklySummary: DailySummaryItem[];
  targetHours?: number;
  loading?: boolean;
}

/**
 * Component สำหรับแสดงสรุปชั่วโมงรายวัน
 * @param props - Props ของ Component
 */
export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
  weeklySummary,
  targetHours = 8,
  loading = false,
}) => {
  if (loading) {
    const items = [
      {
        key: "1",
        label: "กำลังโหลดข้อมูลสรุปชั่วโมงรายวัน...",
        children: (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={index}
                active
                paragraph={{ rows: 3 }}
                title={{ width: "60%" }}
              />
            ))}
          </div>
        ),
      },
    ];

    return <Collapse style={{ width: "100%" }} items={items} />;
  }

  if (!weeklySummary.length) {
    return null;
  }

  const items = [
    {
      key: "1",
      label: `สรุปชั่วโมงรายวัน (เป้าหมาย ${targetHours} ชม./วัน)`,
      children: (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          {weeklySummary.map((item) => (
            <DailyCard
              key={item.dateKey}
              item={item}
              targetHours={targetHours}
              loading={loading}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <Collapse
      defaultActiveKey={["1"]}
      style={{ width: "100%" }}
      items={items}
    />
  );
};
