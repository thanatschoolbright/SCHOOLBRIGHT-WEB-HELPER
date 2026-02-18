import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";
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

const StatusTag = ({ type }: { type: "new" | "revamp" | "maintenance" }) => {
  const { t } = useTranslation("menu");

  const getStatusProps = () => {
    switch (type) {
      case "new":
        return { color: "orange", text: t("status.new") };
      case "revamp":
        return { color: "blue", text: t("status.revamp") };
      case "maintenance":
        return { color: "red", text: t("status.maintenance") };
      default:
        return { color: "default", text: "" };
    }
  };

  const { color, text } = getStatusProps();

  return (
    <Tag
      color={color}
      bordered={false}
      style={{
        marginLeft: "8px",
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 10,
        padding: "0 6px",
      }}
    >
      {text}
    </Tag>
  );
};

type MenuItem = Required<MenuProps>["items"][number];

export default function SidebarContent({
  collapsed = false,
  onToggle,
  onMobileClose,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  onMobileClose?: () => void;
}) {
  const { t: TRANSLATION } = useTranslation("translate");
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const sidebarTheme = {
    components: {
      Menu: {
        itemActiveBg: "transparent",
        itemMarginInline: 8,
        itemBorderRadius: 10,
      },
    },
  };

  useEffect(() => {
    if (collapsed) return;
    const findActiveParent = (items: any[]): any | undefined => {
      for (const item of items) {
        if (item.href === pathname) return item;
        if (item.children) {
          const child = findActiveParent(item.children);
          if (child) return item;
        }
      }
      return undefined;
    };
    const activeParent = findActiveParent(menu);
    if (activeParent)
      setOpenKeys((prev) => Array.from(new Set([...prev, activeParent.label])));
  }, [menu, pathname, collapsed]);

  const mapMenuItems = (item: any): MenuItem => {
    const { label, icon, href, children, tag } = item;
    const parentKey = href || label;

    // Use Level 1: Extra Bold (Department level)
    const level1Style: React.CSSProperties = {
      fontWeight: 800,
      fontSize: "14px",
      letterSpacing: "0.2px",
    };

    const displayLabel =
      collapsed || (!tag && !item.maintenance) ? (
        <span style={level1Style}>{label}</span>
      ) : (
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <span style={level1Style}>{label}</span>
          <Flex gap={4}>
            {item.maintenance && <StatusTag type="maintenance" />}
            {tag && (
              <Tag
                color="orange"
                bordered={false}
                style={{
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  marginInlineEnd: 0,
                }}
              >
                {tag}
              </Tag>
            )}
          </Flex>
        </Flex>
      );

    const childLabel = (c: any, depth: number) => {
      // Depth 2: Semi-bold (System level)
      // Depth 3: Medium (Leaf/Link level)
      const labelStyle: React.CSSProperties = {
        fontWeight: depth === 2 ? 600 : 400,
        fontSize: depth === 2 ? "13.5px" : "13px",
      };

      if (collapsed || (!c.news && !c.revamp && !c.maintenance)) {
        return <span style={labelStyle}>{c.label}</span>;
      }

      return (
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <span style={labelStyle}>{c.label}</span>
          <Flex gap={4}>
            {c.news && <StatusTag type="new" />}
            {c.revamp && <StatusTag type="revamp" />}
            {c.maintenance && <StatusTag type="maintenance" />}
          </Flex>
        </Flex>
      );
    };

    return {
      key: parentKey,
      icon,
      label: displayLabel,
      children: children?.map((c: any) => {
        if (c.children) {
          return {
            key: c.label || c.href,
            icon: c.icon,
            label: childLabel(c, 2),
            children: c.children.map((sub: any) => ({
              key: sub.href || sub.label,
              icon: sub.icon,
              label: childLabel(sub, 3),
            })),
          };
        }
        return {
          key: c.href || c.label,
          icon: c.icon,
          label: childLabel(c, 2), // If no sub-children, it's Level 2 leaf
        };
      }),
    } as MenuItem;
  };

  const items: MenuItem[] = useMemo(() => {
    return menu.map((m) => mapMenuItems(m));
  }, [menu, collapsed]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const target = String(key);
    if (target.startsWith("/")) {
      router.push(target);
      if (!screens.md) onMobileClose?.();
    } else if (target.startsWith("http")) {
      window.open(target, "_blank");
    }
  };

  return (
    <ConfigProvider theme={sidebarTheme}>
      <Flex
        vertical
        style={{
          height: "100vh",
          padding: "16px 0",
          background: "transparent",
        }}
      >
        <Flex
          align="center"
          justify={collapsed ? "center" : "space-between"}
          style={{
            padding: "0 16px",
            marginBottom: 24,
            transition: "all 0.3s",
          }}
        >
          {!collapsed && (
            <Flex
              align="center"
              gap={12}
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/main")}
            >
              <img
                src="/web-app-manifest-192x192.png"
                alt="Logo"
                style={{ width: 38, height: 38, borderRadius: 8 }}
              />
              <Flex vertical>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    lineHeight: 1.2,
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
            </Flex>
          )}

          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            style={{
              fontSize: 18,
              display: screens.lg ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Flex>

        <Flex vertical style={{ flex: 1, overflowY: "auto" }}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[pathname]}
            openKeys={!collapsed ? openKeys : undefined}
            onOpenChange={setOpenKeys}
            onClick={handleMenuClick}
            items={items}
            style={{ border: "none" }}
          />
        </Flex>

        {!collapsed && (
          <Flex style={{ padding: 16 }}>
            <DarkModeToggle />
          </Flex>
        )}
      </Flex>
    </ConfigProvider>
  );
}
