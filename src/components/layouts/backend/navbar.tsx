"use client";

/**
 * 🧭 MainHeader: Header หลักของ backend layout
 * ใช้ Ant Design สำหรับ UI minimal, รองรับ Dark Mode
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Space,
  Tooltip,
  theme,
  Typography,
} from "antd";
import { BellOutlined, CompassOutlined, HomeOutlined } from "@ant-design/icons";
import UserDropdown from "@components/layouts/backend/user-dropdown";

/**
 * 📦 MainHeader: Component Header สำหรับแสดงโลโก้และเมนูผู้ใช้
 * - โลโก้คลิกได้เพื่อกลับหน้า backend
 * - เมนูผู้ใช้ด้านขวา
 */
export default function MainHeader(): JSX.Element {
  const router = useRouter();
  const { token } = theme.useToken();
  const [brandHover, setBrandHover] = useState(false);

  return (
    <div className="px-6">
      <Flex align="center" justify="space-between">
        {/* 🔸 โลโก้ */}
        <Flex
          align="center"
          gap={10}
          onClick={() => router.push("/main")}
          className="px-3 py-2 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            background: brandHover ? token.colorFillSecondary : "transparent",
          }}
          onMouseEnter={() => setBrandHover(true)}
          onMouseLeave={() => setBrandHover(false)}
        >
          <CompassOutlined
            className="text-2xl"
            style={{ color: token.colorPrimary }}
          />
          <Typography.Title
            level={5}
            className="m-0 font-bold tracking-tight"
            style={{ color: token.colorText }}
          >
            สคูลไบรท์
          </Typography.Title>
        </Flex>

        {/* 🔹 เมนูผู้ใช้ */}
        <Space size={12} align="center">
          <Button
            type="primary"
            icon={<HomeOutlined />}
            shape="round"
            onClick={() => router.push("/main")}
            className="shadow-sm"
          >
            กลับหน้าหลัก
          </Button>

          <Divider type="vertical" className="h-8 mx-2" />

          <Tooltip title="แจ้งเตือนล่าสุด">
            <Badge dot color={token.colorWarning} offset={[-3, 3]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined className="text-lg" />}
                style={{ color: token.colorTextSecondary }}
                className="hover:scale-105 transition-transform"
              />
            </Badge>
          </Tooltip>

          <UserDropdown />
        </Space>
      </Flex>
    </div>
  );
}
