"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FireOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Segmented,
  Skeleton,
  Statistic,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const { Text } = Typography;

// ช่วงเวลาที่เลือกได้ใน Segmented Control
type RangeKey = "this_month" | "last_month" | "last_3_months" | "this_year";

const RANGE_OPTIONS: { label: string; value: RangeKey }[] = [
  { label: "เดือนนี้", value: "this_month" },
  { label: "เดือนที่แล้ว", value: "last_month" },
  { label: "3 เดือน", value: "last_3_months" },
  { label: "ปีนี้", value: "this_year" },
];

interface PersonalOtSummaryProps {
  userId: string | number;
  isAdmin?: boolean;
  fetchFn: (params: { from: string; to: string; request_id: string }) => Promise<any[] | null>;
}

interface SummaryStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
  approvedHours: number;
  avgHoursPerRequest: number;
  longestWaitDays: number;
  mostRecentStatus: string | null;
}

// คำนวณช่วงวันตาม RangeKey ที่เลือก
const calcDateRange = (range: RangeKey): { from: string; to: string; label: string } => {
  const now = dayjs();
  switch (range) {
    case "this_month":
      return {
        from: now.startOf("month").toISOString(),
        to: now.endOf("month").toISOString(),
        label: now.format("MMMM BBBB"),
      };
    case "last_month": {
      const last = now.subtract(1, "month");
      return {
        from: last.startOf("month").toISOString(),
        to: last.endOf("month").toISOString(),
        label: last.format("MMMM BBBB"),
      };
    }
    case "last_3_months":
      return {
        from: now.subtract(3, "month").startOf("month").toISOString(),
        to: now.endOf("month").toISOString(),
        label: `${now.subtract(2, "month").format("MMMM")} – ${now.format("MMMM BBBB")}`,
      };
    case "this_year":
      return {
        from: now.startOf("year").toISOString(),
        to: now.endOf("year").toISOString(),
        label: `ปี ${now.format("BBBB")}`,
      };
  }
};

// คำนวณตัวเลขสรุปจาก raw overtime records
const computeStats = (records: any[]): SummaryStats => {
  const total = records.length;
  const pending = records.filter((r) => r.status === "pending").length;
  const approved = records.filter((r) =>
    ["approved", "paid"].includes(r.status || ""),
  ).length;
  const rejected = records.filter((r) =>
    ["rejected", "cancelled"].includes(r.status || ""),
  ).length;

  const sumHours = (items: any[]) =>
    items.reduce(
      (acc, r) =>
        acc +
        (r.descriptions ?? []).reduce(
          (s: number, d: any) => s + Number(d.duration || 0),
          0,
        ),
      0,
    );

  const totalHours = sumHours(records);
  const approvedHours = sumHours(
    records.filter((r) => ["approved", "paid"].includes(r.status || "")),
  );
  const avgHoursPerRequest = total > 0 ? totalHours / total : 0;

  // หารายการ pending ที่รอนานที่สุด (วัน)
  const longestWaitDays = records
    .filter((r) => r.status === "pending")
    .reduce((max, r) => {
      const created = r.created_at || r.request_date;
      if (!created) return max;
      const days = dayjs().diff(dayjs(created), "day");
      return Math.max(max, days);
    }, 0);

  // สถานะล่าสุดของคำขอ
  const sorted = [...records].sort((a, b) =>
    dayjs(b.created_at || b.request_date).diff(
      dayjs(a.created_at || a.request_date),
    ),
  );
  const mostRecentStatus = sorted[0]?.status ?? null;

  return {
    total,
    pending,
    approved,
    rejected,
    totalHours,
    approvedHours,
    avgHoursPerRequest,
    longestWaitDays,
    mostRecentStatus,
  };
};

// แปลงสถานะเป็น Tag สี
const StatusTag = ({ status }: { status: string | null }) => {
  if (!status) return <Text type="secondary">-</Text>;
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: "gold", label: "รออนุมัติ" },
    approved: { color: "green", label: "อนุมัติแล้ว" },
    paid: { color: "cyan", label: "จ่ายแล้ว" },
    rejected: { color: "red", label: "ปฏิเสธ" },
    cancelled: { color: "default", label: "ยกเลิก" },
  };
  const item = map[status] ?? { color: "default", label: status };
  return <Tag color={item.color}>{item.label}</Tag>;
};

/**
 * แสดงสถิติ OT ส่วนตัวของ user ที่ login อยู่
 * รองรับการเลือกช่วงเวลาผ่าน Segmented Control
 */
const PersonalOtSummary: React.FC<PersonalOtSummaryProps> = ({
  userId,
  isAdmin = false,
  fetchFn,
}) => {
  const { token } = theme.useToken();
  const [selectedRange, setSelectedRange] = useState<RangeKey>("this_month");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูล OT ส่วนตัวตามช่วงเวลาที่เลือก
  const loadPersonalData = useCallback(async () => {
    if (!userId) return;
    const { from, to } = calcDateRange(selectedRange);
    setLoading(true);
    try {
      const data = await fetchFn({ from, to, request_id: String(userId) });
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedRange, fetchFn]);

  useEffect(() => {
    void loadPersonalData();
  }, [loadPersonalData]);

  const stats = useMemo(() => computeStats(records), [records]);
  const { label: rangeLabel } = calcDateRange(selectedRange);

  // สีของชั่วโมงอนุมัติ
  const hoursColor =
    stats.approvedHours >= 40
      ? token.colorError
      : stats.approvedHours >= 20
        ? token.colorWarning
        : token.colorSuccess;

  // ถ้าเป็น admin ที่ดูทุกคน ไม่แสดง widget นี้
  if (isAdmin) return null;

  return (
    <Card
      styles={{ body: { padding: 20 } }}
      style={{ border: `1px solid ${token.colorBorderSecondary}` }}
    >
      <Flex vertical gap={16}>
        {/* Header */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <Flex align="center" gap={10}>
            <BarChartOutlined style={{ fontSize: "1rem" }} />
            <Text strong style={{ fontSize: 14 }}>
              สถิติ OT ของฉัน
            </Text>
            <Tag color="blue" style={{ margin: 0 }}>
              {rangeLabel}
            </Tag>
          </Flex>
          <Flex align="center" gap={8}>
            <Tooltip title="โหลดข้อมูลใหม่">
              <Button
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => void loadPersonalData()}
                loading={loading}
              />
            </Tooltip>
            <Segmented
              size="small"
              value={selectedRange}
              options={RANGE_OPTIONS}
              onChange={(v) => setSelectedRange(v as RangeKey)}
            />
          </Flex>
        </Flex>

        {/* Stats Grid */}
        {loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <Row gutter={[12, 12]}>
            {/* Card: คำขอทั้งหมด */}
            <Col xs={12} sm={8} lg={4}>
              <Card
                size="small"
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  borderRadius: 12,
                  background: token.colorFillQuaternary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  height: "100%",
                }}
              >
                <Flex vertical gap={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    คำขอทั้งหมด
                  </Text>
                  <Statistic
                    value={stats.total}
                    suffix="รายการ"
                    valueStyle={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}
                  />
                </Flex>
              </Card>
            </Col>

            {/* Card: รออนุมัติ */}
            <Col xs={12} sm={8} lg={4}>
              <Card
                size="small"
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  borderRadius: 12,
                  background:
                    stats.pending > 0 ? token.colorWarningBg : token.colorFillQuaternary,
                  border: `1px solid ${stats.pending > 0 ? token.colorWarningBorder : token.colorBorderSecondary}`,
                  height: "100%",
                }}
              >
                <Flex vertical gap={4}>
                  <Flex align="center" gap={6}>
                    <ClockCircleOutlined
                      style={{
                        fontSize: 11,
                        color: stats.pending > 0 ? token.colorWarning : token.colorTextTertiary,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: stats.pending > 0 ? token.colorWarning : token.colorTextTertiary,
                      }}
                    >
                      รออนุมัติ
                    </Text>
                  </Flex>
                  <Statistic
                    value={stats.pending}
                    suffix="รายการ"
                    valueStyle={{
                      fontSize: 22,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: stats.pending > 0 ? token.colorWarning : undefined,
                    }}
                  />
                  {stats.longestWaitDays > 3 && (
                    <Text style={{ fontSize: 10, color: token.colorError }}>
                      รอนานสุด {stats.longestWaitDays} วัน
                    </Text>
                  )}
                </Flex>
              </Card>
            </Col>

            {/* Card: อนุมัติแล้ว */}
            <Col xs={12} sm={8} lg={4}>
              <Card
                size="small"
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  borderRadius: 12,
                  background:
                    stats.approved > 0 ? token.colorSuccessBg : token.colorFillQuaternary,
                  border: `1px solid ${stats.approved > 0 ? token.colorSuccessBorder : token.colorBorderSecondary}`,
                  height: "100%",
                }}
              >
                <Flex vertical gap={4}>
                  <Flex align="center" gap={6}>
                    <CheckCircleOutlined
                      style={{
                        fontSize: 11,
                        color: stats.approved > 0 ? token.colorSuccess : token.colorTextTertiary,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: stats.approved > 0 ? token.colorSuccess : token.colorTextTertiary,
                      }}
                    >
                      อนุมัติแล้ว
                    </Text>
                  </Flex>
                  <Statistic
                    value={stats.approved}
                    suffix="รายการ"
                    valueStyle={{
                      fontSize: 22,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: stats.approved > 0 ? token.colorSuccess : undefined,
                    }}
                  />
                </Flex>
              </Card>
            </Col>

            {/* Card: ปฏิเสธ */}
            <Col xs={12} sm={8} lg={4}>
              <Card
                size="small"
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  borderRadius: 12,
                  background:
                    stats.rejected > 0 ? token.colorErrorBg : token.colorFillQuaternary,
                  border: `1px solid ${stats.rejected > 0 ? token.colorErrorBorder : token.colorBorderSecondary}`,
                  height: "100%",
                }}
              >
                <Flex vertical gap={4}>
                  <Flex align="center" gap={6}>
                    <CloseCircleOutlined
                      style={{
                        fontSize: 11,
                        color: stats.rejected > 0 ? token.colorError : token.colorTextTertiary,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: stats.rejected > 0 ? token.colorError : token.colorTextTertiary,
                      }}
                    >
                      ปฏิเสธ / ยกเลิก
                    </Text>
                  </Flex>
                  <Statistic
                    value={stats.rejected}
                    suffix="รายการ"
                    valueStyle={{
                      fontSize: 22,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: stats.rejected > 0 ? token.colorError : undefined,
                    }}
                  />
                </Flex>
              </Card>
            </Col>

            {/* Card: ชั่วโมง OT อนุมัติแล้ว */}
            <Col xs={12} sm={8} lg={4}>
              <Card
                size="small"
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  borderRadius: 12,
                  background: token.colorFillQuaternary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  height: "100%",
                }}
              >
                <Flex vertical gap={4}>
                  <Flex align="center" gap={6}>
                    <ThunderboltOutlined
                      style={{ fontSize: 11, color: hoursColor }}
                    />
                    <Text style={{ fontSize: 11, color: hoursColor }}>
                      ชั่วโมงอนุมัติ
                    </Text>
                  </Flex>
                  <Statistic
                    value={stats.approvedHours}
                    precision={2}
                    suffix="ชม."
                    valueStyle={{
                      fontSize: 22,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: hoursColor,
                    }}
                  />
                  {stats.total > 0 && (
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      เฉลี่ย {stats.avgHoursPerRequest.toFixed(1)} ชม./คำขอ
                    </Text>
                  )}
                </Flex>
              </Card>
            </Col>

            {/* Card: คำขอล่าสุด */}
            <Col xs={12} sm={8} lg={4}>
              <Card
                size="small"
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  borderRadius: 12,
                  background: token.colorFillQuaternary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  height: "100%",
                }}
              >
                <Flex vertical gap={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    สถานะล่าสุด
                  </Text>
                  <Flex align="center" gap={6} style={{ marginTop: 4 }}>
                    <StatusTag status={stats.mostRecentStatus} />
                  </Flex>
                  {/* Insight: ถ้าอนุมัติทุกรายการ */}
                  {stats.total > 0 && stats.rejected === 0 && stats.pending === 0 && (
                    <Flex align="center" gap={4} style={{ marginTop: 4 }}>
                      <TrophyOutlined style={{ fontSize: 11, color: token.colorWarning }} />
                      <Text style={{ fontSize: 10, color: token.colorWarning }}>
                        อนุมัติครบทุกรายการ
                      </Text>
                    </Flex>
                  )}
                  {/* Insight: มีคำขอเยอะ */}
                  {stats.total >= 5 && (
                    <Flex align="center" gap={4} style={{ marginTop: 2 }}>
                      <FireOutlined style={{ fontSize: 11, color: token.colorError }} />
                      <Text style={{ fontSize: 10, color: token.colorError }}>
                        {stats.total} รายการใน{rangeLabel}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Card>
            </Col>
          </Row>
        )}

        {/* Footer: อัตราอนุมัติ */}
        {!loading && stats.total > 0 && (
          <Flex align="center" gap={12} wrap="wrap">
            <Text type="secondary" style={{ fontSize: 12 }}>
              อัตราอนุมัติ:
            </Text>
            <Badge
              count={`${Math.round((stats.approved / stats.total) * 100)}%`}
              style={{
                backgroundColor:
                  stats.approved / stats.total >= 0.8
                    ? token.colorSuccess
                    : token.colorWarning,
                fontSize: 12,
                fontWeight: 600,
                padding: "0 8px",
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({stats.approved}/{stats.total} รายการ)
            </Text>
            {stats.totalHours > 0 && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  •
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ยื่นรวม {stats.totalHours.toFixed(1)} ชม. — ผ่านอนุมัติ{" "}
                  {stats.approvedHours.toFixed(1)} ชม.
                </Text>
              </>
            )}
          </Flex>
        )}

        {/* Empty state */}
        {!loading && stats.total === 0 && (
          <Flex justify="center" style={{ padding: "8px 0" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              ไม่มีรายการ OT ใน{rangeLabel}
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default PersonalOtSummary;
