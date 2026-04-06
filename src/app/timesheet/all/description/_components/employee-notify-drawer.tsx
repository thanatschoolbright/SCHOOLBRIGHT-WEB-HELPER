"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  LoadingOutlined,
  MailOutlined,
  MinusCircleOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Flex,
  Progress,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import React, { useMemo } from "react";
import {
  NotifyOneStatus,
  NotifyOneTarget,
  useDescriptionStore,
} from "../_stores/description-store";

const { Text } = Typography;

// ====================================================================
// StatusIcon: ไอคอนตามสถานะแต่ละรายการ
// ====================================================================

const StatusIcon: React.FC<{ status: NotifyOneStatus }> = ({ status }) => {
  const { token } = theme.useToken();
  if (status === "sending")
    return <LoadingOutlined style={{ color: token.colorPrimary }} />;
  if (status === "success")
    return <CheckCircleFilled style={{ color: token.colorSuccess }} />;
  if (status === "error")
    return <CloseCircleFilled style={{ color: token.colorError }} />;
  if (status === "skipped")
    return <MinusCircleOutlined style={{ color: token.colorTextDisabled }} />;
  return <MinusCircleOutlined style={{ color: token.colorBorderSecondary }} />;
};

// ====================================================================
// StatusTag: Tag ตามสถานะ
// ====================================================================

const statusTagConfigMap: Record<
  NotifyOneStatus,
  { color: string; label: string }
> = {
  pending: { color: "default", label: "รอดำเนินการ" },
  sending: { color: "processing", label: "กำลังส่ง..." },
  success: { color: "success", label: "ส่งสำเร็จ" },
  skipped: { color: "default", label: "ข้าม" },
  error: { color: "error", label: "ล้มเหลว" },
};

const StatusTag: React.FC<{ status: NotifyOneStatus }> = ({ status }) => {
  const cfg = statusTagConfigMap[status];
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

// ====================================================================
// TargetRow: แถวรายการพนักงาน 1 คน
// ====================================================================

const TargetRow: React.FC<{ target: NotifyOneTarget; index: number }> = ({
  target,
  index,
}) => {
  const { token } = theme.useToken();
  const isActive = target.status === "sending";

  return (
    <Flex
      align="center"
      gap={12}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        backgroundColor: isActive
          ? token.colorPrimaryBg
          : token.colorBgContainer,
        border: `1px solid ${
          isActive ? token.colorPrimary : token.colorBorderSecondary
        }`,
        transition: "all 0.3s ease",
      }}
    >
      {/* ลำดับ */}
      <Text
        type="secondary"
        style={{ fontSize: 11, minWidth: 20, textAlign: "right" }}
      >
        {index + 1}
      </Text>

      {/* Avatar */}
      <Avatar icon={<UserOutlined />} size={34} style={{ flexShrink: 0 }} />

      {/* ข้อมูลพนักงาน */}
      <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13 }}>
          {target.full_name}
        </Text>
        <Flex gap={6} align="center">
          {target.email ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {target.email}
            </Text>
          ) : (
            <Text type="danger" style={{ fontSize: 11 }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              ไม่มีอีเมล
            </Text>
          )}
        </Flex>
        {target.error && (
          <Text type="danger" style={{ fontSize: 11 }}>
            {target.error}
          </Text>
        )}
      </Flex>

      {/* ชั่วโมง */}
      <Text
        style={{
          fontSize: 12,
          color:
            target.total_hours === 0 ? token.colorError : token.colorWarning,
          minWidth: 48,
          textAlign: "center",
        }}
      >
        {target.total_hours} / 8 ชม.
      </Text>

      {/* Status */}
      <Flex align="center" gap={6}>
        <StatusIcon status={target.status} />
        <StatusTag status={target.status} />
      </Flex>
    </Flex>
  );
};

// ====================================================================
// EmployeeNotifyDrawer: Drawer แสดง progress การส่งอีเมลทีละคน
// ====================================================================

export const EmployeeNotifyDrawer: React.FC = () => {
  const { token } = theme.useToken();

  const notifyOneOpen = useDescriptionStore((s) => s.notifyOneOpen);
  const notifyOneTargets = useDescriptionStore((s) => s.notifyOneTargets);
  const notifyOneRunning = useDescriptionStore((s) => s.notifyOneRunning);
  const notifyOneFetching = useDescriptionStore((s) => s.notifyOneFetching);
  const runEmployeeNotifyOneByOne = useDescriptionStore(
    (s) => s.runEmployeeNotifyOneByOne,
  );
  const closeEmployeeNotifyDrawer = useDescriptionStore(
    (s) => s.closeEmployeeNotifyDrawer,
  );

  // สรุปสถิติ
  const stats = useMemo(() => {
    const total = notifyOneTargets.length;
    const success = notifyOneTargets.filter(
      (t) => t.status === "success",
    ).length;
    const error = notifyOneTargets.filter((t) => t.status === "error").length;
    const skipped = notifyOneTargets.filter(
      (t) => t.status === "skipped",
    ).length;
    const pending = notifyOneTargets.filter(
      (t) => t.status === "pending" || t.status === "sending",
    ).length;
    const done = success + error + skipped;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, success, error, skipped, pending, done, percent };
  }, [notifyOneTargets]);

  const isDone = stats.pending === 0 && stats.total > 0 && !notifyOneRunning;
  const canStart = !notifyOneRunning && stats.pending > 0 && !notifyOneFetching;

  return (
    <Drawer
      title={
        <Space>
          <MailOutlined style={{ color: token.colorPrimary }} />
          <span>แจ้งเตือนอีเมลพนักงาน (ทีละคน)</span>
        </Space>
      }
      open={notifyOneOpen}
      onClose={closeEmployeeNotifyDrawer}
      width={560}
      closable={!notifyOneRunning}
      maskClosable={!notifyOneRunning}
      footer={
        <Flex justify="space-between" align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {stats.total > 0
              ? `พบ ${stats.total} รายการ — ส่งสำเร็จ ${stats.success} ข้าม ${stats.skipped} ล้มเหลว ${stats.error}`
              : ""}
          </Text>
          <Space>
            <Button
              onClick={closeEmployeeNotifyDrawer}
              disabled={notifyOneRunning}
            >
              ปิด
            </Button>
            {!isDone && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={notifyOneRunning}
                disabled={!canStart}
                onClick={runEmployeeNotifyOneByOne}
                shape="round"
              >
                เริ่มส่งอีเมล
              </Button>
            )}
          </Space>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        {/* Progress bar */}
        {stats.total > 0 && (
          <Flex vertical gap={6}>
            <Flex justify="space-between">
              <Text style={{ fontSize: 13 }}>
                ความคืบหน้า{" "}
                <Text strong style={{ color: token.colorPrimary }}>
                  {stats.done}/{stats.total}
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: token.colorPrimary,
                  fontWeight: 600,
                }}
              >
                {stats.percent}%
              </Text>
            </Flex>
            <Progress
              percent={stats.percent}
              showInfo={false}
              strokeColor={
                stats.error > 0 ? token.colorError : token.colorSuccess
              }
              size="small"
            />
            <Flex gap={12}>
              <Badge
                color={token.colorSuccess}
                text={
                  <Text style={{ fontSize: 12 }}>สำเร็จ {stats.success}</Text>
                }
              />
              <Badge
                color={token.colorWarning}
                text={
                  <Text style={{ fontSize: 12 }}>ข้าม {stats.skipped}</Text>
                }
              />
              <Badge
                color={token.colorError}
                text={
                  <Text style={{ fontSize: 12 }}>ล้มเหลว {stats.error}</Text>
                }
              />
            </Flex>
          </Flex>
        )}

        {/* สรุปผล */}
        {isDone && (
          <Flex
            align="center"
            justify="center"
            gap={8}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: token.colorSuccessBg,
              border: `1px solid ${token.colorSuccessBorder}`,
            }}
          >
            <CheckCircleFilled
              style={{ color: token.colorSuccess, fontSize: 18 }}
            />
            <Text style={{ color: token.colorSuccess, fontWeight: 600 }}>
              ดำเนินการครบทุกรายการแล้ว
            </Text>
          </Flex>
        )}

        {/* รายการพนักงาน */}
        <Flex vertical gap={6}>
          {notifyOneFetching && (
            <Flex justify="center" style={{ padding: 32 }}>
              <Space>
                <LoadingOutlined style={{ color: token.colorPrimary }} />
                <Text type="secondary">กำลังดึงรายชื่อ...</Text>
              </Space>
            </Flex>
          )}

          {!notifyOneFetching && notifyOneTargets.length === 0 && (
            <Flex justify="center" style={{ padding: 32 }}>
              <Text type="secondary" italic>
                พนักงานทุกคนกรอก Timesheet ครบแล้ว
              </Text>
            </Flex>
          )}

          {!notifyOneFetching &&
            notifyOneTargets.length > 0 &&
            !notifyOneRunning &&
            stats.done === 0 && (
              <Flex
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: token.colorWarningBg,
                  border: `1px solid ${token.colorWarningBorder}`,
                  marginBottom: 4,
                }}
                gap={8}
                align="center"
              >
                <ExclamationCircleOutlined
                  style={{ color: token.colorWarning }}
                />
                <Text style={{ fontSize: 13 }}>
                  พบ <Text strong>{stats.total}</Text> รายการที่ต้องแจ้งเตือน กด{" "}
                  <Text strong>เริ่มส่งอีเมล</Text> เพื่อดำเนินการ
                </Text>
              </Flex>
            )}

          {notifyOneTargets.map((target, idx) => (
            <TargetRow key={target.admin_id} target={target} index={idx} />
          ))}
        </Flex>
      </Flex>
    </Drawer>
  );
};
