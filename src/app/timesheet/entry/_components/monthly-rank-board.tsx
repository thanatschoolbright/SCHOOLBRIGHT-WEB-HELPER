"use client";

import {
  FireOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Skeleton,
  Space,
  theme,
  Typography,
} from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRankingStore } from "../_state/use-ranking-store";

/**
 * MonthlyRankBoard - ส่วนแสดงผลการจัดอันดับพนักงานประจำเดือน
 */
interface MonthlyRankBoardProps {
  currentAdminId?: number;
}

interface MonthlyRankBoardRef {
  refetch: () => void;
}

export const MonthlyRankBoard = forwardRef<
  MonthlyRankBoardRef,
  MonthlyRankBoardProps
>(({ currentAdminId }, ref) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const {
    records,
    metadata,
    loading,
    fetchRanking,
    selectedMonth,
    setSelectedMonth,
  } = useRankingStore();

  useImperativeHandle(ref, () => ({
    refetch: () => fetchRanking(currentAdminId, true),
  }));

  useEffect(() => {
    fetchRanking(currentAdminId);
  }, [currentAdminId, selectedMonth, fetchRanking]);

  const visibleRecords = useMemo(() => {
    if (currentAdminId) {
      return records;
    }
    return records.slice(0, 8);
  }, [currentAdminId, records]);

  const monthLabel =
    metadata?.range?.label_th ?? selectedMonth.format("MMMM BBBB");

  return (
    <Card
      hoverable
      style={{
        height: "100%",
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: "hidden",
      }}
      styles={{ body: { padding: 0, height: "100%" } }}
    >
      <Flex vertical style={{ height: "100%" }}>
        {/* Header Section */}
        <Flex vertical gap={16} style={{ padding: 24, paddingBottom: 16 }}>
          <Flex justify="space-between" align="start">
            <Flex vertical gap={4}>
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontWeight: 600,
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: token.colorWarningBg,
                  }}
                >
                  <TrophyFilled
                    style={{ color: token.colorWarning, fontSize: 18 }}
                  />
                </Flex>
                <span style={{ color: token.colorTextHeading }}>
                  {currentAdminId
                    ? t("timesheet_entry_page.your_rank", "อันดับของคุณ")
                    : t(
                        "timesheet_entry_page.employee_of_the_month",
                        "พนักงานดีเด่น",
                      )}
                </span>
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <Space size={4}>
                  <FireOutlined style={{ color: token.colorError }} />
                  {t(
                    "timesheet_entry_page.who_is_most_diligent",
                    "ใครขยันที่สุดในเดือนนี้?",
                  )}
                </Space>
              </Typography.Text>
            </Flex>
          </Flex>

          {/* Month Controller */}
          <Flex
            align="center"
            justify="space-between"
            style={{
              background: token.colorFillAlter,
              padding: "8px 12px",
              borderRadius: 12,
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              onClick={() =>
                setSelectedMonth(selectedMonth.subtract(1, "month"))
              }
            />
            <Typography.Text strong style={{ fontSize: 13 }}>
              {monthLabel}
            </Typography.Text>
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
            />
          </Flex>
        </Flex>

        {/* Content Section */}
        <Flex
          vertical
          flex={1}
          style={{
            padding: "0 24px 24px",
            overflowY: "auto",
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
                style={{ width: "100%" }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {Array.from({ length: currentAdminId ? 1 : 4 }).map(
                    (_, i) => (
                      <Flex
                        key={i}
                        align="center"
                        gap={16}
                        style={{
                          padding: 12,
                          borderRadius: 16,
                          background: token.colorFillAlter,
                        }}
                      >
                        <Skeleton.Avatar active size={40} shape="circle" />
                        <Flex vertical flex={1} gap={4}>
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ width: "40%", height: 16 }}
                          />
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ width: "70%", height: 12 }}
                          />
                        </Flex>
                      </Flex>
                    ),
                  )}
                </Space>
              </motion.div>
            ) : visibleRecords.length === 0 ? (
              <Flex
                flex={1}
                vertical
                justify="center"
                align="center"
                style={{ minHeight: 180 }}
              >
                <Empty
                  description={
                    <Typography.Text strong>ไม่พบข้อมูล</Typography.Text>
                  }
                />
              </Flex>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {visibleRecords.map((record: any, index) => (
                    <Card
                      key={record.admin_id}
                      size="small"
                      bordered={false}
                      style={{
                        background:
                          record.admin_id === currentAdminId
                            ? token.colorPrimaryBg
                            : token.colorFillAlter,
                        borderRadius: 16,
                      }}
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap={12}>
                          <Badge
                            count={record.rank || record.order}
                            color={
                              index < 3
                                ? token.colorWarning
                                : token.colorTextDisabled
                            }
                          >
                            <Avatar
                              size={40}
                              src={record.admin_avatar}
                              icon={!record.admin_avatar && "👤"}
                            />
                          </Badge>
                          <Flex vertical>
                            <Typography.Text strong>
                              {record.full_name || record.admin_name}
                            </Typography.Text>
                            <Typography.Text
                              type="secondary"
                              style={{ fontSize: 11 }}
                            >
                              {record.position || record.employee_code}
                            </Typography.Text>
                          </Flex>
                        </Flex>
                        <Flex vertical align="end">
                          <Typography.Text
                            strong
                            style={{ color: token.colorPrimary }}
                          >
                            {record.total_hours} / {record.expected_hours} ชม.
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 10 }}
                          >
                            {record.completion_rate}% -{" "}
                            {record.rank_description}
                          </Typography.Text>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Space>
              </motion.div>
            )}
          </AnimatePresence>
        </Flex>

        {/* Footer */}
        <Flex
          justify="center"
          align="center"
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchRanking(currentAdminId, true)}
            style={{ color: token.colorTextSecondary }}
          >
            {t("timesheet_entry_page.update_data", "อัปเดตข้อมูล")}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
});

MonthlyRankBoard.displayName = "MonthlyRankBoard";
