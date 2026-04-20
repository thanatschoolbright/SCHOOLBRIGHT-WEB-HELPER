"use client";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Button,
  Card,
  Divider,
  Empty,
  Segmented,
  Skeleton,
  Space,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

import {
  CompressOutlined,
  ExpandAltOutlined,
  ReloadOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import { ApiResponse, SummaryMetadata, SummaryRecord } from "@/types/timesheet";
import { RankBoardHeader } from "@components/timesheet/rank-board-header";
import { RankCard } from "@components/timesheet/rank-card";

const API_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";
const API_FIND_RANK_ENDPOINT = "/api/v1/timesheet/find-ranking";
const MAX_ROWS = 8;

type MonthlyRankVariant = "compact" | "wide";

interface MonthlyRankBoardProps {
  currentAdminId?: number;
  variant?: MonthlyRankVariant; // ค่า Default เริ่มต้น
  onVariantChange?: (variant: MonthlyRankVariant) => void;
}

export interface MonthlyRankBoardRef {
  refetch: () => void;
}

const useMonthlyRankData = (adminId?: number) => {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // ใช้ endpoint ใหม่ที่รับ user_id เพื่อลดขนาด response (Optimization)
      const endpoint = adminId ? API_FIND_RANK_ENDPOINT : API_ENDPOINT;
      const payload: any = {
        month: selectedMonth.format("M"),
        year: selectedMonth.format("YYYY"),
      };

      if (adminId) {
        payload.user_id = adminId;
      }

      const response = await axios.post<ApiResponse>(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const apiData = response.data?.data;

      if (adminId) {
        // find-ranking API จะตอบกลับมาเป็น { record, metadata }
        const record = (apiData as any)?.record;
        setRecords(record ? [record] : []);
      } else {
        // summary-month API จะตอบกลับมาเป็น { records, metadata }
        setRecords(apiData?.records ?? []);
      }

      setMetadata(apiData?.metadata ?? null);
    } catch (error: any) {
      console.error("fetchMonthlyRank", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, adminId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    records,
    metadata,
    loading,
    refetch: () => fetchData(),
    selectedMonth,
    setSelectedMonth,
  };
};

export const MonthlyRankBoard = forwardRef<
  MonthlyRankBoardRef,
  MonthlyRankBoardProps
>(({ currentAdminId, variant = "wide", onVariantChange }, ref) => {
  const { token } = theme.useToken();
  const {
    records,
    metadata,
    loading,
    refetch,
    selectedMonth,
    setSelectedMonth,
  } = useMonthlyRankData(currentAdminId);

  // State สำหรับจัดการโหมดการแสดงผล (User Toggle)
  const [viewMode, setViewMode] = useState<MonthlyRankVariant>(variant);

  useImperativeHandle(ref, () => ({
    refetch,
  }));

  const handleVariantChange = (val: MonthlyRankVariant) => {
    setViewMode(val);
    if (onVariantChange) {
      onVariantChange(val);
    }
  };

  const visibleRecords = useMemo(() => {
    if (currentAdminId) {
      const selfRecord = records.find(
        (record) => record.admin_id === currentAdminId,
      );
      return selfRecord ? [selfRecord] : [];
    }
    return records.slice(0, MAX_ROWS);
  }, [currentAdminId, records]);

  const monthLabel =
    metadata?.range?.label_th ?? selectedMonth.format("MMMM BBBB");
  const generatedAt = metadata?.generated_at
    ? dayjs(metadata.generated_at).format("D MMM BBBB HH:mm")
    : null;

  // ใช้ viewMode จาก State แทน Prop ตรงๆ
  const isCompact = viewMode === "compact";

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <Card
      style={{
        borderRadius: 24,
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
        background: `linear-gradient(145deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
        // ปรับความกว้างตามโหมด
        maxWidth: isCompact ? 380 : "100%",
        minWidth: isCompact ? 300 : undefined,
        width: "100%",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", // Animation เมื่อเปลี่ยนขนาด
      }}
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: token.colorPrimary,
          opacity: 0.05,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* --- Header Section --- */}
      <div style={{ padding: "24px 24px 16px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Title Area */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TrophyFilled style={{ color: token.colorPrimary }} />
              <span
                style={{
                  background: `linear-gradient(90deg, ${token.colorText} 0%, ${token.colorTextSecondary} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {currentAdminId ? "สถิติของคุณ" : "อันดับประจำเดือน"}
              </span>
            </Typography.Title>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, marginTop: 4 }}
            >
              {generatedAt
                ? `อัปเดตล่าสุด: ${generatedAt}`
                : "กำลังรอข้อมูล..."}
            </Typography.Text>
          </div>

          {/* Control Area (View Toggle + Refresh) */}
          <Space>
            <Tooltip title="ปรับมุมมอง">
              <Segmented
                options={[
                  {
                    value: "wide",
                    icon: <ExpandAltOutlined />,
                    label: !isCompact ? "ปกติ" : undefined, // ซ่อน Text ถ้าจอเล็ก
                  },
                  {
                    value: "compact",
                    icon: <CompressOutlined />,
                    label: !isCompact ? "เล็ก" : undefined,
                  },
                ]}
                value={viewMode}
                onChange={(val) =>
                  handleVariantChange(val as MonthlyRankVariant)
                }
                style={{ background: token.colorFillTertiary }}
              />
            </Tooltip>

            <Button
              type="text"
              shape="circle"
              icon={<ReloadOutlined spin={loading} />}
              onClick={refetch}
              style={{ color: token.colorTextTertiary }}
            />
          </Space>
        </div>

        <RankBoardHeader
          monthLabel={monthLabel}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          loading={loading}
          isCompact={isCompact}
          generatedAt={null}
          onRefresh={refetch}
        />
      </div>

      <Divider style={{ margin: 0, borderColor: token.colorBorderSecondary }} />

      {/* --- Metadata Stats Section (Extra Redesign) --- */}
      {metadata && !isCompact && (
        <div
          style={{
            padding: "12px 24px",
            background: token.colorFillAlter,
            display: "flex",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              WORKING DAYS
            </Typography.Text>
            <Typography.Text strong>
              {metadata.working_days} / {metadata.working_days_full_month || 20}{" "}
              วัน
            </Typography.Text>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              EXPECTED HOURS
            </Typography.Text>
            <Typography.Text strong>
              {metadata.expected_hours_per_member || 0} ชม.
            </Typography.Text>
          </div>
        </div>
      )}
      <div
        style={{
          padding: "16px 24px 24px 24px",
          minHeight: 200,
          position: "relative",
        }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {Array.from({ length: currentAdminId ? 1 : 4 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "8px 12px",
                        background: token.colorBgContainer,
                        borderRadius: 12,
                      }}
                    >
                      <Skeleton.Avatar active size={40} shape="circle" />
                      <div style={{ flex: 1 }}>
                        <Skeleton.Input
                          active
                          style={{
                            width: "40%",
                            height: 16,
                            borderRadius: 4,
                            marginBottom: 6,
                          }}
                        />
                        <Skeleton.Input
                          active
                          style={{ width: "70%", height: 12, borderRadius: 4 }}
                        />
                      </div>
                      <Skeleton.Button
                        active
                        style={{ width: 40, height: 24, borderRadius: 12 }}
                      />
                    </div>
                  ),
                )}
              </Space>
            </motion.div>
          ) : visibleRecords.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: 180,
                textAlign: "center",
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <Typography.Text strong style={{ fontSize: 16 }}>
                      ไม่พบข้อมูล
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {currentAdminId
                        ? "คุณไม่มีบันทึกเวลาในเดือนนี้"
                        : "ยังไม่มีการจัดอันดับในเดือนนี้"}
                    </Typography.Text>
                  </div>
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {visibleRecords.map((record) => (
                  <motion.div
                    key={record.admin_id}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <RankCard
                      record={record}
                      isCompact={isCompact}
                      isCurrentUser={record.admin_id === currentAdminId}
                      rank={String(record.order)}
                    />
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
