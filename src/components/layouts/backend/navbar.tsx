"use client";

/**
 * 🧭 MainHeader: Header หลักของ backend layout
 * - ปรับปรุงให้เป็น Tailwind CSS
 * - เพิ่ม Mobile Responsive (ซ่อน text หน้าหลักบนจอมือถือ)
 * - เพิ่ม Smooth Animations (Entrance, Hover, Click effects)
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
  // จำเป็นต้องใช้ token สำหรับสีที่เปลี่ยนตาม Dark/Light Mode ของ Ant Design
  const { token } = theme.useToken();

  // --- Constants ---
  const SB_GRADIENT = "linear-gradient(135deg, #FF9933 0%, #FF6600 100%)";

  return (
    // 🟢 Container: ใช้ Tailwind จัดการ Layout, Backdrop blur, และ Animation ตอนโหลด
    // ใช้ inline style เฉพาะ border color ที่ต้องเปลี่ยนตาม theme
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md shadow-sm transition-all duration-300 ease-in-out animate-fade-in-down px-4 py-2"
      style={{
        borderBottom: `1px solid ${token.colorSplit}`,
      }}
    >
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
        {/* 🔸 Logo Section */}
        <div
          onClick={() => router.push("/main")}
          className="
            group cursor-pointer flex items-center gap-3 px-3 py-2 rounded-2xl
            hover:bg-black/5 dark:hover:bg-white/10
            transition-all duration-300 ease-out active:scale-95
          "
        >
          {/* Logo Icon with Elastic Animation */}
          <div
            style={{ background: SB_GRADIENT }}
            className="
              w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30
              transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              group-hover:scale-110 group-hover:rotate-3
            "
          >
            <CompassFilled style={{ fontSize: 22, color: "white" }} />
          </div>

          <div className="flex flex-col">
            <Typography.Text
              strong
              className="text-base leading-tight transition-colors duration-300"
              style={{ color: token.colorTextHeading }}
            >
              School Bright
            </Typography.Text>
            <Typography.Text
              type="secondary"
              className="text-[11px] tracking-wider opacity-80"
            >
              Backend System
            </Typography.Text>
          </div>
        </div>

        {/* 🔹 Right Actions Section */}
        {/* Responsive: ลด gap บนมือถือ */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* ปุ่มหน้าหลัก: Responsive (ซ่อน Text บนมือถือ) */}
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => router.push("/main")}
            style={{ color: token.colorTextSecondary }}
            className="
              flex items-center justify-center rounded-lg
              hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20
              transition-all duration-200 active:scale-90
            "
          >
            {/* ซ่อน Text เมื่อจอเล็กกว่า md (768px) */}
            <span className="hidden md:inline ml-1">หน้าหลัก</span>
          </Button>

          {/* ปุ่ม Apps: ซ่อนบนมือถือจอเล็กมาก */}
          <Tooltip title="แอปพลิเคชัน">
            <Button
              type="text"
              shape="circle"
              icon={<AppstoreOutlined />}
              style={{ color: token.colorTextSecondary }}
              className="hidden sm:flex hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-transform active:scale-90"
            />
          </Tooltip>

          {/* แจ้งเตือน พร้อม Animation กระดิ่ง */}
          <Tooltip title="แจ้งเตือน">
            <Badge dot color="#FF4D4F" offset={[-4, 4]}>
              <Button
                type="text"
                shape="circle"
                icon={
                  <BellOutlined className="text-lg group-hover:animate-swing origin-top" />
                }
                style={{
                  color: token.colorTextSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
                className="
                  group hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20
                  transition-all duration-200 active:scale-90
                "
              />
            </Badge>
          </Tooltip>

          {/* ขีดคั่น: ซ่อนบนมือถือ */}
          <div
            className="h-6 w-px hidden sm:block mx-1"
            style={{ backgroundColor: token.colorSplit }}
          />

          {/* User Profile */}
          <div className="pl-1">
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
