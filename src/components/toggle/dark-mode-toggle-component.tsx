"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setIsDark(prefersDark);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark, initialized]);

  return (
    <div
      className="pt-6 border-t mt-6"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={false}
            animate={{
              scale: isDark ? 0.9 : 1,
              opacity: isDark ? 0.5 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? "#666" : "#FF7F00"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </motion.div>

          <div className="flex flex-col">
            <span
              className="font-semibold text-base"
              style={{ color: isDark ? "#fff" : "#262626" }}
            >
              {isDark ? "โหมดมืด" : "โหมดสว่าง"}
            </span>
            <span
              className="text-xs"
              style={{
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
              }}
            >
              {isDark ? "ปกป้องดวงตาของคุณ" : "มองเห็นได้ชัดเจน"}
            </span>
          </div>
        </div>

        <motion.button
          onClick={() => setIsDark(!isDark)}
          className="relative flex items-center rounded-full p-1 focus:outline-none focus:ring-4 transition-all"
          style={{
            width: "68px",
            height: "36px",
            background: isDark
              ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
              : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            boxShadow: isDark
              ? "0 4px 16px rgba(30, 58, 138, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 4px 16px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
            border: isDark
              ? "1px solid rgba(59, 130, 246, 0.3)"
              : "1px solid rgba(251, 191, 36, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="absolute rounded-full shadow-lg flex items-center justify-center"
            style={{
              width: "28px",
              height: "28px",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
            initial={false}
            animate={{
              x: isDark ? 32 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.svg
                  key="moon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#1e40af"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="sun"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <circle cx="12" cy="12" r="5" />
                  <line
                    x1="12"
                    y1="1"
                    x2="12"
                    y2="3"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="12"
                    y1="21"
                    x2="12"
                    y2="23"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="4.22"
                    y1="4.22"
                    x2="5.64"
                    y2="5.64"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18.36"
                    y1="18.36"
                    x2="19.78"
                    y2="19.78"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="1"
                    y1="12"
                    x2="3"
                    y2="12"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="21"
                    y1="12"
                    x2="23"
                    y2="12"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="4.22"
                    y1="19.78"
                    x2="5.64"
                    y2="18.36"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18.36"
                    y1="5.64"
                    x2="19.78"
                    y2="4.22"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Background stars for dark mode */}
          <AnimatePresence>
            {isDark && (
              <>
                <motion.div
                  className="absolute"
                  style={{
                    width: "3px",
                    height: "3px",
                    background: "#fff",
                    borderRadius: "50%",
                    left: "12px",
                    top: "8px",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.5], scale: [0, 1, 0.8] }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
                <motion.div
                  className="absolute"
                  style={{
                    width: "2px",
                    height: "2px",
                    background: "#fff",
                    borderRadius: "50%",
                    left: "18px",
                    top: "18px",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.8, 0.4], scale: [0, 1, 0.7] }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                <motion.div
                  className="absolute"
                  style={{
                    width: "2px",
                    height: "2px",
                    background: "#fff",
                    borderRadius: "50%",
                    left: "8px",
                    top: "22px",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.6, 0.3], scale: [0, 1, 0.6] }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0.9,
            opacity: isDark ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isDark ? "#3b82f6" : "#999"}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
