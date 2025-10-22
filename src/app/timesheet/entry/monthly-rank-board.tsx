"use client";

import {Card, Skeleton, Space, theme, Typography} from "antd";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import dayjs, {Dayjs} from "dayjs";
import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState,} from "react";
import {toast} from "sonner";

import {RankBoardHeader} from "@components/timesheet/rank-board-header";
import {RankCard} from "@components/timesheet/rank-card";
import {ApiResponse, SummaryMetadata, SummaryRecord} from "@/types/timesheet";

const API_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";
const MAX_ROWS = 8;
const TOAST_ID = "monthly-rank-toast";

type MonthlyRankVariant = "compact" | "wide";

interface MonthlyRankBoardProps {
    currentAdminId?: number;
    variant?: MonthlyRankVariant;
}

export interface MonthlyRankBoardRef {
    refetch: () => void;
}

/**
 * Hook สำหรับจัดการข้อมูลอันดับรายเดือน
 */
const useMonthlyRankData = () => {
    const [records, setRecords] = useState<SummaryRecord[]>([]);
    const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

    const fetchData = useCallback(async (showToast = false) => {
        setLoading(true);
        if (showToast) {
            toast.loading("กำลังโหลดข้อมูลอันดับ...", {id: TOAST_ID});
        }

        try {
            const payload = {
                month: selectedMonth.format("M"),
                year: selectedMonth.format("YYYY"),
            };

            const response = await axios.post<ApiResponse>(API_ENDPOINT, payload, {
                headers: {"Content-Type": "application/json"},
            });

            const apiData = response.data?.data;
            setRecords(apiData?.records ?? []);
            setMetadata(apiData?.metadata ?? null);

            if (showToast) {
                toast.success("โหลดข้อมูลสำเร็จ!", {id: TOAST_ID});
            }
        } catch (error: any) {
            console.error("fetchMonthlyRank", error);
            const errorMessage =
                error?.response?.data?.message_th ||
                error?.message ||
                "ไม่สามารถโหลดข้อมูลอันดับประจำเดือนได้";
            if (showToast) {
                toast.error(errorMessage, {id: TOAST_ID});
            }
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        records,
        metadata,
        loading,
        refetch: () => fetchData(true),
        selectedMonth,
        setSelectedMonth,
    };
};

/**
 * Component หลักสำหรับแสดงบอร์ดอันดับการทำเวลาประจำเดือน
 * @param props - Props ของ Component
 */
export const MonthlyRankBoard = forwardRef<
    MonthlyRankBoardRef,
    MonthlyRankBoardProps
>(({currentAdminId, variant = "wide"}, ref) => {
    const {token} = theme.useToken();
    const {
        records,
        metadata,
        loading,
        refetch,
        selectedMonth,
        setSelectedMonth,
    } = useMonthlyRankData();

    useImperativeHandle(ref, () => ({
        refetch,
    }));

    const visibleRecords = useMemo(() => {
        if (currentAdminId) {
            const selfRecord = records.find(
                (record) => record.admin_id === currentAdminId
            );
            return selfRecord ? [selfRecord] : [];
        }
        return records.slice(0, MAX_ROWS);
    }, [currentAdminId, records]);

    const monthLabel =
        metadata?.range?.label_th ?? selectedMonth.format("MMMM YYYY");
    const generatedAt = metadata?.generated_at
        ? dayjs(metadata.generated_at).format("DD/MM/YYYY HH:mm")
        : null;

    const isCompact = variant === "compact";
    const cardStyle: React.CSSProperties = {
        borderRadius: isCompact ? 12 : 16,
        boxShadow: "none",
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        minWidth: isCompact ? 260 : undefined,
        width: isCompact ? 300 : undefined,
    };

    return (
        <Card
            style={cardStyle}
            styles={{body: {padding: isCompact ? 18 : 20}}}
        >
            <RankBoardHeader
                monthLabel={monthLabel}
                generatedAt={generatedAt}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                onRefresh={refetch}
                loading={loading}
                isCompact={isCompact}
            />

            <div style={{marginTop: isCompact ? 12 : 16}}>
                {loading && visibleRecords.length === 0 ? (
                    <Space
                        direction="vertical"
                        size={isCompact ? 10 : 14}
                        style={{width: "100%"}}
                    >
                        {Array.from({length: isCompact ? 1 : 3}).map((_, index) => (
                            <Skeleton
                                key={index}
                                active
                                avatar={{shape: "circle"}}
                                paragraph={{rows: 2}}
                                title={false}
                            />
                        ))}
                    </Space>
                ) : !loading && visibleRecords.length === 0 ? (
                    <Typography.Text type="secondary">
                        {currentAdminId
                            ? "ยังไม่มีข้อมูลของคุณในเดือนนี้"
                            : "ยังไม่มีข้อมูลอันดับประจำเดือน"}
                    </Typography.Text>
                ) : (
                    <Space
                        direction="vertical"
                        size={isCompact ? 10 : 14}
                        style={{width: "100%"}}
                    >
                        {visibleRecords.map((record) => (
                            <RankCard
                                key={record.admin_id}
                                record={record}
                                isCompact={isCompact}
                            />
                        ))}
                    </Space>
                )}
            </div>
        </Card>
    );
});

MonthlyRankBoard.displayName = "MonthlyRankBoard";
