import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import type { MenuProps } from "antd";
import { Grid, Menu, Tag, theme } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SB_ORANGE_PRIMARY = "#FF7F00";
const SB_ORANGE_GRADIENT = "linear-gradient(135deg, #FF9933 0%, #FF6600 100%)";

/**
 * Clean Sidebar Component
 * Optimized for readability and minimal CSS usage.
 */

const StatusTag = ({ type }: { type: "new" | "revamp" }) => (
  <Tag
    bordered={false}
    style={{
      marginLeft: "auto",
      fontSize: 10,
      fontWeight: 700,
      borderRadius: 10,
      padding: "0 8px",
      background:
        type === "new"
          ? SB_ORANGE_GRADIENT
          : "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
      color: "white",
      transform: "scale(0.9)",
    }}
  >
    {type.toUpperCase()}
  </Tag>
);

export default function SidebarContent({
  collapsed = false,
  onMobileClose,
}: {
  collapsed?: boolean;
  onMobileClose?: () => void;
}) {
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const isDark = token.colorBgBase === "#0B0F19";

  // Sync open keys with current pathname
  useEffect(() => {
    if (collapsed) return;
    const activeParent = menu.find((m) =>
      m.children?.some((c) => c.href === pathname),
    );
    if (activeParent)
      setOpenKeys((prev) => Array.from(new Set([...prev, activeParent.label])));
  }, [menu, pathname, collapsed]);

  // Clean Menu Items Mapping
  const items: MenuProps["items"] = useMemo(() => {
    return menu.map((m) => ({
      key: m.href || m.label,
      icon: m.icon,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>{m.label}</span>
          {m.tag && (
            <Tag
              color="orange"
              bordered={false}
              style={{
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                color: SB_ORANGE_PRIMARY,
                background: isDark
                  ? "rgba(255, 127, 0, 0.2)"
                  : "rgba(255, 127, 0, 0.1)",
              }}
            >
              {m.tag}
            </Tag>
          )}
        </div>
      ),
      children: m.children?.map((c) => ({
        key: c.href,
        icon: c.icon,
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>{c.label}</span>
            <div style={{ display: "flex" }}>
              {c.news && <StatusTag type="new" />}
              {c.revamp && <StatusTag type="revamp" />}
            </div>
          </div>
        ),
      })),
    }));
  }, [menu, isDark]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const target = String(key);
    if (target.startsWith("/")) {
      router.push(target);
      if (!screens.md) onMobileClose?.();
    }
  };

  return (
    <div
      style={{
        height: "100%",
        padding: "20px 0",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[pathname]}
        openKeys={!collapsed ? openKeys : undefined}
        onOpenChange={setOpenKeys}
        onClick={handleMenuClick}
        items={items}
        style={{ borderInlineEnd: "none", background: "transparent" }}
      />

      <style jsx global>{`
        .ant-menu-item,
        .ant-menu-submenu-title {
          margin-bottom: 4px !important;
          border-radius: 8px !important;
          margin-inline: 8px !important;
          width: calc(100% - 16px) !important;
        }
        .ant-menu-item-selected {
          background: ${isDark
            ? "rgba(255, 127, 0, 0.15)"
            : "rgba(255, 127, 0, 0.08)"} !important;
          color: ${SB_ORANGE_PRIMARY} !important;
          font-weight: 600 !important;
        }
        .ant-menu-item-selected::after {
          border-inline-end: 3px solid ${SB_ORANGE_PRIMARY} !important;
        }
        .ant-menu-item .anticon,
        .ant-menu-submenu-title .anticon {
          font-size: 18px !important;
        }
        .ant-menu-item-selected .anticon {
          color: ${SB_ORANGE_PRIMARY} !important;
        }
        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: ${isDark ? "#333" : "#ccc"};
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
