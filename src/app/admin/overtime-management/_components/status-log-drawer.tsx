"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Drawer,
  Flex,
  Skeleton,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "รออนุมัติ", color: "gold", icon: <ClockCircleOutlined /> },
  approved: { label: "อนุมัติแล้ว", color: "green", icon: <CheckCircleOutlined /> },
  rejected: { label: "ปฏิเสธ", color: "red", icon: <CloseCircleOutlined /> },
  paid: { label: "จ่ายเงินแล้ว", color: "cyan", icon: <DollarOutlined /> },
  payment_failed: { label: "จ่ายเงินล้มเหลว", color: "volcano", icon: <CloseCircleOutlined /> },
};

// แปลงชื่อสถานะเป็น Tag
const StatusTag: React.FC<{ status: string | null }> = ({ status }) => {
  if (!status) return <Tag>-</Tag>;
  const cfg = STATUS_CONFIG[status] || { label: status, color: "default", icon: null };
  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
};

interface StatusLogDrawerProps {
  open: boolean;
  overtimeId: string | number | null;
  onClose: () => void;
}

interface LogEntry {
  id: number;
  overtime_id: number;
  changed_by: number | null;
  changed_by_name: string | null;
  from_status: string | null;
  to_status: string;
  note: string | null;
  changed_at: string;
}

/**
 * Drawer แสดงประวัติการเปลี่ยนสถานะ OT (Audit Trail)
 * ดึงข้อมูลจาก GET /api/v1/timesheet/overtime/status-log?overtime_id=xxx
 */
const StatusLogDrawer: React.FC<StatusLogDrawerProps> = ({
  open,
  overtimeId,
  onClose,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลด log เมื่อ drawer เปิด
  useEffect(() => {
    if (!open || !overtimeId) return;

    // ใช้ async function ภายใน useEffect เพื่อหลีกเลี่ยง setState synchronous
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      setLogs([]);
      try {
        const res = await callApiService.get(
          `/api/v1/timesheet/overtime/status-log?overtime_id=${overtimeId}`,
        );
        if (res?.data?.status === 200) {
          setLogs(Array.isArray(res.data.data) ? res.data.data : []);
        } else {
          setError(res?.data?.message_th || "ไม่สามารถโหลดประวัติได้");
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการโหลดประวัติสถานะ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [open, overtimeId]);

  // สร้าง timeline items จาก log — แยก comment entry ออกจาก status change
  const timelineItems = logs.map((log) => {
    // entry ที่ to_status = "comment" คือหมายเหตุจาก Admin
    if (log.to_status === "comment") {
      return {
        color: "#1677ff",
        dot: <CommentOutlined style={{ color: "#1677ff" }} />,
        children: (
          <Flex vertical gap={4}>
            <Tag color="blue" style={{ margin: 0, width: "fit-content", fontSize: 12 }}>
              หมายเหตุจาก Admin
            </Tag>
            <Text style={{ fontSize: 12 }}>{log.note}</Text>
            <Flex align="center" gap={6}>
              <UserOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
              <Text style={{ fontSize: 12 }}>
                {log.changed_by_name || (log.changed_by ? `User #${log.changed_by}` : "Admin")}
              </Text>
            </Flex>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(log.changed_at).format("DD/MM/YYYY HH:mm:ss น.")}
            </Text>
          </Flex>
        ),
      };
    }

    const cfg = STATUS_CONFIG[log.to_status] || {
      label: log.to_status,
      color: "gray",
      icon: <ExclamationCircleOutlined />,
    };

    return {
      color: cfg.color === "gold" ? "orange" : cfg.color,
      dot: cfg.icon,
      children: (
        <Flex vertical gap={4}>
          <Flex align="center" gap={8} wrap="wrap">
            {log.from_status && (
              <>
                <StatusTag status={log.from_status} />
                <Text type="secondary">→</Text>
              </>
            )}
            <StatusTag status={log.to_status} />
          </Flex>

          <Flex align="center" gap={6}>
            <UserOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>
              {log.changed_by_name || (log.changed_by ? `User #${log.changed_by}` : "ระบบ")}
            </Text>
          </Flex>

          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(log.changed_at).format("DD/MM/YYYY HH:mm:ss น.")}
          </Text>

          {log.note && (
            <Alert
              type="warning"
              message={log.note}
              style={{ fontSize: 12, padding: "4px 8px", marginTop: 2 }}
            />
          )}
        </Flex>
      ),
    };
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <Flex align="center" gap={8}>
          <HistoryOutlined style={{ color: "#1677ff" }} />
          <span>ประวัติการเปลี่ยนสถานะ OT #{overtimeId}</span>
        </Flex>
      }
      width={420}
      styles={{ body: { padding: 24 } }}
    >
      {isLoading && (
        <Flex vertical gap={16}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 2 }} />
          ))}
        </Flex>
      )}

      {!isLoading && error && (
        <Alert type="error" message={error} showIcon />
      )}

      {!isLoading && !error && logs.length === 0 && (
        <Alert
          type="info"
          message="ยังไม่มีประวัติการเปลี่ยนสถานะ"
          description="ประวัติจะปรากฏเมื่อมีการอนุมัติหรือปฏิเสธคำขอนี้"
          showIcon
        />
      )}

      {!isLoading && !error && logs.length > 0 && (
        <Timeline items={timelineItems} />
      )}
    </Drawer>
  );
};

export default StatusLogDrawer;
