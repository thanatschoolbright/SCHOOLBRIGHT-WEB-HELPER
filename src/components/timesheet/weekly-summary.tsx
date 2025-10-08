"use client";

import {Collapse, Skeleton} from "antd";
import React from "react";

import {DailyCard, DailySummaryItem} from "@components/card/daily-card";

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
        return (
            <Collapse style={{width: "100%"}}>
                <Collapse.Panel
                    header="กำลังโหลดข้อมูลสรุปชั่วโมงรายวัน..."
                    key="1"
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 20,
                        }}
                    >
                        {Array.from({length: 7}).map((_, index) => (
                            <Skeleton
                                key={index}
                                active
                                paragraph={{rows: 3}}
                                title={{width: "60%"}}
                            />
                        ))}
                    </div>
                </Collapse.Panel>
            </Collapse>
        );
    }

    if (!weeklySummary.length) {
        return null;
    }

    return (
        <Collapse defaultActiveKey={["1"]} style={{width: "100%"}}>
            <Collapse.Panel
                header={`สรุปชั่วโมงรายวัน (เป้าหมาย ${targetHours} ชม./วัน)`}
                key="1"
            >
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
            </Collapse.Panel>
        </Collapse>
    );
};
