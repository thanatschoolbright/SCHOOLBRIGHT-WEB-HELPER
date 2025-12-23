import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Tag, Tooltip, ConfigProvider, Grid } from "antd";
import type { MenuProps } from "antd";

const SB_ORANGE_PRIMARY = "#FF7F00";
const SB_ORANGE_LIGHT = "#FFF2E8";
const SB_ORANGE_GRADIENT_START = "#FF9933";
const SB_ORANGE_GRADIENT_END = "#FF6600";

const { useBreakpoint } = Grid;

function MenuTooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip title={label} placement="right" mouseEnterDelay={0.3}>
      <span
        className={`truncate block font-medium tracking-wide w-full ${
          className || ""
        }`}
      >
        {children}
      </span>
    </Tooltip>
  );
}

function StatusTag({ type }: { type: "new" | "revamp" | string }) {
  const isNew = type === "new";
  return (
    <Tag
      bordered={false}
      style={{
        marginLeft: "auto",
        marginRight: 0,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.5px",
        lineHeight: "14px",
        borderRadius: 8,
        padding: "1px 6px",
        background: isNew
          ? `linear-gradient(135deg, ${SB_ORANGE_GRADIENT_START} 0%, ${SB_ORANGE_GRADIENT_END} 100%)`
          : "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
        color: "white",
        boxShadow: isNew
          ? "0 2px 6px rgba(255, 127, 0, 0.25)"
          : "0 2px 6px rgba(24, 144, 255, 0.25)",
        transform: "scale(0.9)",
      }}
    >
      {type.toUpperCase()}
    </Tag>
  );
}

type SidebarContentProps = {
  collapsed?: boolean;
  onMobileClose?: () => void;
};

export default function SidebarContent({
  collapsed = false,
  onMobileClose,
}: SidebarContentProps) {
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const screens = useBreakpoint();

  useEffect(() => {
    if (collapsed) return;
    const parent = menu.find(
      (m) => m.children && m.children.some((c) => c.href === pathname)
    );
    if (parent) {
      setOpenKeys((prev) => Array.from(new Set([...prev, parent.label])));
    }
  }, [menu, pathname, collapsed]);

  const items: MenuProps["items"] = useMemo(() => {
    return menu.map((m) => {
      // 1. Label Content (Parent & Single Item)
      const labelContent = (
        <div
          className="sb-menu-label-wrapper" // ใช้ class แทน inline style
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {!collapsed ? (
            <MenuTooltip label={m.label}>
              <span style={{ fontWeight: 500, letterSpacing: "0.3px" }}>
                {m.label}
              </span>
            </MenuTooltip>
          ) : (
            <span style={{ fontWeight: 500, letterSpacing: "0.3px" }}>
              {m.label}
            </span>
          )}

          {m.tag && (
            <Tag
              color="orange"
              bordered={false}
              style={{
                borderRadius: 6,
                fontSize: 10,
                color: SB_ORANGE_PRIMARY,
                background: "rgba(255, 127, 0, 0.1)",
                marginLeft: 8,
              }}
            >
              {m.tag}
            </Tag>
          )}
        </div>
      );

      // 2. Submenu (Children)
      if (m.children && m.children.length) {
        return {
          key: m.label,
          icon: m.icon,
          label: labelContent,
          children: m.children.map((c) => ({
            key: c.href,
            icon: c.icon,
            label: (
              <div
                className="sb-submenu-label-wrapper" // Class สำหรับจัดการ Style ใน Popup
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <MenuTooltip label={c.label}>
                  {/* ไม่ใส่ color ปล่อยให้ Theme จัดการ */}
                  <span>{c.label}</span>
                </MenuTooltip>
                <>
                  {c.news && <StatusTag type="new" />}
                  {c.revamp && <StatusTag type="revamp" />}
                </>
              </div>
            ),
          })),
        };
      }

      // 3. Single Item
      return {
        key: m.href || m.label,
        icon: m.icon,
        label: labelContent,
      };
    });
  }, [menu, collapsed]);

  const onClick: MenuProps["onClick"] = (info) => {
    const key = String(info.key);
    if (key.startsWith("/")) {
      router.push(key);
      if (!screens.md && onMobileClose) {
        onMobileClose();
      }
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemBorderRadius: 8,
            itemMarginInline: collapsed ? 4 : 12,
            itemHeight: 42,
            itemSelectedBg: SB_ORANGE_LIGHT,
            itemSelectedColor: SB_ORANGE_PRIMARY,
            itemHoverBg: "rgba(0, 0, 0, 0.02)",
            itemHoverColor: SB_ORANGE_PRIMARY,
            fontSize: 14,
            iconSize: 18,
            subMenuItemBg: "transparent",
            popupBg: "#ffffff", // มั่นใจว่าพื้นหลัง Popup เป็นสีขาว
          },
        },
      }}
    >
      <div
        className="sb-modern-sidebar-wrapper"
        style={{
          height: "100%",
          padding: "16px 0",
          overflowY: "auto",
          overflowX: "hidden",
          fontFamily: "'Sarabun', 'Prompt', sans-serif",
        }}
      >
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[pathname]}
          openKeys={!collapsed ? openKeys : undefined}
          onOpenChange={(keys) => !collapsed && setOpenKeys(keys)}
          onClick={onClick}
          items={items}
          style={{
            borderInlineEnd: "none",
            background: "transparent",
          }}
        />

        <style jsx global>{`
          .ant-menu-item,
          .ant-menu-submenu-title {
            transition: all 0.25s ease-in-out !important;
          }

          .ant-menu-item-selected {
            position: relative;
            font-weight: 500 !important;
            background: linear-gradient(
              90deg,
              ${SB_ORANGE_LIGHT} 0%,
              #ffffff 100%
            ) !important;
          }

          .ant-menu-item-selected::before {
            content: "";
            position: absolute;
            left: 0;
            top: 20%;
            height: 60%;
            width: 4px;
            background: ${SB_ORANGE_PRIMARY};
            border-radius: 0 4px 4px 0;
            opacity: ${collapsed ? 0 : 1};
            box-shadow: 2px 0 8px rgba(255, 127, 0, 0.3);
          }

          .ant-menu-item .anticon,
          .ant-menu-submenu-title .anticon {
            color: #8c8c8c;
            transition: color 0.3s;
          }

          .ant-menu-item-selected .anticon,
          .ant-menu-item:hover .anticon,
          .ant-menu-submenu-title:hover .anticon {
            color: ${SB_ORANGE_PRIMARY};
          }

          /* --- FIX: Display Text in Popup --- */
          /* เอา color ออก ปล่อยให้ Theme จัดการ */
          .ant-menu-submenu-popup .ant-menu-item-title-content,
          .ant-menu-submenu-popup .ant-menu-title-content {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            width: 100%;
            overflow: visible !important;
          }

          /* ปรับความกว้าง Popup ให้พอดีกับ Content */
          .ant-menu-submenu-popup .ant-menu {
            min-width: 220px;
          }

          /* ถ้ายังมองไม่เห็น ลอง Reset สีเป็น inherit ดูครับ (เผื่อ Parent set เป็น transparent) */
          .ant-menu-submenu-popup .sb-submenu-label-wrapper span {
            color: inherit;
          }

          /* ------------------------------------------- */

          .ant-menu-inline-collapsed .ant-menu-item-icon,
          .ant-menu-inline-collapsed .anticon {
            min-width: 18px;
            line-height: 1;
            vertical-align: middle;
            margin-right: 0 !important;
          }

          .ant-menu-submenu-expand-icon,
          .ant-menu-submenu-arrow {
            color: #bfbfbf !important;
          }

          .sb-modern-sidebar-wrapper::-webkit-scrollbar {
            width: 3px;
          }
          .sb-modern-sidebar-wrapper::-webkit-scrollbar-thumb {
            background: #e0e0e0;
            border-radius: 4px;
          }
          .sb-modern-sidebar-wrapper::-webkit-scrollbar-track {
            background: transparent;
          }

          @media (max-width: 768px) {
            .ant-menu-item-selected::before {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
