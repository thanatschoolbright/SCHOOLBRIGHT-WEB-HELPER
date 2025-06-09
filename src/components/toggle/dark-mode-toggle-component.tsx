"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // เมื่อ component ติดตั้งครั้งแรก ให้อ่านค่าใน localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        setIsDark(true);
      } else if (saved === "light") {
        setIsDark(false);
      } else {
        // ถ้ายังไม่มีใน localStorage ให้ตรวจ system preference
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setIsDark(prefersDark);
      }
      setInitialized(true);
    }
  }, []);

  // เมื่อ isDark เปลี่ยน ให้อัปเดต <html> class และ localStorage
  useEffect(() => {
    if (!initialized) return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, initialized]);

  return (
    <div className="pt-6 border-t mt-6 border-gray-300 dark:border-gray-600">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">
          {isDark ? "Dark Mode" : "Light Mode"}
        </span>
        {/* ✅ iPhone-style toggle switch */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
            isDark ? "bg-orange-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
              isDark ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
