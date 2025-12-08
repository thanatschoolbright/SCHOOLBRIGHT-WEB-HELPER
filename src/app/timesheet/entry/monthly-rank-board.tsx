"use client";

import { Card, Skeleton, Space, theme, Typography, Empty, Divider } from "antd";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import dayjs, { Dayjs } from "dayjs";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion"; // เพิ่ม Animation Library

import { RankBoardHeader } from "@components/timesheet/rank-board-header";
import { RankCard } from "@components/timesheet/rank-card";
import { ApiResponse, SummaryMetadata, SummaryRecord } from "@/types/timesheet";

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

  const fetchData = useCallback(
    async (showToast = false) => {
      setLoading(true);
      if (showToast) {
        toast.loading("กำลังโหลดข้อมูลอันดับ...", { id: TOAST_ID });
      }

      try {
        const payload = {
          month: selectedMonth.format("M"),
          year: selectedMonth.format("YYYY"),
        };

        const response = await axios.post<ApiResponse>(API_ENDPOINT, payload, {
          headers: { "Content-Type": "application/json" },
        });

        const apiData = response.data?.data;
        setRecords(apiData?.records ?? []);
        setMetadata(apiData?.metadata ?? null);

        if (showToast) {
          toast.success("โหลดข้อมูลสำเร็จ!", { id: TOAST_ID });
        }
      } catch (error: any) {
        console.error("fetchMonthlyRank", error);
        const errorMessage =
          error?.response?.data?.message_th ||
          error?.message ||
          "ไม่สามารถโหลดข้อมูลอันดับประจำเดือนได้";
        if (showToast) {
          toast.error(errorMessage, { id: TOAST_ID });
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth]
  );

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
 * Enhanced with Enterprise styling and Framer Motion
 */
export const MonthlyRankBoard = forwardRef<
  MonthlyRankBoardRef,
  MonthlyRankBoardProps
>(({ currentAdminId, variant = "wide" }, ref) => {
  const { token } = theme.useToken();
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

  // Dynamic Styles based on Token
  const cardStyle: React.CSSProperties = {
    borderRadius: token.borderRadiusLG, // ใช้ Token เพื่อความโค้งที่สม่ำเสมอทั้ง App
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)", // Soft shadow แบบ Modern UI
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    minWidth: isCompact ? 280 : undefined,
    width: isCompact ? 320 : "100%",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <Card
      style={cardStyle}
      styles={{
        body: {
          padding: isCompact ? "16px 20px" : "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        },
      }}
    >
      {/* --- Header Section --- 
         ส่วนหัวของ Card ประกอบด้วยชื่อเดือน การเลือกเดือน และปุ่ม Refresh 
         ถูกแยก Component ออกไปเพื่อ Clean Code
      */}
      <RankBoardHeader
        monthLabel={monthLabel}
        generatedAt={generatedAt}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onRefresh={refetch}
        loading={loading}
        isCompact={isCompact}
      />

      <Divider style={{ margin: "4px 0 12px 0" }} dashed />

      {/* --- Content Section --- 
         ส่วนแสดงผลข้อมูล หรือ Skeleton หรือ Empty State
         ใช้ AnimatePresence เพื่อทำ Animation ตอนข้อมูลเข้า/ออก
      */}
      <div style={{ position: "relative", minHeight: 200 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            /* --- Loading State --- 
                แสดง Skeleton เมื่อกำลังโหลดข้อมูล 
                ใช้ key="loading" เพื่อให้ Framer Motion รู้ว่าเป็นคนละ state กัน
             */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {Array.from({ length: isCompact ? 3 : 5 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "8px 0",
                    }}
                  >
                    <Skeleton.Avatar active size="large" shape="circle" />
                    <Skeleton.Input
                      active
                      style={{ width: "60%", height: 20, borderRadius: 4 }}
                    />
                  </div>
                ))}
              </Space>
            </motion.div>
          ) : visibleRecords.length === 0 ? (
            /* --- Empty State --- 
                แสดงเมื่อโหลดเสร็จแต่ไม่มีข้อมูล 
                ใช้ Component Empty ของ Ant Design เพื่อความสวยงาม
             */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text type="secondary">
                    {currentAdminId
                      ? "ไม่พบข้อมูลของคุณในเดือนนี้"
                      : "ยังไม่มีข้อมูลการจัดอันดับ"}
                  </Typography.Text>
                }
              />
            </motion.div>
          ) : (
            /* --- Data List State --- 
                แสดงรายการอันดับจริง 
                ใช้ motion.div ครอบแต่ละ Card เพื่อทำ Animation แบบ Stagger (เรียงกันขึ้นมา)
             */
            <motion.div key="list">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {visibleRecords.map((record, index) => (
                  <motion.div
                    key={record.admin_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.05, // หน่วงเวลาแต่ละ Item เล็กน้อยให้ดูเป็นลำดับ
                      duration: 0.3,
                    }}
                  >
                    <RankCard record={record} isCompact={isCompact} />
                  </motion.div>
                ))}
              </Space>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
});

MonthlyRankBoard.displayName = "MonthlyRankBoard";
