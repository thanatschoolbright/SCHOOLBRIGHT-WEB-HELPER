"use client";

import { CompassFilled } from "@ant-design/icons";
import UserDropdown from "@components/layouts/backend/user-dropdown";
import { Flex, Grid, theme, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function MainHeader(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const router = useRouter();
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  // --- Constants ---
  const SB_GRADIENT = "linear-gradient(135deg, #FF9933 0%, #FF6600 100%)";

  const getGlassBackground = (colorHex: string, opacity: number) => {
    const hex = colorHex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: getGlassBackground(token.colorBgContainer, 0.85),
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${token.colorSplit}`,
        transition: "all 0.3s ease",
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        style={{
          width: "100%", // ✅ บังคับให้กว้างเต็มพื้นที่
          height: "100%",
          padding: screens.md ? "0 24px" : "0 16px", // ✅ ระยะห่างจากขอบซ้ายขวา (ปรับได้ตามชอบ เช่น 24px หรือ 32px)
          // maxWidth: 1600,  // ❌ ลบออก เพื่อไม่ให้บีบเข้ามาตรงกลาง
          // margin: "0 auto", // ❌ ลบออก
        }}
      >
        {/* 🔸 Left: Logo Section (ชิดซ้ายโดยธรรมชาติจาก justify="space-between") */}
        <Flex
          align="center"
          gap={screens.md ? 16 : 10}
          onClick={() => router.push("/main")}
          style={{ cursor: "pointer" }}
          className="hover:opacity-80 active:scale-95 transition-all group"
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: screens.md ? 44 : 36,
              height: screens.md ? 44 : 36,
              background: SB_GRADIENT,
              borderRadius: screens.md ? 12 : 8,
              boxShadow: "0 4px 12px rgba(255, 102, 0, 0.25)",
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            className="group-hover:scale-110 group-hover:rotate-3"
          >
            <CompassFilled
              style={{
                fontSize: screens.md ? 24 : 20,
                color: "white",
              }}
            />
          </Flex>

          <Flex vertical justify="center" gap={2}>
            <Text
              strong
              style={{
                fontSize: screens.md ? 18 : 15,
                lineHeight: 1.1,
                color: token.colorTextHeading,
                letterSpacing: "-0.5px",
              }}
            >
              School Bright
            </Text>
            {screens.sm && (
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  lineHeight: 1,
                  opacity: 0.8,
                  fontWeight: 500,
                }}
              >
                {TRANSLATION("navbar.backend_system")}
              </Text>
            )}
          </Flex>
        </Flex>

        {/* 🔹 Right: User Profile Section */}
        <Flex align="center">
          <UserDropdown />
        </Flex>
      </Flex>
    </div>
  );
}
