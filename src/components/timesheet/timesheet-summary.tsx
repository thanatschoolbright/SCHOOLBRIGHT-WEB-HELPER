"use client";

import React, {forwardRef} from "react";
import {useSelector} from "react-redux";

import {UsageCard} from "@components/card/usage-card";
import { MonthlyRankBoard, MonthlyRankBoardRef } from "@/app/timesheet/entry/monthly-rank-board";
import {useTopUsage} from "@/hooks/use-timesheet-data";
import {RootState} from "@stores/store";

interface TimesheetSummaryProps {
    adminId?: number;
    style?: React.CSSProperties;
}

//** Component: แสดงการ์ดสรุปข้อมูลด้านบน (อันดับ, โปรเจกต์/ฟีเจอร์ที่ใช้เวลามากที่สุด) */
const TimesheetSummary = forwardRef<MonthlyRankBoardRef, TimesheetSummaryProps>(({adminId, style}, ref) => {
    const {entries, loading} = useSelector((state: RootState) => state.timesheet);
    const {topProjectUsage, topFeatureUsage} = useTopUsage(entries);

    const defaultStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "flex-end",
        gap: 16,
        flexWrap: "wrap",
        width: '100%',
    };

    return (
        <div style={{...defaultStyle, ...style}}>
            {/* บอร์ดอันดับรายเดือน */}
            <MonthlyRankBoard
                ref={ref}
                currentAdminId={adminId}
                variant="wide"
            />

            {/* การ์ดโปรเจกต์ที่ใช้เวลามากที่สุด */}
            {topProjectUsage && (
                <UsageCard
                    title="โปรเจกต์ที่ใช้เวลามากที่สุด"
                    highlight={topProjectUsage.name}
                    hours={topProjectUsage.hours}
                    accent="#38bdf8"
                    loading={loading}
                />
            )}

            {/* การ์ดฟีเจอร์ที่ใช้เวลามากที่สุด */}
            {topFeatureUsage && (
                <UsageCard
                    title="ฟีเจอร์ที่ใช้เวลามากที่สุด"
                    highlight={topFeatureUsage.name}
                    hours={topFeatureUsage.hours}
                    accent="#fb7185"
                    loading={loading}
                />
            )}
        </div>
    );
});

TimesheetSummary.displayName = "TimesheetSummary";

export default TimesheetSummary;

