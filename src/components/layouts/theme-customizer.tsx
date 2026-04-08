"use client";

import {
  FONT_CSS_VAR,
  type FontFamily,
  useFont,
} from "@components/providers/font-provider";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

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
];

// SVG Icons
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconType() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ThemeCustomizer() {
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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger Button — ชิดขวากลางหน้า */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-[1100] flex items-center justify-center w-11 h-11 rounded-l-xl text-white border-none cursor-pointer"
        style={{ background: "#f97316" }}
        whileHover={{ width: 52 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        title="ปรับแต่งเว็บไซต์"
      >
        <IconSettings />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[1199]"
              style={{ background: "rgba(12,15,20,0.35)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full z-[1200] bg-white dark:bg-slate-900 w-[380px] flex flex-col"
              style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.1)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/8 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-orange-500">
                    <IconSettings />
                  </span>
                  <h2 className="text-[15px] font-bold text-slate-800 dark:text-white m-0">
                    ปรับแต่งหน้าเว็บไซต์
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <IconClose />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Section: Font */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-500">
                      <IconType />
                    </span>
                    <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200 m-0 uppercase tracking-widest">
                      รูปแบบตัวอักษร
                    </h3>
                  </div>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-5 m-0">
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
                          className={`w-full text-left rounded-xl border-[1.5px] transition-all duration-150 cursor-pointer overflow-hidden
                            ${isActive
                              ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
                              : "border-slate-100 dark:border-white/8 bg-white dark:bg-white/4 hover:border-slate-300 dark:hover:border-white/20"
                            }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                            {/* Left: Font info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[14px] font-semibold truncate ${isActive ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-200"}`}
                                  style={{ fontFamily: FONT_CSS_VAR[font.value] }}
                                >
                                  {font.label}
                                </span>
                                <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 font-medium flex-shrink-0">
                                  {font.desc}
                                </span>
                              </div>
                              {/* Sample text */}
                              <div
                                className="flex items-baseline gap-2"
                                style={{ fontFamily: FONT_CSS_VAR[font.value] }}
                              >
                                <span className="text-[18px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
                                  {font.sampleTh}
                                </span>
                                <span className="text-[13px] text-slate-400 dark:text-slate-500 leading-tight">
                                  {font.sampleEn}
                                </span>
                              </div>
                            </div>

                            {/* Right: Check */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                isActive
                                  ? "bg-orange-500 text-white"
                                  : "bg-slate-100 dark:bg-white/8 text-transparent"
                              }`}
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
              <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 flex-shrink-0">
                <p className="text-center text-[11px] text-slate-300 dark:text-slate-600 m-0">
                  SchoolBright Web Helper · Customizer v2.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
