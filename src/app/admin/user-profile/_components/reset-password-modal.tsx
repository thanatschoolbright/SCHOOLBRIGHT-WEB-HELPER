"use client";

import {
  CarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FlagOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Flex, Modal, Steps, theme, Typography } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { UserProfile } from "@stores/type";
import { requestResetPasswordToPhone } from "../_api/user-profile-api";
import { CodeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const PASSWORD_RESET_STEPS = [
  { title: "รวบรวมข้อมูล", icon: <CodeOutlined /> },
  { title: "ตรวจสอบสิทธิ์", icon: <SafetyCertificateOutlined /> },
  { title: "บันทึกรหัสผ่าน", icon: <DashboardOutlined /> },
  { title: "นำส่ง Email", icon: <SendOutlined /> },
  { title: "จัดส่งสำเร็จ", icon: <FlagOutlined /> },
];

const STATUS_MESSAGES = (count: number) => [
  `กำลังรวบรวมข้อมูลพนักงาน ${String(count)} ท่าน และเตรียมข้อมูล...`,
  "ตรวจสอบเบอร์โทรศัพท์และความถูกต้องของข้อมูลสิทธิ์...",
  "กำลังทยอยอัปเดตรหัสผ่านใหม่เป็น 'เบอร์มือถือ' ลงในฐานข้อมูล...",
  "กำลังนำส่งอีเมลแจ้งเตือนรหัสผ่านใหม่ไปยังพนักงานทุกคน...",
  "ภารกิจเสร็จสิ้น! ทุกบัญชีถูกรีเซ็ตเป็นเบอร์มือถือเรียบร้อยแล้ว",
];

interface ResetPasswordModalProps {
  open: boolean;
  users: UserProfile[] | null;
  adminId?: number | string;
  onComplete: () => void;
  onCancel: () => void;
}

export const ResetPasswordModal = ({
  open,
  users,
  adminId,
  onComplete,
  onCancel,
}: ResetPasswordModalProps) => {
  const { token } = theme.useToken();
  const [currentStep, setCurrentStep] = useState(0);

  const runProcess = useCallback(async () => {
    try {
      setCurrentStep(0);
      await new Promise((r) => setTimeout(r, 1200));

      setCurrentStep(1);
      const invalidUsers = users?.filter((u) => !u.phone && !(u as unknown as Record<string, unknown>).tel);
      if (invalidUsers && invalidUsers.length > 0) {
        throw new Error(
          `พบพนักงาน ${String(invalidUsers.length)} ท่านที่ยังไม่ได้ระบุเบอร์โทรศัพท์ กรุณาตรวจสอบข้อมูลก่อนดำเนินการแบบกลุ่ม`,
        );
      }
      await new Promise((r) => setTimeout(r, 1200));

      setCurrentStep(2);
      const userIds = users?.map((u) => u.id) ?? [];
      const res = await requestResetPasswordToPhone(userIds, adminId);
      if (res.data.status !== 200 || !res.data.data?.success) {
        throw new Error(
          (res.data.message_th as string) ?? (res.data.message_en as string) ?? "API Connection Error",
        );
      }
      await new Promise((r) => setTimeout(r, 1500));

      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 2000));

      setCurrentStep(4);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการประมวลผลแบบกลุ่ม");
      onCancel();
    }
  }, [users, adminId, onCancel]);

  useEffect(() => {
    if (open && users && users.length > 0) {
      void runProcess();
    } else {
      setCurrentStep(0);
    }
  }, [open, users, runProcess]);

  const messages = useMemo(() => STATUS_MESSAGES(users?.length ?? 0), [users]);

  return (
    <Modal
      open={open}
      footer={null}
      closable={currentStep === 4}
      onCancel={onCancel}
      width={900}
      centered
      styles={{ body: { padding: "60px 50px" } }}
      modalRender={(node) => (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: -10,
              right: 20,
              zIndex: 1,
              background: token.colorInfo,
              color: "white",
              padding: "4px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            รีเซ็ตรหัสผ่านกลุ่ม #รายการ-{String(users?.length ?? 0)}-ท่าน
          </div>
          {node}
        </div>
      )}
    >
      <Flex vertical align="center" style={{ width: "100%" }}>
        <div className="w-full text-center py-12 mb-10 relative rounded-[32px] overflow-hidden border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div
                style={{
                  fontSize: 84,
                  color: currentStep === 4 ? token.colorSuccess : token.colorPrimary,
                  filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.1))",
                  marginBottom: 24,
                }}
              >
                {currentStep === 4 ? (
                  <CheckCircleOutlined />
                ) : currentStep === 3 ? (
                  <SendOutlined />
                ) : (
                  <CarOutlined />
                )}
              </div>
              <Title level={2} style={{ marginBottom: 12 }}>
                {PASSWORD_RESET_STEPS[currentStep]?.title ?? "กำลังดำเนินการ"}
              </Title>
              <Text type="secondary" style={{ fontSize: 18, maxWidth: 600, display: "block" }}>
                {messages[currentStep] ?? "กำลังเตรียมข้อมูล..."}
              </Text>
            </motion.div>
          </AnimatePresence>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 6,
              background: token.colorFillTertiary,
            }}
          >
            <motion.div
              style={{ height: "100%", background: token.colorPrimary, borderRadius: "0 4px 4px 0" }}
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / (PASSWORD_RESET_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div style={{ width: "100%", padding: "0 20px" }}>
          <Steps
            current={currentStep}
            labelPlacement="vertical"
            items={PASSWORD_RESET_STEPS.map((s, idx) => ({
              ...s,
              icon: currentStep > idx ? <CheckCircleOutlined /> : s.icon,
            }))}
            style={{ minWidth: 0 }}
          />
        </div>

        {currentStep === 4 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full mt-12"
          >
            <Button
              type="primary"
              size="large"
              block
              onClick={onComplete}
              style={{
                height: 60,
                borderRadius: 20,
                fontSize: 20,
                fontWeight: 600,
                boxShadow: `0 8px 24px ${token.colorPrimary}40`,
              }}
            >
              ตรวจสอบความเรียบร้อย (ปิดหน้านี้)
            </Button>
          </motion.div>
        )}
      </Flex>
    </Modal>
  );
};
