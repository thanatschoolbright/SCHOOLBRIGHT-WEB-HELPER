"use client";

import {
  ClockCircleOutlined,
  FilterOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, Button, Flex, Tag, Typography } from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

const { Text } = Typography;

// จำนวนวันที่ถือว่า "เกินกำหนด" (> N วัน ยังไม่ได้อนุมัติ)
const OVERDUE_THRESHOLD_DAYS = 3;

interface OverdueAlertProps {
  onFilterOverdue: () => void;
}

/**
 * Banner แจ้งเตือนคำขอ OT ที่รออนุมัติเกินกำหนด (> 3 วัน)
 * คำนวณจาก dataSource ที่มีอยู่ ไม่ต้องยิง API เพิ่ม
 * ซ่อนตัวเองเมื่อไม่มีรายการที่เกินกำหนด
 */
const OverdueAlert: React.FC<OverdueAlertProps> = ({ onFilterOverdue }) => {
  const { dataSource } = useAdminOvertimeStore();

  // คำนวณรายการที่รออนุมัติเกิน OVERDUE_THRESHOLD_DAYS วัน
  const overdueItems = useMemo(() => {
    const now = dayjs();
    return dataSource.filter((r) => {
      if (r.status !== "pending") return false;
      const created = dayjs(r.created_at || r.request_date);
      return now.diff(created, "day") >= OVERDUE_THRESHOLD_DAYS;
    });
  }, [dataSource]);

  // หารายการที่รอนานที่สุด
  const longestWaitDays = useMemo(() => {
    if (!overdueItems.length) return 0;
    const now = dayjs();
    return Math.max(
      ...overdueItems.map((r) =>
        now.diff(dayjs(r.created_at || r.request_date), "day"),
      ),
    );
  }, [overdueItems]);

  if (overdueItems.length === 0) return null;

  return (
    <Alert
      type="warning"
      showIcon
      icon={<WarningOutlined />}
      message={
        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Flex align="center" gap={8} wrap="wrap">
            <Text strong>คำขอ OT รออนุมัติเกิน {OVERDUE_THRESHOLD_DAYS} วัน</Text>
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              {overdueItems.length} รายการ
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              รอนานสุด {longestWaitDays} วัน
            </Text>
          </Flex>
          <Button
            size="small"
            icon={<FilterOutlined />}
            onClick={onFilterOverdue}
          >
            กรองดูรายการเหล่านี้
          </Button>
        </Flex>
      }
    />
  );
};

export default OverdueAlert;
