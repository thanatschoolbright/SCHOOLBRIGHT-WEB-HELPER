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
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../package.json";

const { Text } = Typography;

const DARK_MODE_KEY = "theme";

interface DarkModeToggleProps {
  collapsed?: boolean;
}

const DarkModeToggle = ({ collapsed }: DarkModeToggleProps) => {
  const { token } = theme.useToken();
  const [isDarkModeActive, setIsDarkModeActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
      if (savedDarkMode !== null) {
        // eslint-disable-next-line
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

  return collapsed ? (
    <Flex
      align="center"
      justify="center"
      style={{
        paddingTop: 16,
        marginTop: 16,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        width: "100%",
      }}
    >
      <Flex
        align="center"
        justify="center"
        onClick={() => {
          handleToggleDarkMode(!isDarkModeActive);
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: isDarkModeActive
            ? token.colorFillSecondary
            : token.colorPrimaryBg,
          color: isDarkModeActive ? token.colorText : token.colorPrimary,
          cursor: "pointer",
        }}
        title={isDarkModeActive ? "โหมดมืด" : "โหมดสว่าง"}
      >
        {isDarkModeActive ? <MoonOutlined /> : <SunOutlined />}
      </Flex>
    </Flex>
  ) : (
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

export interface CustomMenuItemType {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  news?: boolean;
  revamp?: boolean;
  maintenance?: boolean;
  tag?: string;
  children?: CustomMenuItemType[];
}

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
    token: {
      fontFamily: token.fontFamily,
      colorBgContainer: token.colorBgContainer, // Solid background
    },
    components: {
      Menu: {
        itemActiveBg: token.colorFillTertiary,
        itemHoverBg: token.colorFillQuaternary,
        itemSelectedBg: token.colorPrimaryBgHover,
        itemSelectedColor: token.colorPrimary,
        itemMarginInline: 16,
        itemBorderRadius: 10,
        subMenuItemBg: "transparent",
      },
    },
  };

  useEffect(() => {
    if (collapsed || !currentPathname) return;

    const findPathKeys = (
      items: CustomMenuItemType[],
      targetHref: string,
    ): string[] | null => {
      for (const item of items) {
        const itemKey = item.href ?? item.label;
        if (item.href === targetHref) {
          return [itemKey];
        }
        if (item.children) {
          const path = findPathKeys(item.children, targetHref);
          if (path) {
            return [itemKey, ...path];
          }
        }
      }
      return null;
    };

    const pathKeys = findPathKeys(sidebarMenu, currentPathname);
    if (pathKeys) {
      const newOpenKeys = pathKeys.slice(0, -1);
      if (newOpenKeys.length > 0) {
        // eslint-disable-next-line
        setOpenKeys((prev) => Array.from(new Set([...prev, ...newOpenKeys])));
      }
    }
  }, [sidebarMenu, currentPathname, collapsed]);

  const getChildLabel = (child: CustomMenuItemType, depth: number) => {
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

  const mapMenuItems = (menuItem: CustomMenuItemType): MenuItem => {
    const { label, icon, href, children, tag } = menuItem;
    const itemKey = href ?? label;

    const level1Style: React.CSSProperties = {
      fontWeight: 700,
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
      key: itemKey,
      icon,
      label: displayLabel,
      children: children?.map((childItem: CustomMenuItemType) => {
        const childKey = childItem.href ?? childItem.label;

        if (childItem.children) {
          return {
            key: childKey,
            icon: childItem.icon,
            label: getChildLabel(childItem, 2),
            children: childItem.children.map((subItem: CustomMenuItemType) => ({
              key: subItem.href ?? subItem.label,
              icon: subItem.icon,
              label: getChildLabel(subItem, 3),
            })),
          };
        }
        return {
          key: childKey,
          icon: childItem.icon,
          label: getChildLabel(childItem, 2),
        };
      }),
    } as MenuItem;
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const clickTarget = key;
    if (clickTarget.startsWith("/")) {
      router.push(clickTarget);
      if (!screens.md) onMobileMenuClose?.();
    } else if (clickTarget.startsWith("http")) {
      window.open(clickTarget, "_blank");
    }
  };

  const sidebarMenuItems: MenuItem[] = (
    sidebarMenu as CustomMenuItemType[]
  ).map((menuItem) => mapMenuItems(menuItem));

  const handleLogoClick = () => {
    router.push("/main");
  };

  return (
    <ConfigProvider theme={sidebarTheme}>
      <style>{`
        .sidebar-menu-wrapper .ant-menu-item-selected {
          border: 1px solid ${token.colorPrimary} !important;
          background-color: ${token.colorPrimaryBg} !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
          font-weight: 600 !important;
        }
        .sidebar-menu-wrapper .ant-menu-item {
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
      `}</style>
      <Flex
        className="sidebar-menu-wrapper"
        vertical
        style={{
          height: "100vh",
          padding: "24px 0",
          background: token.colorBgContainer, // Solid color for clear visibility
        }}
      >
        <Flex
          align="center"
          justify={collapsed ? "center" : "space-between"}
          style={{
            padding: "0 20px",
            marginBottom: 32,
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
              <Image
                src="/web-app-manifest-192x192.png"
                alt="Logo"
                width={42}
                height={42}
                style={{ borderRadius: 12, objectFit: "cover" }}
              />
              <Flex vertical>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    fontWeight: 800,
                  }}
                >
                  School Bright
                </Text>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 9,
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                    letterSpacing: 0.5,
                  }}
                >
                  {translate("navbar.backend_system").toUpperCase()}
                </Text>
              </Flex>
            </Flex>
          )}

          {screens.lg && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={onSidebarToggle}
              style={{
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 10,
              }}
            />
          )}
        </Flex>

        <Flex
          vertical
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
          className="custom-scrollbar"
        >
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[currentPathname]}
            openKeys={!collapsed ? openKeys : undefined}
            onOpenChange={setOpenKeys}
            onClick={handleMenuClick}
            items={sidebarMenuItems}
            style={{ border: "none", background: "transparent" }}
          />
        </Flex>

        <Flex
          vertical
          gap={token.marginSM}
          style={{
            padding: collapsed ? "16px 8px" : "16px 20px",
            marginTop: "auto",
            transition: "all 0.3s",
          }}
        >
          <DarkModeToggle collapsed={collapsed} />
          <Flex
            justify={collapsed ? "center" : "flex-start"}
            style={{ padding: "0 4px" }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: 10,
                opacity: 0.6,
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              v{packageJson.version}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </ConfigProvider>
  );
}
