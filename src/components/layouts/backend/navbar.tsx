"use client";

import UserDropdown from "@components/layouts/backend/user-dropdown";
import { Flex, theme } from "antd";

/**
 * Modern Header Content
 * Simple and transparent to allow the layout's glass effect to shine through.
 */
export default function MainHeader(): JSX.Element {
  const { token } = theme.useToken();

  return (
    <Flex
      align="center"
      justify="flex-end"
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        transition: "all 0.3s ease",
      }}
    >
      {/* Right side interactions */}
      <Flex align="center" gap={token.marginMD}>
        <UserDropdown />
      </Flex>
    </Flex>
  );
}
