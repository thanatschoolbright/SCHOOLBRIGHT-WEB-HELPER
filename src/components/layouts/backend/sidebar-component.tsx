import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import type { MenuProps } from "antd";
import { Flex, Grid, Menu, Tag, theme } from "antd";
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
      marginLeft: "8px",
      fontSize: 10,
      fontWeight: 700,
      borderRadius: 10,
      padding: "0 6px",
      background:
        type === "new"
          ? SB_ORANGE_GRADIENT
          : "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
      color: "white",
    }}
  >
    {type.toUpperCase()}
  </Tag>
);

type MenuItem = Required<MenuProps>["items"][number];

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

  // Clean Menu Items Mapping to Best Practice MenuItem[]
  const items: MenuItem[] = useMemo(() => {
    return menu.map((m) => {
      const parentKey = m.href || m.label;

      // ✅ เมื่อหุบ Sidebar ให้ใช้ Label เป็น String เพียวๆ เพื่อให้ AntD แสดงผลใน Tooltip และ Popup ได้ถูกต้อง
      // เมื่อกาง Sidebar ค่อยใช้ JSX เพื่อแสดง Tag และการจัดวางที่สวยงาม
      const label =
        collapsed || !m.tag ? (
          m.label
        ) : (
          <Flex
            align="center"
            justify="space-between"
            style={{ width: "100%" }}
          >
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
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
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
  }, [menu, isDark, collapsed]); // ✅ เพิ่ม collapsed เป็น dependency เพื่อสลับประเภทยาเบลสิกตอนหุบ/กาง

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
        padding: "12px 0",
        overflowY: "auto",
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
        theme={isDark ? "dark" : "light"}
        className="sidebar-menu"
      />

      <style jsx global>{`
        /* ปรับแต่งเฉพาะตัว Sidebar Menu */
        .sidebar-menu.ant-menu {
          border-inline-end: none !important;
          background: transparent !important;
        }

        /* ปรับแต่ง Item เฉพาะเมื่ออยู่ใน Sidebar (ไม่รวม Popup) */
        .sidebar-menu .ant-menu-item,
        .sidebar-menu .ant-menu-submenu-title {
          margin-bottom: 4px !important;
          border-radius: 8px !important;
          transition: all 0.3s ease;
        }

        /* จัดการกาง (Expanded) */
        .sidebar-menu.ant-menu-inline .ant-menu-item,
        .sidebar-menu.ant-menu-inline .ant-menu-submenu-title {
          width: calc(100% - 16px) !important;
          margin-inline: 8px !important;
        }

        /* จัดการหุบ (Collapsed) */
        .sidebar-menu.ant-menu-inline-collapsed .ant-menu-item,
        .sidebar-menu.ant-menu-inline-collapsed .ant-menu-submenu-title {
          width: calc(100% - 16px) !important;
          margin-inline: 8px !important;
          padding-inline: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }

        .sidebar-menu.ant-menu-inline-collapsed .ant-menu-item .anticon,
        .sidebar-menu.ant-menu-inline-collapsed
          .ant-menu-submenu-title
          .anticon {
          margin: 0 !important;
          font-size: 20px !important;
        }

        /* จัดการ Popup Menu (ตัวที่ลอยออกมาตอนหุบ) */
        .ant-menu-submenu-popup {
          z-index: 10000 !important;
        }

        .ant-menu-submenu-popup .ant-menu-item {
          border-radius: 6px !important;
          margin: 4px !important;
        }

        /* สีตัวอักษรใน Popup */
        .ant-menu-submenu-popup .ant-menu-title-content {
          font-weight: 500;
        }

        /* ซ่อนลูกศรเมื่อหุบ */
        .sidebar-menu.ant-menu-inline-collapsed
          .ant-menu-submenu-title
          .ant-menu-submenu-arrow {
          display: none !important;
        }

        .sidebar-menu .ant-menu-item-selected {
          background: ${isDark
            ? "rgba(255, 127, 0, 0.2)"
            : "rgba(255, 127, 0, 0.15)"} !important;
          color: ${SB_ORANGE_PRIMARY} !important;
          font-weight: 600 !important;
        }

        .sidebar-menu .ant-menu-item-selected .anticon {
          color: ${SB_ORANGE_PRIMARY} !important;
        }
      `}</style>
    </div>
  );
}
