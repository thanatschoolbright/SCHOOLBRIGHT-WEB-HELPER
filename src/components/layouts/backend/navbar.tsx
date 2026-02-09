"use client";

import { CompassFilled } from "@ant-design/icons";
import UserDropdown from "@components/layouts/backend/user-dropdown";
import { Button, Flex, Grid, theme, Typography } from "antd";
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

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        width: "100%",
        height: "100%",
        padding: screens.md ? "0 24px" : "0 16px",
        background: token.colorBgContainer,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        transition: "all 0.3s ease",
      }}
    >
      {/* 🔸 Left: Logo Section */}
      <Button
        type="text"
        onClick={() => router.push("/main")}
        style={{
          height: "auto",
          padding: "4px 8px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Flex align="center" gap={screens.md ? 12 : 8}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: screens.md ? 40 : 32,
              height: screens.md ? 40 : 32,
              background: SB_GRADIENT,
              borderRadius: screens.md ? 10 : 8,
              boxShadow: `0 4px 12px ${token.colorPrimary}44`,
            }}
          >
            <CompassFilled
              style={{ fontSize: screens.md ? 20 : 16, color: "#fff" }}
            />
          </Flex>

          <Flex vertical align="start">
            <Text
              strong
              style={{
                fontSize: screens.md ? 17 : 14,
                lineHeight: 1.2,
                color: token.colorTextHeading,
              }}
            >
              School Bright
            </Text>
            {screens.sm && (
              <Text type="secondary" style={{ fontSize: 10, lineHeight: 1 }}>
                {TRANSLATION("navbar.backend_system")}
              </Text>
            )}
          </Flex>
        </Flex>
      </Button>

      {/* 🔹 Right: User Profile Section */}
      <Flex align="center">
        <UserDropdown />
      </Flex>
    </Flex>
  );
}
