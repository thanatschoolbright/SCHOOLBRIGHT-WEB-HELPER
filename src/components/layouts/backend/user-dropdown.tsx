"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";

export default function UserDropdown() {
  const dispatch = useDispatch<AppDispatch>();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const userData = AUTHENTICATION?.response?.data?.user_data || {};

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const clearStorage = () => {
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
  };

  const handleLogout = async () => {
    const toastId = toast.loading("1/2 กำลังโหลด...", { duration: Infinity });
    try {
      await sleep(400);
      toast.loading("2/2 กำลังลบข้อมูล...", {
        id: toastId,
        duration: Infinity,
      });
      clearStorage();
      await sleep(300);
      toast.success("ออกจากระบบสำเร็จ", { id: toastId, duration: 2000 });
      setIsOpen(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 400);
    } catch {
      toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", {
        id: toastId,
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    console.log("AUTHENTICATION", AUTHENTICATION);
  }, [AUTHENTICATION]);

  if (!isOpen) {
    return (
      <div className="relative">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-orange-400 hidden sm:block">
            สวัสดีคุณ &nbsp;
            {`${userData.firstname ?? "Name"} ${userData.lastname ?? ""} `}
          </span>
          <Image
            src="/photo/profile.png"
            alt="Avatar"
            width={36}
            height={36}
            className="rounded-full border"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 rotate-0"
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
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(false)}
      >
        <span className="text-sm font-medium text-gray-700 dark:text-orange-400 hidden sm:block">
          สวัสดีคุณ &nbsp;
          {`${userData.firstname ?? "Name"} ${userData.lastname ?? ""} `}
        </span>
        <Image
          src="/photo/profile.png"
          alt="Avatar"
          width={36}
          height={36}
          className="rounded-full border"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 rotate-180"
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

      <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-[60] border border-gray-200 dark:border-gray-700 text-sm animate-fade-in-down transition-all duration-300">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {`${userData.firstname ?? "ชื่อ"} ${
              userData.lastname ?? "นามสกุล"
            }`}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {userData.email ?? "mail@mail.com"}
          </p>
        </div>

        <div className="py-2">
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition">
            โปรไฟล์ของฉัน
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition"
          >
            ออกจากระบบ
          </button>
        </div>

        <div className="py-2 border-t border-gray-200 dark:border-gray-700">
          <p className="px-4 pb-2 text-xs text-gray-400 dark:text-gray-500">
            ภาษา / Language
          </p>
          <div className="flex gap-2 px-4">
            {["en", "th"].map((lng) => {
              const isActive = i18n.language === lng;
              const baseClasses =
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300";
              const activeClasses =
                "border-orange-500 text-orange-500 bg-orange-100 dark:bg-orange-900 animate-pulse";
              const inactiveClasses =
                "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200";
              return (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className={`${baseClasses} ${
                    isActive ? activeClasses : inactiveClasses
                  }`}
                >
                  {lng.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
