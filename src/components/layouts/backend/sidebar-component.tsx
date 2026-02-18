import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Button,
  ConfigProvider,
  Flex,
  Grid,
  Menu,
  Switch,
  Tag,
  theme,
  Typography,
} from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const DARK_MODE_KEY = "theme";

const DarkModeToggle = () => {
  const { token } = theme.useToken();
  const [isDarkModeActive, setIsDarkModeActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
      if (savedDarkMode !== null) {
        setIsDarkModeActive(savedDarkMode === "dark");
      } else {
        const prefersDarkMode = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        setIsDarkModeActive(prefersDarkMode);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const documentRoot = document.documentElement;
    if (isDarkModeActive) {
      documentRoot.classList.add("dark");
    } else {
      documentRoot.classList.remove("dark");
    }
  }, [isDarkModeActive, isInitialized]);

  const handleToggleDarkMode = (checkedValue: boolean) => {
    setIsDarkModeActive(checkedValue);
    localStorage.setItem(DARK_MODE_KEY, checkedValue ? "dark" : "light");
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        paddingTop: 24,
        marginTop: 24,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        width: "100%",
      }}
    >
      <Flex align="center" gap={12}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: isDarkModeActive
              ? token.colorFillSecondary
              : token.colorPrimaryBg,
            color: isDarkModeActive ? token.colorText : token.colorPrimary,
          }}
        >
          {isDarkModeActive ? <MoonOutlined /> : <SunOutlined />}
        </Flex>
        <Flex vertical>
          <Text strong style={{ fontSize: 14 }}>
            {isDarkModeActive ? "โหมดมืด" : "โหมดสว่าง"}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {isDarkModeActive ? "ปกป้องดวงตาของคุณ" : "มองเห็นได้ชัดเจน"}
          </Text>
        </Flex>
      </Flex>
      <Switch
        checked={isDarkModeActive}
        onChange={handleToggleDarkMode}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
      />
    </Flex>
  );
};

const StatusTag = ({ type }: { type: "new" | "revamp" | "maintenance" }) => {
  const { t: translateMenu } = useTranslation("menu");

  const statusProperties = useMemo(() => {
    switch (type) {
      case "new":
        return { color: "orange", text: translateMenu("status.new") };
      case "revamp":
        return { color: "blue", text: translateMenu("status.revamp") };
      case "maintenance":
        return { color: "red", text: translateMenu("status.maintenance") };
      default:
        return { color: "default", text: "" };
    }
  }, [type, translateMenu]);

  return (
    <Tag
      color={statusProperties.color}
      bordered={false}
      style={{
        marginLeft: "8px",
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 10,
        padding: "0 6px",
      }}
    >
      {statusProperties.text}
    </Tag>
  );
};

type MenuItem = Required<MenuProps>["items"][number];

export default function SidebarContent({
  collapsed = false,
  onToggle: onSidebarToggle,
  onMobileClose: onMobileMenuClose,
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
    if (activeParent) {
      setOpenKeys((prev) => Array.from(new Set([...prev, activeParent.label])));
    }
  }, [sidebarMenu, currentPathname, collapsed]);

  const getChildLabel = (child: any, depth: number) => {
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

    return {
      key: parentKey,
      icon,
      label: displayLabel,
      children: children?.map((childItem: any) => {
        if (childItem.children) {
          return {
            key: childItem.label || childItem.href,
            icon: childItem.icon,
            label: getChildLabel(childItem, 2),
            children: childItem.children.map((subItem: any) => ({
              key: subItem.href || subItem.label,
              icon: subItem.icon,
              label: getChildLabel(subItem, 3),
            })),
          };
        }
        return {
          key: childItem.href || childItem.label,
          icon: childItem.icon,
          label: getChildLabel(childItem, 2),
        };
      }),
    } as MenuItem;
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const clickTarget = String(key);
    if (clickTarget.startsWith("/")) {
      router.push(clickTarget);
      if (!screens.md) onMobileMenuClose?.();
    } else if (clickTarget.startsWith("http")) {
      window.open(clickTarget, "_blank");
    }
  };

  const sidebarMenuItems: MenuItem[] = useMemo(() => {
    return sidebarMenu.map((menuItem) => mapMenuItems(menuItem));
  }, [sidebarMenu, collapsed]);

  const handleLogoClick = () => {
    router.push("/main");
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
              onClick={handleLogoClick}
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
            onClick={onSidebarToggle}
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
