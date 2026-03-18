"use client";

import { AlertOutlined } from "@ant-design/icons";
import UserDropdown from "@components/layouts/backend/user-dropdown";
import { Badge, Flex, Tag, theme, Typography } from "antd";
import { useSession } from "next-auth/react";

const { Text } = Typography;

/**
 * Modern Header Content
 * Simple and transparent to allow the layout's glass effect to shine through.
 */
export default function MainHeader(): JSX.Element {
  const { token } = theme.useToken();
  const { data: sessionData } = useSession();

  // ตรวจสอบว่าพนักงานมีรูปประจำตัวแล้วหรือยัง
  const hasProfileImage = !!sessionData?.user?.image;

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        transition: "all 0.3s ease",
      }}
    >
      {/* Left side: Notifications/Alerts */}
      <Flex align="center">
        {!hasProfileImage && (
          <Badge dot color="error" offset={[-4, 4]}>
            <Tag
              color="error"
              icon={<AlertOutlined />}
              style={{
                borderRadius: 50,
                paddingInline: 16,
                paddingVertical: 4,
                border: "none",
                background: `${token.colorError}15`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
                boxShadow: `0 4px 12px ${token.colorError}10`,
              }}
            >
              <Text
                strong
                style={{
                  color: token.colorError,
                  fontSize: 13,
                }}
              >
                กรุณาอัปโหลดรูปประจำตัวขึ้นระบบ
              </Text>
            </Tag>
          </Badge>
        )}
      </Flex>

      {/* Right side interactions */}
      <Flex align="center" gap={token.marginMD} style={{ marginLeft: "auto" }}>
        <UserDropdown />
      </Flex>
    </Flex>
  );
}
