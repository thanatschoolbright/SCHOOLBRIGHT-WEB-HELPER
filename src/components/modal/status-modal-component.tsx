"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type StatusModalType = "success" | "error" | "confirm" | "delete";

interface StatusModalComponentProps {
  open: boolean;
  type: StatusModalType;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm?: () => void;
  loading?: boolean;
  errorDetails?: unknown;
  confirmLabel?: string;
  cancelLabel?: string;
}

// ---- SVG Icons ----
function IconSuccess() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconError() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---- Config ตามประเภท ----
interface TypeConfig {
  icon: React.JSX.Element;
  iconBg: string;
  iconColor: string;
  defaultTitle: string;
  accentColor: string;
  confirmBg: string;
  confirmHover: string;
}

function getTypeConfig(type: StatusModalType): TypeConfig {
  switch (type) {
    case "success":
      return {
        icon: <IconSuccess />,
        iconBg: "#f0fdf4",
        iconColor: "#16a34a",
        defaultTitle: "ดำเนินการสำเร็จ",
        accentColor: "#16a34a",
        confirmBg: "#0c0f14",
        confirmHover: "rgba(12,15,20,0.88)",
      };
    case "error":
      return {
        icon: <IconError />,
        iconBg: "#fef2f2",
        iconColor: "#dc2626",
        defaultTitle: "เกิดข้อผิดพลาด",
        accentColor: "#dc2626",
        confirmBg: "#0c0f14",
        confirmHover: "rgba(12,15,20,0.88)",
      };
    case "delete":
      return {
        icon: <IconDelete />,
        iconBg: "#fef2f2",
        iconColor: "#dc2626",
        defaultTitle: "ยืนยันการลบ",
        accentColor: "#dc2626",
        confirmBg: "#dc2626",
        confirmHover: "#b91c1c",
      };
    default:
      return {
        icon: <IconWarning />,
        iconBg: "#fffbeb",
        iconColor: "#d97706",
        defaultTitle: "ยืนยันรายการ",
        accentColor: "#d97706",
        confirmBg: "#0c0f14",
        confirmHover: "rgba(12,15,20,0.88)",
      };
  }
}

// ---- Component หลัก ----
export const StatusModalComponent: React.FC<StatusModalComponentProps> = ({
  open,
  type,
  title,
  message,
  onClose,
  onConfirm,
  loading = false,
  errorDetails,
  confirmLabel,
  cancelLabel,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isSuccess = type === "success";
  const isError = type === "error";
  const isDelete = type === "delete";
  const cfg = getTypeConfig(type);

  const handleClose = () => {
    setConfirmInput("");
    setDebugExpanded(false);
    onClose();
  };

  // ยืนยันว่า render ฝั่ง client ก่อนใช้งาน portal
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // ล็อก scroll เมื่อ modal เปิด
  useEffect(() => {
    if (!isMounted) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = open ? "hidden" : previousBodyOverflow;
    document.documentElement.style.overflow = open
      ? "hidden"
      : previousHtmlOverflow;

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMounted, open]);

  // ESC ปิด modal
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = () => {
    if (isDelete && confirmInput !== "Delete") return;
    if (onConfirm) {
      onConfirm();
    } else {
      handleClose();
    }
    setConfirmInput("");
  };

  const canConfirmDelete = !isDelete || confirmInput === "Delete";

  // ขนาด modal
  const maxWidth = isError ? "max-w-[560px]" : "max-w-[400px]";

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998]"
            style={{
              background: "rgba(12,15,20,0.5)",
              backdropFilter: "blur(6px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />

          {/* Modal Overlay Container - ใช้ fixed inset-0 flex items-center justify-center เพื่อให้กลาง Viewport เสมอ */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              className={`bg-white dark:bg-slate-900 rounded-2xl w-full ${maxWidth} relative overflow-hidden pointer-events-auto shadow-2xl`}
              style={{
                boxShadow:
                  "0 24px 60px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.05)",
              }}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar ด้านบน */}
              <div
                className="h-[3px] w-full"
                style={{ background: cfg.accentColor }}
              />

              <div className="p-8">
                {/* ปุ่มปิด */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <IconClose />
                </button>

                {/* Icon + Title + Message */}
                <div className="flex flex-col items-center text-center gap-4 mb-7">
                  {/* Icon badge */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.iconBg, color: cfg.iconColor }}
                  >
                    {cfg.icon}
                  </div>

                  <div>
                    <h2
                      className="text-[18px] font-bold text-slate-900 dark:text-white m-0 mb-2"
                      style={{ letterSpacing: "-0.01em" }}
                    >
                      {title ?? cfg.defaultTitle}
                    </h2>
                    {message ? (
                      <p className="text-[14px] text-slate-500 dark:text-slate-400 m-0 leading-relaxed max-w-[320px]">
                        {message}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Delete confirmation input */}
                {isDelete ? (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 m-0">
                        โปรดพิมพ์{" "}
                        <code className="text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded font-mono text-[11px]">
                          Delete
                        </code>{" "}
                        เพื่อยืนยัน
                      </p>
                      <button
                        type="button"
                        onClick={() => setConfirmInput("Delete")}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        เติมให้อัตโนมัติ
                      </button>
                    </div>
                    <div
                      className={`flex items-center gap-2 py-2.5 px-0 border-b transition-colors duration-200
                        ${
                          confirmInput === "Delete"
                            ? "border-red-500"
                            : "border-slate-200 dark:border-slate-700 focus-within:border-slate-700 dark:focus-within:border-slate-500"
                        }`}
                    >
                      <input
                        type="text"
                        placeholder="Delete"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirm();
                        }}
                        className="flex-1 bg-transparent outline-none text-[14px] text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 font-medium"
                        autoFocus
                      />
                    </div>
                  </motion.div>
                ) : null}

                {/* Debug info (เฉพาะ error) */}
                {isError && errorDetails ? (
                  <motion.div
                    className="mb-6 rounded-xl overflow-hidden border border-slate-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <button
                      type="button"
                      onClick={() => setDebugExpanded((p) => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                        Debug Information
                      </span>
                      <motion.span
                        animate={{ rotate: debugExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-400"
                      >
                        <IconChevron />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {debugExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <pre className="text-[11px] text-slate-600 bg-slate-50 px-4 pb-4 m-0 overflow-auto max-h-[160px] font-mono leading-relaxed border-t border-slate-100">
                            {
                              (typeof errorDetails === "string"
                                ? errorDetails
                                : JSON.stringify(
                                    errorDetails,
                                    null,
                                    2,
                                  )) as string
                            }
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : null}

                {/* Buttons */}
                <motion.div
                  className="flex flex-col gap-2.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 }}
                >
                  {/* Primary button — แสดงเสมอ */}
                  <motion.button
                    type="button"
                    onClick={isSuccess ? handleClose : handleConfirm}
                    disabled={loading || !canConfirmDelete}
                    className="w-full h-[48px] rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    style={{ background: cfg.confirmBg }}
                    whileHover={{
                      opacity: loading || !canConfirmDelete ? 0.4 : 0.88,
                    }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.12 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span>กำลังดำเนินการ...</span>
                      </>
                    ) : (
                      <span>
                        {confirmLabel ??
                          (isDelete
                            ? "ลบรายการ"
                            : isSuccess
                            ? "ตกลง"
                            : "ยืนยัน")}
                      </span>
                    )}
                  </motion.button>

                  {/* Cancel button (ไม่แสดงเมื่อ success) */}
                  {!isSuccess ? (
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="w-full h-[44px] rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {cancelLabel ?? "ยกเลิก"}
                    </button>
                  ) : null}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
