"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState, useAppSelector } from "@stores/store";

export default function UserDropdown() {
  const dispatch = useDispatch<AppDispatch>();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation(); // ← ถ้าอยากใช้ t ในอนาคต
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false); // ปิด dropdown หลังเปลี่ยน
  };

  useEffect(() => {
    console.log("AUTHENTICATION", AUTHENTICATION);
  }, []);

  return (
    <div className="relative">
      {/* Avatar & Name */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium text-gray-700 dark:text-orange-400 hidden sm:block">
          สวัสดีคุณ &nbsp;
          {(AUTHENTICATION.response.data.name ?? "Name") +
            " " +
            (AUTHENTICATION.response.data.lastname ?? "")}{" "}
        </span>
        <Image
          src="/photo/profile.png"
          alt="Avatar"
          width={36}
          height={36}
          className="rounded-full border"
        />
        {/* Arrow Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-[60] border border-gray-200 dark:border-gray-700 text-sm animate-fade-in-down transition-all duration-300">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {AUTHENTICATION.response.data.name ?? "ชื่อ"}{" "}
              {AUTHENTICATION.response.data.lastname ?? "นามสกุล"}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {AUTHENTICATION.response.data.username ?? "mail@mail.com"}
            </p>
          </div>

          <div className="py-2">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition">
              Profile
            </button>
            <button
              onClick={() => {
                localStorage.clear(); // ลบข้อมูลทั้งหมดใน localStorage
                window.location.href = "/"; // หรือใช้ router.push("/login") หากมีหน้าล็อกอิน
              }}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition"
            >
              Logout
            </button>
          </div>

          {/* Language Switcher */}
          <div className="py-2 border-t border-gray-200 dark:border-gray-700">
            <p className="px-4 pb-2 text-xs text-gray-400 dark:text-gray-500">
              Language
            </p>
            <div className="flex gap-2 px-4">
              {["en", "th"].map((lng) => {
                const isActive = i18n.language === lng;
                return (
                  <button
                    key={lng}
                    onClick={() => changeLanguage(lng)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${
                      isActive
                        ? "border-orange-500 text-orange-500 bg-orange-100 dark:bg-orange-900 animate-pulse"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {lng.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
