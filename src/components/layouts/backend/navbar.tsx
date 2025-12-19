"use client";

/**
 * 🧭 MainHeader: Header หลักของ backend layout
 * ปรับปรุง UI ให้ดูทันสมัย (Modern Glassmorphism) และรองรับ Dark Mode
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Flex,
  Space,
  Tooltip,
  theme,
  Typography,
  Avatar,
} from "antd";
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
  const [isScrolled, setIsScrolled] = useState(false);

  // ตรวจจับการ Scroll เพื่อใส่เงา (Optional: ถ้าต้องการ)
  // ในที่นี้ใส่เงาบางๆ ตลอดเวลาเพื่อความสวยงาม

  // --- Theme Colors ---
  const SB_GRADIENT = "linear-gradient(135deg, #FF9933 0%, #FF6600 100%)";

  return (
    <div
      style={{
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${token.colorSplit}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        transition: "all 0.3s ease",
      }}
    >
      <Flex align="center" justify="space-between" style={{ width: "100%" }}>
        {/* 🔸 Logo Section */}
        <div
          onClick={() => router.push("/main")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "6px 12px",
            borderRadius: 12,
            transition: "all 0.2s ease",
          }}
          className="hover:bg-black/5 dark:hover:bg-white/10 group"
        >
          {/* Logo Icon with Gradient Background */}
          <div
            style={{
              width: 40,
              height: 40,
              background: SB_GRADIENT,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(255, 102, 0, 0.3)",
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            className="group-hover:scale-110"
          >
            <CompassFilled style={{ fontSize: 22, color: "white" }} />
          </div>

          <div className="flex flex-col">
            <Typography.Text
              strong
              style={{
                fontSize: 16,
                lineHeight: 1.2,
                color: token.colorTextHeading,
              }}
            >
              School Bright
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, letterSpacing: "0.5px" }}
            >
              Backend System
            </Typography.Text>
          </div>
        </div>

        {/* 🔹 Right Actions */}
        <Space size={16} align="center">
          {/* ปุ่มกลับหน้าหลักแบบ Minimal */}
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => router.push("/main")}
            style={{
              color: token.colorTextSecondary,
              borderRadius: 8,
            }}
            className="hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            หน้าหลัก
          </Button>

          {/* ปุ่มเมนูเสริม (Optional) */}
          <Tooltip title="แอปพลิเคชัน">
            <Button
              type="text"
              shape="circle"
              icon={<AppstoreOutlined />}
              style={{ color: token.colorTextSecondary }}
            />
          </Tooltip>

          {/* แจ้งเตือน */}
          <Tooltip title="แจ้งเตือน">
            <Badge dot color="#FF4D4F" offset={[-4, 4]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                style={{
                  color: token.colorTextSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
                className="hover:text-orange-500 hover:border-orange-500 transition-colors"
              />
            </Badge>
          </Tooltip>

          {/* ขีดคั่นบางๆ */}
          <div
            style={{
              width: 1,
              height: 24,
              backgroundColor: token.colorSplit,
              margin: "0 4px",
            }}
          />

          {/* User Profile */}
          <UserDropdown />
        </Space>
      </Flex>
    </div>
  );
}
