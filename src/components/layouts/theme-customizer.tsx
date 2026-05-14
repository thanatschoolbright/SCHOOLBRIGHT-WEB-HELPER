"use client";

import {
  FONT_CSS_VAR,
  type FontFamily,
  useFont,
} from "@components/providers/font-provider";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// hook อ่าน dark mode ปัจจุบันจาก DOM class และติดตาม class changes บน <html>
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(checkDark());
    setMounted(true);
    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return { isDark, mounted };
}

// ข้อมูลฟอนต์ทั้ง 5 ตัว
const FONT_OPTIONS: {
  value: FontFamily;
  label: string;
  labelThai: string;
  desc: string;
  sampleEn: string;
  sampleTh: string;
}[] = [
  {
    value: "anuphan",
    label: "Anuphan",
    labelThai: "อนุพันธ์",
    desc: "Modern · ไทย-อังกฤษ",
    sampleEn: "AaBbCc 123",
    sampleTh: "สวัสดีครับ",
  },
  {
    value: "google-sans",
    label: "Google Sans",
    labelThai: "Google Sans",
    desc: "Clean · Sans-serif",
    sampleEn: "AaBbCc 123",
    sampleTh: "สวัสดีครับ",
  },
  {
    value: "sukhumvit",
    label: "Sukhumvit Set",
    labelThai: "สุขุมวิท",
    desc: "Classic · Thai-focused",
    sampleEn: "AaBbCc 123",
    sampleTh: "สวัสดีครับ",
  },
  {
    value: "kanit",
    label: "Kanit",
    labelThai: "กนิต",
    desc: "Bold · Display",
    sampleEn: "AaBbCc 123",
    sampleTh: "สวัสดีครับ",
  },
  {
    value: "line-seed",
    label: "LINE Seed",
    labelThai: "LINE Seed",
    desc: "Rounded · Friendly",
    sampleEn: "AaBbCc 123",
    sampleTh: "สวัสดีครับ",
  },
  {
    value: "sarabun",
    label: "Sarabun",
    labelThai: "สารบรรณ",
    desc: "Elegant · Thai Official",
    sampleEn: "AaBbCc 123",
    sampleTh: "สวัสดีครับ",
  },
];

// SVG Icons
function IconSettings() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconType() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="15"
      height="15"
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

export default function ThemeCustomizer() {
  const { isDark, mounted } = useDarkMode();
  const { fontFamily, setFontFamily } = useFont();
  const [open, setOpen] = useState(false);

  // ESC ปิด drawer
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // ล็อก scroll เมื่อ drawer เปิด
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Trigger Button — render ผ่าน portal เพื่อหนี parent ที่มี will-change/transform */}
      {mounted &&
        createPortal(
          <div className="fixed top-1/2 -translate-y-1/2 right-1.5 sm:right-2 z-[1100]">
            {/* Ping ring รอบปุ่ม */}
            <motion.span
              className="absolute inset-0 rounded-l-xl pointer-events-none"
              animate={{ opacity: [0.5, 0], scale: [1, 1.25] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeOut",
              }}
            />

            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl sm:rounded-2xl text-white border-none cursor-pointer outline-none shadow-lg shadow-orange-500/20"
              style={{ background: "#f97316" }}
              animate={{ x: [0, -3, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              title="ปรับแต่งเว็บไซต์"
            >
              <motion.span
                animate={{ rotate: [0, 18, -18, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
              >
                <IconSettings />
              </motion.span>
            </motion.button>
          </div>,
          document.body,
        )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="fixed inset-0 z-[1199]"
                  style={{
                    background: isDark
                      ? "rgba(6,10,18,0.7)"
                      : "rgba(12,15,20,0.35)",
                    backdropFilter: "blur(4px)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setOpen(false)}
                />

                {/* Drawer */}
                <motion.div
                  className="fixed top-0 right-0 h-full z-[1200] w-[380px] flex flex-col"
                  style={{
                    background: isDark ? "#1E293B" : "#ffffff",
                    boxShadow: isDark
                      ? "-12px 0 60px rgba(0,0,0,0.5)"
                      : "-8px 0 40px rgba(0,0,0,0.1)",
                    borderLeft: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                  }}
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                    style={{
                      borderBottom: `1px solid ${
                        isDark ? "#334155" : "#f1f5f9"
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span style={{ color: "#f97316" }}>
                        <IconSettings />
                      </span>
                      <h2
                        className="text-[15px] font-bold m-0"
                        style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                      >
                        ปรับแต่งหน้าเว็บไซต์
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer outline-none"
                      style={{
                        background: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "#f1f5f9",
                        color: isDark ? "#94a3b8" : "#64748b",
                      }}
                    >
                      <IconClose />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    {/* Section: Font */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: "#f97316" }}>
                          <IconType />
                        </span>
                        <h3
                          className="text-[13px] font-bold m-0 uppercase tracking-widest"
                          style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                        >
                          รูปแบบตัวอักษร
                        </h3>
                      </div>
                      <p
                        className="text-[12px] mb-5 m-0"
                        style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                      >
                        ฟอนต์ทั้งหมดรองรับภาษาไทยและภาษาอังกฤษ
                      </p>

                      <div className="flex flex-col gap-3">
                        {FONT_OPTIONS.map((font) => {
                          const isActive = fontFamily === font.value;
                          return (
                            <motion.button
                              key={font.value}
                              type="button"
                              onClick={() => setFontFamily(font.value)}
                              className="w-full text-left rounded-xl transition-all duration-150 cursor-pointer overflow-hidden border-none outline-none"
                              style={{
                                background: isActive
                                  ? isDark
                                    ? "rgba(249,115,22,0.12)"
                                    : "rgba(249,115,22,0.06)"
                                  : isDark
                                  ? "rgba(255,255,255,0.04)"
                                  : "#ffffff",
                                border: `1.5px solid ${
                                  isActive
                                    ? "#f97316"
                                    : isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "#e2e8f0"
                                }`,
                                boxShadow: isActive
                                  ? "0 0 0 3px rgba(249,115,22,0.1)"
                                  : "none",
                              }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                                {/* Left: Font info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="text-[14px] font-semibold truncate"
                                      style={{
                                        fontFamily: FONT_CSS_VAR[font.value],
                                        color: isActive
                                          ? "#f97316"
                                          : isDark
                                          ? "#e2e8f0"
                                          : "#334155",
                                      }}
                                    >
                                      {font.label}
                                    </span>
                                    <span
                                      className="text-[10px] rounded px-1.5 py-0.5 font-medium flex-shrink-0"
                                      style={{
                                        background: isDark
                                          ? "rgba(255,255,255,0.06)"
                                          : "#f1f5f9",
                                        border: `1px solid ${
                                          isDark
                                            ? "rgba(255,255,255,0.1)"
                                            : "#e2e8f0"
                                        }`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                      }}
                                    >
                                      {font.desc}
                                    </span>
                                  </div>
                                  {/* Sample text */}
                                  <div
                                    className="flex items-baseline gap-2"
                                    style={{
                                      fontFamily: FONT_CSS_VAR[font.value],
                                    }}
                                  >
                                    <span
                                      className="text-[18px] font-medium leading-tight"
                                      style={{
                                        color: isDark ? "#cbd5e1" : "#475569",
                                      }}
                                    >
                                      {font.sampleTh}
                                    </span>
                                    <span
                                      className="text-[13px] leading-tight"
                                      style={{
                                        color: isDark ? "#64748b" : "#94a3b8",
                                      }}
                                    >
                                      {font.sampleEn}
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Check */}
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                  style={{
                                    background: isActive
                                      ? "#f97316"
                                      : isDark
                                      ? "rgba(255,255,255,0.08)"
                                      : "#f1f5f9",
                                    color: isActive ? "#ffffff" : "transparent",
                                    boxShadow: isActive
                                      ? "0 2px 8px rgba(249,115,22,0.35)"
                                      : "none",
                                  }}
                                >
                                  <IconCheck />
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className="px-6 py-4 flex-shrink-0"
                    style={{
                      borderTop: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                    }}
                  >
                    <p
                      className="text-center text-[11px] m-0"
                      style={{ color: isDark ? "#475569" : "#cbd5e1" }}
                    >
                      SchoolBright Web Helper · Customizer v2.0
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
