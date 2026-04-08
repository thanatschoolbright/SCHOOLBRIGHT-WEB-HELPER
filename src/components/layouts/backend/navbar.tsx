"use client";

import UserDropdown from "@components/layouts/backend/user-dropdown";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

// SVG Bell icon
function IconAlert() {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/**
 * Navbar หลักของ Backend Layout
 * โปร่งใส รองรับ glass effect จาก layout
 */
export default function MainHeader(): React.JSX.Element {
  const { data: sessionData } = useSession();

  // ตรวจสอบว่าพนักงานมีรูปประจำตัวแล้วหรือยัง
  const hasProfileImage = !!sessionData?.user?.image;

  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* Left: Alert banner เมื่อยังไม่มีรูปโปรไฟล์ */}
      <div className="flex items-center">
        <AnimatePresence>
          {!hasProfileImage && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative"
            >
              {/* Dot indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 z-10">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              </span>

              {/* Alert pill */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100">
                <span className="text-red-500">
                  <IconAlert />
                </span>
                <span className="text-[12px] font-semibold text-red-600 leading-none">
                  กรุณาอัปโหลดรูปประจำตัวขึ้นระบบ
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: User Dropdown */}
      <div className="flex items-center ml-auto">
        <UserDropdown />
      </div>
    </div>
  );
}
