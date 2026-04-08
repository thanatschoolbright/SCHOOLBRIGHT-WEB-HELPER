"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignInForm from "./_components/signin-form";
import SignInLeftPanel from "./_components/signin-left-panel";

export default function SignInPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  // Redirect เมื่อล็อกอินแล้ว
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/main");
    }
  }, [sessionStatus, router]);

  // รีเฟรชเมื่อ focus กลับมา (กรณีล็อกอินจาก tab อื่น)
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window !== "undefined") router.refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  // ป้องกันการเห็นหน้า Login หากเข้าสู่ระบบแล้วหรือกำลังโหลด
  const shouldShowGate =
    sessionStatus === "loading" || sessionStatus === "authenticated";

  return (
    <div className="min-h-screen overflow-hidden flex" style={{ background: "#fff" }}>
      {/* Gate overlay */}
      <AnimatePresence>
        {shouldShowGate && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3"
            style={{ background: "#fff" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Spinner เล็กๆ */}
            <motion.div
              className="w-5 h-5 border-[1.5px] rounded-full"
              style={{ borderColor: "#e2e8f0", borderTopColor: "#0c0f14" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-[13px] text-slate-400 m-0">กำลังตรวจสอบสิทธิ์...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ฝั่งซ้าย: Dark panel */}
      <SignInLeftPanel />

      {/* ฝั่งขวา: Form */}
      <SignInForm />
    </div>
  );
}
