import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { CompassFilled } from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Button,
  ConfigProvider,
  Flex,
  Grid,
  Menu,
  Tag,
  theme,
  Typography,
} from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const SB_ORANGE_PRIMARY = "#FF7F00";
const SB_ORANGE_GRADIENT = "linear-gradient(135deg, #FF9933 0%, #FF6600 100%)";

/**
 * Clean Sidebar Component
 * Optimized for readability and minimal CSS usage.
 */

const StatusTag = ({ type }: { type: "new" | "revamp" }) => {
  const { token } = theme.useToken();
  return (
    <Tag
      bordered={false}
      style={{
        marginLeft: "8px",
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 10,
        padding: "0 6px",
        background:
          type === "new"
            ? SB_ORANGE_GRADIENT
            : "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
        color: token.colorWhite,
      }}
    >
      {type.toUpperCase()}
    </Tag>
  );
};

type MenuItem = Required<MenuProps>["items"][number];

export default function SidebarContent({
  collapsed = false,
  onMobileClose,
}: {
  collapsed?: boolean;
  onMobileClose?: () => void;
}) {
  const { t: TRANSLATION } = useTranslation("translate");
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const isDark = token.colorBgBase === "#0B0F19";

  // --- Theme Configuration for Menu ---
  const sidebarTheme = {
    components: {
      Menu: {
        itemBg: "transparent",
        itemColor: token.colorTextSecondary,
        itemHoverBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        itemSelectedBg: isDark
          ? "rgba(255, 127, 0, 0.2)"
          : "rgba(255, 127, 0, 0.12)",
        itemSelectedColor: SB_ORANGE_PRIMARY,
        itemActiveBg: "transparent",
        itemMarginInline: 8,
        itemBorderRadius: 10,
        subMenuItemBg: "transparent",
      },
    },
  };

  // Sync open keys with current pathname
  useEffect(() => {
    if (collapsed) return;
    const activeParent = menu.find((m) =>
      m.children?.some((c) => c.href === pathname),
    );
    if (activeParent)
      setOpenKeys((prev) => Array.from(new Set([...prev, activeParent.label])));
  }, [menu, pathname, collapsed]);

  // Clean Menu Items Mapping to Best Practice MenuItem[]
  const items: MenuItem[] = useMemo(() => {
    return menu.map((m) => {
      const parentKey = m.href || m.label;

      const label =
        collapsed || !m.tag ? (
          m.label
        ) : (
          <Flex align="center" justify="space-between">
            <span>{m.label}</span>
            <Tag
              color="orange"
              bordered={false}
              style={{
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 600,
                color: SB_ORANGE_PRIMARY,
                background: isDark
                  ? "rgba(255, 127, 0, 0.2)"
                  : "rgba(255, 127, 0, 0.1)",
                marginInlineEnd: 0,
              }}
            >
              {m.tag}
            </Tag>
          </Flex>
        );

      return {
        key: parentKey,
        icon: m.icon,
        label: label,
        children: m.children?.map((c) => ({
          key: c.href,
          icon: c.icon,
          label:
            collapsed || (!c.news && !c.revamp) ? (
              c.label
            ) : (
              <Flex align="center" justify="space-between">
                <span>{c.label}</span>
                <Flex gap={4}>
                  {c.news && <StatusTag type="new" />}
                  {c.revamp && <StatusTag type="revamp" />}
                </Flex>
              </Flex>
            ),
        })),
      } as MenuItem;
    });
  }, [menu, isDark, collapsed]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const target = String(key);
    if (target.startsWith("/")) {
      router.push(target);
      if (!screens.md) onMobileClose?.();
    }
  };

  return (
    <ConfigProvider theme={sidebarTheme}>
      <Flex
        vertical
        style={{
          height: "100%",
          padding: "16px 0",
          overflowY: "auto",
        }}
      >
        {/* 🔸 Sidebar Logo Section */}
        <Flex
          justify={collapsed ? "center" : "flex-start"}
          style={{
            padding: collapsed ? "0 8px" : "0 16px",
            marginBottom: 20,
            transition: "all 0.3s",
          }}
        >
          <Button
            type="text"
            onClick={() => router.push("/main")}
            style={{
              height: "auto",
              padding: "6px 8px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Flex align="center" gap={collapsed ? 0 : 12}>
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 38,
                  height: 38,
                  background: SB_ORANGE_GRADIENT,
                  borderRadius: 10,
                  boxShadow: `0 4px 12px ${token.colorPrimary}44`,
                  flexShrink: 0,
                }}
              >
                <CompassFilled
                  style={{ fontSize: 20, color: token.colorWhite }}
                />
              </Flex>

              {!collapsed && (
                <Flex vertical align="start">
                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      lineHeight: 1.2,
                      color: token.colorTextHeading,
                      whiteSpace: "nowrap",
                    }}
                  >
                    School Bright
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 9, lineHeight: 1, whiteSpace: "nowrap" }}
                  >
                    {TRANSLATION("navbar.backend_system")}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Button>
        </Flex>

        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[pathname]}
          openKeys={!collapsed ? openKeys : undefined}
          onOpenChange={setOpenKeys}
          onClick={handleMenuClick}
          items={items}
          style={{ border: "none" }}
          theme={isDark ? "dark" : "light"}
        />
      </Flex>
    </ConfigProvider>
  );
}
