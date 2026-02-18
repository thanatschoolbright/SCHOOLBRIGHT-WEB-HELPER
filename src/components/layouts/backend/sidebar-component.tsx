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
  const { t: translate } = useTranslation("translate");
  const sidebarMenu = useSidebarMenu();
  const currentPathname = usePathname();
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
      for (const menuItem of items) {
        if (menuItem.href === currentPathname) return menuItem;
        if (menuItem.children) {
          const childItem = findActiveParent(menuItem.children);
          if (childItem) return menuItem;
        }
      }
      return undefined;
    };
    const activeParent = findActiveParent(sidebarMenu);
    if (activeParent)
      setOpenKeys((prev) => Array.from(new Set([...prev, activeParent.label])));
  }, [sidebarMenu, currentPathname, collapsed]);

  const mapMenuItems = (menuItem: any): MenuItem => {
    const { label, icon, href, children, tag } = menuItem;
    const parentKey = href || label;

    const level1Style: React.CSSProperties = {
      fontWeight: 800,
      fontSize: "14px",
      letterSpacing: "0.2px",
    };

    const displayLabel =
      collapsed || (!tag && !menuItem.maintenance) ? (
        <span style={level1Style}>{label}</span>
      ) : (
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <span style={level1Style}>{label}</span>
          <Flex gap={4}>
            {menuItem.maintenance && <StatusTag type="maintenance" />}
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

    const childLabel = (child: any, depth: number) => {
      const labelStyle: React.CSSProperties = {
        fontWeight: depth === 2 ? 600 : 400,
        fontSize: depth === 2 ? "13.5px" : "13px",
      };

      if (collapsed || (!child.news && !child.revamp && !child.maintenance)) {
        return <span style={labelStyle}>{child.label}</span>;
      }

      return (
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <span style={labelStyle}>{child.label}</span>
          <Flex gap={4}>
            {child.news && <StatusTag type="new" />}
            {child.revamp && <StatusTag type="revamp" />}
            {child.maintenance && <StatusTag type="maintenance" />}
          </Flex>
        </Flex>
      );
    };

    return {
      key: parentKey,
      icon,
      label: displayLabel,
      children: children?.map((child: any) => {
        if (child.children) {
          return {
            key: child.label || child.href,
            icon: child.icon,
            label: childLabel(child, 2),
            children: child.children.map((sub: any) => ({
              key: sub.href || sub.label,
              icon: sub.icon,
              label: childLabel(sub, 3),
            })),
          };
        }
        return {
          key: child.href || child.label,
          icon: child.icon,
          label: childLabel(child, 2),
        };
      }),
    } as MenuItem;
  };

  const sidebarMenuItems: MenuItem[] = useMemo(() => {
    return sidebarMenu.map((menuItem) => mapMenuItems(menuItem));
  }, [sidebarMenu, collapsed]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const clickTarget = String(key);
    if (clickTarget.startsWith("/")) {
      router.push(clickTarget);
      if (!screens.md) onMobileClose?.();
    } else if (clickTarget.startsWith("http")) {
      window.open(clickTarget, "_blank");
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
                  {translate("navbar.backend_system")}
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
            selectedKeys={[currentPathname]}
            openKeys={!collapsed ? openKeys : undefined}
            onOpenChange={setOpenKeys}
            onClick={handleMenuClick}
            items={sidebarMenuItems}
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
