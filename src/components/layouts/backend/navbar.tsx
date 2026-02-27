"use client";

import UserDropdown from "@components/layouts/backend/user-dropdown";
import { Flex, Grid, theme } from "antd";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const { useBreakpoint } = Grid;

export default function MainHeader(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const router = useRouter();
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  return (
    <Flex
      align="center"
      justify="flex-end"
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
      {/* Right: User Profile Section */}
      <Flex align="center">
        <UserDropdown />
      </Flex>
    </Flex>
  );
}
