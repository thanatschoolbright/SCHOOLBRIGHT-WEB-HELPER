"use client";

import {
  selectFilteredRecords,
  useTimesheetAllStore,
} from "@/app/timesheet/all/_stores/timesheet-all-store";
import { postEmployeeNotifyOne } from "@/app/timesheet/all/description/_api/description-api";
import {
  CheckCircleFilled,
  CloseCircleOutlined,
  LoadingOutlined,
  MailOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Badge, Button, Flex, Progress, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

type SendStatus = "idle" | "running" | "done";

/**
 * Floating action bar แสดงเมื่อมีการเลือกพนักงาน — รองรับ Bulk Notify ส่งอีเมลทีละคน
 */
export const BulkNotifyBar: React.FC = () => {
  const { token } = theme.useToken();

  const { selectedAdminIds, clearSelection } = useTimesheetAllStore(
    useShallow((s) => ({
      selectedAdminIds: s.selectedAdminIds,
      clearSelection: s.clearSelection,
    })),
  );

  const filteredRecords = useTimesheetAllStore(
    useShallow(selectFilteredRecords),
  );

  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [doneCount, setDoneCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  // ส่งอีเมลแจ้งเตือนพนักงานที่เลือกทีละคน
  const requestBulkNotify = useCallback(async () => {
    if (selectedAdminIds.length === 0) return;
    const dateLabel = dayjs().format("DD/MM/YYYY");

    setSendStatus("running");
    setDoneCount(0);
    setFailCount(0);

    let successCount = 0;
    let errorCount = 0;

    for (const adminId of selectedAdminIds) {
      try {
        await postEmployeeNotifyOne({
          admin_id: adminId,
          date_label: dateLabel,
        });
        successCount++;
        setDoneCount(successCount);
      } catch {
        errorCount++;
        setFailCount(errorCount);
      }
    }

    setSendStatus("done");
    toast.success(
      `ส่งอีเมลเสร็จสิ้น — สำเร็จ ${successCount}/${
        selectedAdminIds.length
      } คน${errorCount > 0 ? ` (ล้มเหลว ${errorCount} คน)` : ""}`,
    );
  }, [selectedAdminIds]);

  // รีเซ็ต state และปิด bar
  const handleClose = useCallback(() => {
    clearSelection();
    setSendStatus("idle");
    setDoneCount(0);
    setFailCount(0);
  }, [clearSelection]);

  // ไม่แสดงถ้าไม่มีรายการที่เลือก
  if (selectedAdminIds.length === 0) return null;

  const selectedNames = filteredRecords
    .filter((r) => selectedAdminIds.includes(Number(r.admin_id)))
    .map((r) => r.nickname || r.full_name.split(" ")[0]);

  const progressPercent =
    sendStatus === "running" && selectedAdminIds.length > 0
      ? Math.round(((doneCount + failCount) / selectedAdminIds.length) * 100)
      : sendStatus === "done"
      ? 100
      : 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "min(700px, calc(100vw - 48px))",
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        gap={16}
        style={{
          padding: "14px 20px",
          background: token.colorBgElevated,
          borderRadius: token.borderRadiusLG,
          boxShadow: `0 8px 32px rgba(0,0,0,0.18)`,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* ซ้าย: จำนวนที่เลือก + ชื่อ */}
        <Flex align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
          <Badge count={selectedAdminIds.length} color={token.colorPrimary} />
          <Typography.Text style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            เลือกแล้ว {selectedAdminIds.length} คน
          </Typography.Text>
          <Flex
            wrap="wrap"
            gap={4}
            style={{ overflow: "hidden", maxHeight: 28 }}
          >
            {selectedNames.slice(0, 5).map((name) => (
              <Tag key={name} color="blue" style={{ fontSize: 11, margin: 0 }}>
                {name}
              </Tag>
            ))}
            {selectedNames.length > 5 && (
              <Tag style={{ fontSize: 11, margin: 0 }}>
                +{selectedNames.length - 5}
              </Tag>
            )}
          </Flex>
        </Flex>

        {/* กลาง: Progress bar ขณะส่ง */}
        {sendStatus === "running" && (
          <Flex vertical gap={2} style={{ minWidth: 140 }}>
            <Progress
              percent={progressPercent}
              showInfo={false}
              size="small"
              strokeColor={token.colorPrimary}
            />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              <LoadingOutlined style={{ marginRight: 4 }} />
              กำลังส่ง {doneCount + failCount}/{selectedAdminIds.length}
            </Typography.Text>
          </Flex>
        )}

        {/* กลาง: Done summary */}
        {sendStatus === "done" && (
          <Flex align="center" gap={8}>
            <CheckCircleFilled style={{ color: token.colorSuccess }} />
            <Typography.Text
              style={{ color: token.colorSuccess, fontWeight: 600 }}
            >
              สำเร็จ {doneCount} คน
            </Typography.Text>
            {failCount > 0 && (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                ล้มเหลว {failCount} คน
              </Typography.Text>
            )}
          </Flex>
        )}

        {/* ขวา: Actions */}
        <Flex gap={8} align="center" style={{ flexShrink: 0 }}>
          {sendStatus === "idle" && (
            <Button
              type="primary"
              icon={<MailOutlined />}
              shape="round"
              onClick={requestBulkNotify}
            >
              ส่งอีเมลแจ้งเตือน
            </Button>
          )}
          {sendStatus === "running" && (
            <Button icon={<StopOutlined />} shape="round" disabled>
              กำลังส่ง...
            </Button>
          )}
          <Button
            icon={<CloseCircleOutlined />}
            shape="round"
            onClick={handleClose}
            disabled={sendStatus === "running"}
          >
            ยกเลิก
          </Button>
        </Flex>
      </Flex>
    </div>
  );
};
