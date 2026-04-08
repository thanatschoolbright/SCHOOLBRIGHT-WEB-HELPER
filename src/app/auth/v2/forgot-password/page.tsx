"use client";

import ForgotPasswordForm from "./_components/forgot-password-form";
import ForgotPasswordLeftPanel from "./_components/forgot-password-left-panel";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen overflow-hidden flex" style={{ background: "#fff" }}>
      {/* ฝั่งซ้าย: Dark panel */}
      <ForgotPasswordLeftPanel />

      {/* ฝั่งขวา: ฟอร์มกู้คืนรหัสผ่าน */}
      <ForgotPasswordForm />
    </div>
  );
}
