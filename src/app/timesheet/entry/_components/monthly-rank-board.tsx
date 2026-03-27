"use client";

import {
  CalendarOutlined,
  FireOutlined,
  IdcardOutlined,
  LeftOutlined,
  MailOutlined,
  PhoneOutlined,
  RightOutlined,
  SafetyCertificateFilled,
  StarFilled,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Row,
  Skeleton,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRankingStore } from "../_state/use-ranking-store";

/**
 * MonthlyRankBoard - ส่วนแสดงผลการจัดอันดับพนักงานประจำเดือน
 */
export interface MonthlyRankBoardProps {
  currentAdminId?: number;
  variant?: "compact" | "full";
}

export interface MonthlyRankBoardRef {
  refetch: () => void;
}

export const MonthlyRankBoard = forwardRef<
  MonthlyRankBoardRef,
  MonthlyRankBoardProps
>(({ currentAdminId, variant = "full" }, ref) => {
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

  const monthLabel =
    metadata?.range?.label_th ?? selectedMonth.format("MMMM BBBB");

  const myRecord = useMemo(() => {
    return records[0] || null;
  }, [records]);

  if (loading && currentAdminId) {
    return (
      <Card
        variant="outlined"
        style={{
          height: "100%",
          borderRadius: 24,
          background: token.colorBgContainer,
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex vertical gap={24}>
          <Flex align="center" gap={16}>
            <Skeleton.Avatar active size={64} shape="circle" />
            <Flex vertical gap={12} style={{ flex: 1 }}>
              <Skeleton.Button
                active
                size="small"
                style={{ width: "40%", height: 24 }}
              />
              <Skeleton.Button
                active
                size="small"
                style={{ width: "60%", height: 20 }}
              />
            </Flex>
          </Flex>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Skeleton.Button
                active
                block
                style={{ height: 80, borderRadius: 16 }}
              />
            </Col>
            <Col span={12}>
              <Skeleton.Button
                active
                block
                style={{ height: 80, borderRadius: 16 }}
              />
            </Col>
          </Row>
          <Skeleton.Button
            active
            block
            style={{ height: 100, borderRadius: 16 }}
          />
        </Flex>
      </Card>
    );
  }

  if (!myRecord && !loading && currentAdminId) {
    return (
      <Card
        variant="outlined"
        style={{
          height: "100%",
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Flex vertical gap={8} align="center">
              <Typography.Text strong style={{ fontSize: 16 }}>
                ไม่พบข้อมูลของคุณในรายการเดือนนี้
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                เริ่มบันทึกเวลาทำงานวันนี้ เพื่อไต่อันดับของคุณ!
              </Typography.Text>
            </Flex>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      style={{
        height: "100%",
        borderRadius: 24,
        background: token.colorBgContainer,
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        border: `1px solid ${token.colorBorderSecondary}`,
        position: "relative",
        overflow: "hidden",
      }}
      styles={{ body: { padding: 24 } }}
    >
      {/* Background Decorative Element */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          fontSize: 120,
          color: token.colorPrimary,
          opacity: 0.03,
          transform: "rotate(15deg)",
          pointerEvents: "none",
        }}
      >
        <TrophyFilled />
      </div>

      <Flex vertical gap={24}>
        {/* Profile Section */}
        <Flex justify="space-between" align="start">
          <Flex align="center" gap={20}>
            <Badge
              offset={[-5, 55]}
              count={
                <div
                  style={{
                    background: token.colorWarning,
                    color: "#fff",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `3px solid ${token.colorBgContainer}`,
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  {myRecord?.order || 0}
                </div>
              }
            >
              <Avatar
                size={80}
                src={myRecord?.admin_avatar}
                icon={<UserOutlined />}
                style={{
                  border: `4px solid ${token.colorPrimaryBg}`,
                  boxShadow: `0 0 0 2px ${token.colorPrimary}`,
                }}
              />
            </Badge>
            <Flex vertical gap={4}>
              <Typography.Title
                level={4}
                style={{ margin: 0, fontWeight: 700 }}
              >
                {myRecord?.full_name} ({myRecord?.nickname})
              </Typography.Title>
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  <IdcardOutlined style={{ marginRight: 6 }} />
                  {myRecord?.employee_code} • {myRecord?.position}
                </Typography.Text>
                <Space size={12}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <MailOutlined style={{ marginRight: 6 }} />
                    {myRecord?.email}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <PhoneOutlined style={{ marginRight: 6 }} />
                    {myRecord?.tel}
                  </Typography.Text>
                </Space>
              </Space>
            </Flex>
          </Flex>

          <Flex vertical align="end" gap={8}>
            <DatePickerContainer
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              label={monthLabel}
            />
            <Tag
              color={myRecord?.rank === "A" ? "gold" : "blue"}
              style={{
                borderRadius: 20,
                padding: "4px 16px",
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                border: "none",
              }}
              icon={<SafetyCertificateFilled />}
            >
              Rank {myRecord?.rank || "N/A"}
            </Tag>
          </Flex>
        </Flex>

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <StatItem
              icon={<FireOutlined style={{ color: token.colorError }} />}
              label="ชั่วโมงทั้งหมด"
              value={myRecord?.total_hours || 0}
              suffix="ชม."
              color={token.colorErrorBg}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatItem
              icon={<StarFilled style={{ color: token.colorWarning }} />}
              label="อัตราการทำงาน"
              value={myRecord?.completion_rate || 0}
              suffix="%"
              color={token.colorWarningBg}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatItem
              icon={<CalendarOutlined style={{ color: token.colorPrimary }} />}
              label="เป้าหมาย"
              value={myRecord?.expected_hours || 0}
              suffix="ชม."
              color={token.colorPrimaryBg}
            />
          </Col>
        </Row>

        {/* Motivation Card */}
        <div
          style={{
            background: token.colorFillAlter,
            padding: "16px 20px",
            borderRadius: 20,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: token.colorBgContainer,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              <StarFilled style={{ color: token.colorWarning }} />
            </div>
            <Flex vertical>
              <Typography.Text strong style={{ fontSize: 15 }}>
                {myRecord?.rank_description}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {metadata?.notes || "ขอบคุณที่ตั้งใจทำงานอย่างเต็มความสามารถ"}
              </Typography.Text>
            </Flex>
          </Flex>
        </div>
      </Flex>
    </Card>
  );
});

/**
 * Helper: Stat Item for Grid
 */
const StatItem = ({ icon, label, value, suffix, color }: any) => {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        background: color,
        padding: "16px",
        borderRadius: 20,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Space style={{ fontSize: 12, opacity: 0.8 }}>
        {icon}
        <Typography.Text style={{ fontSize: 12 }}>{label}</Typography.Text>
      </Space>
      <Flex align="baseline" gap={4}>
        <Typography.Text strong style={{ fontSize: 24, lineHeight: 1 }}>
          {value}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {suffix}
        </Typography.Text>
      </Flex>
    </div>
  );
};

/**
 * Helper: Month Selector
 */
const DatePickerContainer = ({
  selectedMonth,
  setSelectedMonth,
  label,
}: any) => {
  const { token } = theme.useToken();
  return (
    <Flex
      align="center"
      gap={8}
      style={{
        background: token.colorFillAlter,
        padding: "4px 8px",
        borderRadius: 30,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Button
        type="text"
        size="small"
        shape="circle"
        icon={<LeftOutlined style={{ fontSize: 10 }} />}
        onClick={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
      />
      <Typography.Text
        strong
        style={{ fontSize: 12, minWidth: 80, textAlign: "center" }}
      >
        {label}
      </Typography.Text>
      <Button
        type="text"
        size="small"
        shape="circle"
        icon={<RightOutlined style={{ fontSize: 10 }} />}
        onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
      />
    </Flex>
  );
};

MonthlyRankBoard.displayName = "MonthlyRankBoard";
