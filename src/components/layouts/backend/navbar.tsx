"use client";

/**
 * 🧭 MainHeader: Header หลักของ backend layout
 * - ปรับปรุง Mobile Responsive: ลดขนาด Logo, Icon, Text และ Gap บนจอมือถือ
 * - ใช้ Tailwind Breakpoints (sm, md) เพื่อขยายขนาดเมื่ออยู่บนจอใหญ่
 */

import { useRouter } from "next/navigation";
import { Badge, Button, Tooltip, theme, Typography } from "antd";
import {
  BellOutlined,
  CompassFilled,
  HomeOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import UserDropdown from "@components/layouts/backend/user-dropdown";

export default function MainHeader(): JSX.Element {
  const router = useRouter();
  const { token } = theme.useToken();

  // --- Constants ---
  const SB_GRADIENT = "linear-gradient(135deg, #FF9933 0%, #FF6600 100%)";

  return (
    <header
      // 📱 Layout: ปรับ Padding มือถือ (px-3) vs จอใหญ่ (sm:px-4)
      className="sticky top-0 z-50 w-full backdrop-blur-md shadow-sm transition-all duration-300 ease-in-out animate-fade-in-down px-3 py-2 sm:px-4"
      style={{
        borderBottom: `1px solid ${token.colorSplit}`,
      }}
    >
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
        {/* 🔸 Logo Section */}
        <div
          onClick={() => router.push("/main")}
          // 📱 Responsive: ลด Padding และ Gap ในปุ่ม Logo บนมือถือ
          className="
            group cursor-pointer flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl
            hover:bg-black/5 dark:hover:bg-white/10
            transition-all duration-300 ease-out active:scale-95
          "
        >
          {/* Logo Icon */}
          <div
            style={{ background: SB_GRADIENT }}
            // 📱 Responsive: ปรับขนาดกล่องไอคอน w-8 (32px) บนมือถือ -> w-10 (40px) บนจอใหญ่
            className="
              w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl 
              flex items-center justify-center shadow-lg shadow-orange-500/30
              transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              group-hover:scale-110 group-hover:rotate-3
            "
          >
            {/* 📱 Responsive: ปรับขนาด icon fontSize */}
            <CompassFilled className="text-lg sm:text-[22px] text-white" />
          </div>

          <div className="flex flex-col">
            <Typography.Text
              strong
              // 📱 Responsive: ปรับขนาด Text ชื่อโรงเรียน
              className="text-sm sm:text-base leading-tight transition-colors duration-300"
              style={{ color: token.colorTextHeading }}
            >
              School Bright
            </Typography.Text>
            <Typography.Text
              type="secondary"
              // 📱 Responsive: ปรับขนาด Subtitle และซ่อนบนจอเล็กมากๆ ถ้าจำเป็น
              className="text-[10px] sm:text-[11px] tracking-wider opacity-80"
            >
              Backend System
            </Typography.Text>
          </div>
        </div>

        {/* 🔹 Right Actions Section */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* ปุ่มหน้าหลัก: ซ่อน Text บนมือถือ */}
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => router.push("/main")}
            style={{ color: token.colorTextSecondary }}
            className="
              flex items-center justify-center rounded-lg
              hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20
              transition-all duration-200 active:scale-90
              w-8 h-8 sm:w-auto sm:h-auto /* ปรับขนาดปุ่มบนมือถือ */
            "
          >
            <span className="hidden md:inline ml-1">หน้าหลัก</span>
          </Button>

          {/* ปุ่ม Apps: ซ่อนบนมือถือจอเล็ก (แสดงเมื่อจอ sm ขึ้นไป) */}
          <Tooltip title="แอปพลิเคชัน">
            <Button
              type="text"
              shape="circle"
              icon={<AppstoreOutlined />}
              style={{ color: token.colorTextSecondary }}
              className="hidden sm:flex hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-transform active:scale-90"
            />
          </Tooltip>

          {/* แจ้งเตือน */}
          <Tooltip title="แจ้งเตือน">
            <Badge dot color="#FF4D4F" offset={[-4, 4]}>
              <Button
                type="text"
                shape="circle"
                // 📱 Responsive: ปรับขนาด Icon กระดิ่ง
                icon={
                  <BellOutlined className="text-base sm:text-lg group-hover:animate-swing origin-top" />
                }
                style={{
                  color: token.colorTextSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
                className="
                  group hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20
                  transition-all duration-200 active:scale-90
                  w-8 h-8 sm:w-8 sm:h-8 /* ปรับขนาดปุ่ม */
                "
              />
            </Badge>
          </Tooltip>

          {/* ขีดคั่น: ซ่อนบนมือถือ */}
          <div
            className="h-6 w-px hidden sm:block mx-1"
            style={{ backgroundColor: token.colorSplit }}
          />

          {/* User Profile (Responsive handled inside UserDropdown usually, but wrapper padding helps) */}
          <div className="pl-0 sm:pl-1">
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
