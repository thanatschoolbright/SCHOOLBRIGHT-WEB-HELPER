"use client";

import { ExclamationCircleOutlined, UnlockOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Progress, Typography } from "antd";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { useCustomerStore } from "../_stores/use-customer-store";

// Modal ยืนยัน + Progress สำหรับปลดล็อกทั้งหมด
export default function UnlockAllModal() {
  const {
    unlockAllConfirmOpen,
    unlockAllProgress,
    filters,
    companies,
    closeUnlockAllConfirm,
    startUnlockAll,
    closeUnlockAllProgress,
  } = useCustomerStore();

  const schoolName = filters.company_id
    ? (companies.find((c) => c.nCompany === filters.company_id)?.sCompany ?? `ID: ${filters.company_id}`)
    : "ทั้งหมด";

  return (
    <>
      {/* Confirm Modal */}
      <StatusModalComponent
        open={unlockAllConfirmOpen}
        type="delete"
        title="ยืนยันการปลดล็อกทั้งหมด"
        message={`ต้องการปลดล็อกบัญชีลูกค้า "${schoolName}" ที่ถูกล็อกทั้งหมดใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onClose={closeUnlockAllConfirm}
        onConfirm={startUnlockAll}
        confirmLabel="ปลดล็อกทั้งหมด"
        cancelLabel="ยกเลิก"
      />

      {/* Progress Modal */}
      <Modal
        open={unlockAllProgress.open}
        title={
          <Flex align="center" gap={8}>
            <UnlockOutlined />
            <span>กำลังปลดล็อกบัญชี...</span>
          </Flex>
        }
        footer={
          unlockAllProgress.isDone ? (
            <Button type="primary" onClick={closeUnlockAllProgress}>
              ปิด
            </Button>
          ) : null
        }
        closable={unlockAllProgress.isDone}
        onCancel={closeUnlockAllProgress}
        maskClosable={false}
        centered
        width={420}
      >
        <Flex vertical gap={16} style={{ padding: "16px 0" }}>
          <Progress
            percent={unlockAllProgress.percent}
            status={
              unlockAllProgress.isDone
                ? "success"
                : unlockAllProgress.percent > 0
                ? "active"
                : "normal"
            }
            strokeColor={unlockAllProgress.isDone ? "#52c41a" : undefined}
          />
          <Flex justify="center" gap={8}>
            {unlockAllProgress.isDone ? (
              <Typography.Text type="success" strong>
                ปลดล็อกสำเร็จ {unlockAllProgress.unlocked} บัญชี
              </Typography.Text>
            ) : (
              <>
                <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                <Typography.Text type="secondary">
                  กำลังดำเนินการ {unlockAllProgress.unlocked} / {unlockAllProgress.total} บัญชี
                </Typography.Text>
              </>
            )}
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
