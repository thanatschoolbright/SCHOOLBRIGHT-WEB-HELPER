"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const LOGIN_STEPS = [
  { label: "Connection", sub: "เชื่อมต่อเซิร์ฟเวอร์" },
  { label: "Audit", sub: "ตรวจสอบสิทธิ์" },
  { label: "Policy", sub: "ดึงข้อมูลสิทธิ์" },
  { label: "Setup", sub: "เตรียมหน้าจอ" },
];

interface SignInProcessingModalProps {
  open: boolean;
  currentStep: number;
}

export default function SignInProcessingModal({ open, currentStep }: SignInProcessingModalProps) {
  // ล็อก scroll เมื่อ modal เปิด
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998]"
            style={{ background: "rgba(12,15,20,0.55)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl w-full max-w-[400px] p-8"
              style={{ boxShadow: "0 24px 60px -12px rgba(0,0,0,0.18)" }}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              {/* Spinner */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  className="w-9 h-9 border-[2px] rounded-full flex-shrink-0"
                  style={{ borderColor: "#f1f5f9", borderTopColor: "#0c0f14" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <div>
                  <p className="text-[15px] font-semibold text-slate-800 m-0">กำลังตรวจสอบข้อมูล</p>
                  <p className="text-[12px] text-slate-400 m-0 mt-0.5">โปรดรอสักครู่...</p>
                </div>
              </div>

              {/* Steps */}
              <div className="flex flex-col gap-3">
                {LOGIN_STEPS.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isActive = index === currentStep;

                  return (
                    <div key={step.label} className="flex items-center gap-3">
                      {/* Indicator */}
                      <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
                        <motion.div
                          className="w-5 h-5 rounded-full border flex items-center justify-center"
                          animate={{
                            borderColor: isCompleted ? "#22c55e" : isActive ? "#0c0f14" : "#e2e8f0",
                            backgroundColor: isCompleted ? "#22c55e" : isActive ? "#0c0f14" : "transparent",
                          }}
                          transition={{ duration: 0.25 }}
                        >
                          {isCompleted ? (
                            <motion.svg
                              width="10" height="10" viewBox="0 0 12 12" fill="none"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          ) : isActive ? (
                            <motion.div
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          ) : null}
                        </motion.div>
                      </div>

                      {/* Text */}
                      <div className="flex-1 flex items-center justify-between">
                        <p
                          className="text-[13px] font-medium m-0 transition-colors duration-200"
                          style={{ color: isCompleted ? "#22c55e" : isActive ? "#0c0f14" : "#cbd5e1" }}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-300 m-0">{step.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
