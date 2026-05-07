"use client";

import { useCustomerStore } from "../_stores/use-customer-store";
import { StatusModalComponent } from "@/components/modal/status-modal-component";

// Modal ยืนยันการปลดล็อกบัญชีลูกค้า
export default function UnlockConfirmModal() {
  const { unlockTargetId, customers, isUnlocking, closeUnlockConfirm, confirmUnlock } =
    useCustomerStore();

  const targetUser = customers.find((c) => c.sID === unlockTargetId);
  const fullname = targetUser
    ? `${targetUser.sName ?? ""} ${targetUser.sLastname ?? ""}`.trim()
    : "";

  return (
    <StatusModalComponent
      open={!!unlockTargetId}
      type="confirm"
      title="ยืนยันการปลดล็อกบัญชี"
      message={`ต้องการปลดล็อกบัญชีของ "${fullname || `ID: ${unlockTargetId}`}" ใช่หรือไม่?\nระบบจะรีเซ็ตจำนวนครั้งที่ Login ผิดเป็น 0 และลบเวลาล็อกออก`}
      onClose={closeUnlockConfirm}
      onConfirm={confirmUnlock}
      loading={isUnlocking}
      confirmLabel="ปลดล็อก"
      cancelLabel="ยกเลิก"
    />
  );
}
