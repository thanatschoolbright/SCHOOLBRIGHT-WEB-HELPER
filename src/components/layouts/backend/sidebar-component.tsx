import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Tag, Tooltip, ConfigProvider, Grid, theme } from "antd";
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
        className={`truncate block font-semibold tracking-wide w-full ${
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
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.5px",
        lineHeight: "16px",
        borderRadius: 10,
        padding: "2px 8px",
        background: isNew
          ? `linear-gradient(135deg, ${SB_ORANGE_GRADIENT_START} 0%, ${SB_ORANGE_GRADIENT_END} 100%)`
          : "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
        color: "white",
        boxShadow: isNew
          ? "0 3px 8px rgba(255, 127, 0, 0.35)"
          : "0 3px 8px rgba(24, 144, 255, 0.35)",
        transform: "scale(0.95)",
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
  const { token } = theme.useToken();
  const isDark = token.colorBgBase === "#0B0F19";

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
      const labelContent = (
        <div
          className="sb-menu-label-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 8,
          }}
        >
          {!collapsed ? (
            <MenuTooltip label={m.label}>
              <span
                style={{
                  fontWeight: 600,
                  letterSpacing: "0.3px",
                  fontSize: 15,
                }}
              >
                {m.label}
              </span>
            </MenuTooltip>
          ) : (
            <span
              style={{ fontWeight: 600, letterSpacing: "0.3px", fontSize: 15 }}
            >
              {m.label}
            </span>
          )}

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
                  : "rgba(255, 127, 0, 0.12)",
                marginLeft: 8,
                padding: "2px 8px",
              }}
            >
              {m.tag}
            </Tag>
          )}
        </div>
      );

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
                className="sb-submenu-label-wrapper"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: 8,
                }}
              >
                <MenuTooltip label={c.label}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {c.label}
                  </span>
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

      return {
        key: m.href || m.label,
        icon: m.icon,
        label: labelContent,
      };
    });
  }, [menu, collapsed, isDark]);

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
            itemBorderRadius: 12,
            itemMarginInline: collapsed ? 6 : 16,
            itemHeight: 48,
            itemPaddingInline: collapsed ? 16 : 20,
            itemSelectedBg: isDark
              ? `rgba(255, 127, 0, 0.12)`
              : "rgba(255, 127, 0, 0.08)",
            itemSelectedColor: SB_ORANGE_PRIMARY,
            itemHoverBg: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
            itemHoverColor: SB_ORANGE_PRIMARY,
            fontSize: 15,
            iconSize: 22,
            iconMarginInlineEnd: 14,
            subMenuItemBg: "transparent",
            popupBg: isDark ? token.colorBgElevated : "#ffffff",
            itemColor: isDark ? token.colorText : "#262626",
            itemActiveBg: isDark
              ? "rgba(255, 127, 0, 0.12)"
              : "rgba(255, 127, 0, 0.08)",
          },
        },
      }}
    >
      <div
        className="sb-modern-sidebar-wrapper"
        style={{
          height: "100%",
          padding: "20px 0",
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
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            margin-bottom: 4px !important;
            backdrop-filter: blur(8px);
          }

          .ant-menu-item-selected {
            position: relative;
            font-weight: 600 !important;
            background: ${isDark
              ? `linear-gradient(90deg, rgba(255, 127, 0, 0.15) 0%, rgba(255, 127, 0, 0.08) 100%)`
              : `linear-gradient(90deg, rgba(255, 127, 0, 0.12) 0%, rgba(255, 127, 0, 0.06) 100%)`} !important;
            backdrop-filter: blur(12px);
            box-shadow: ${isDark
              ? "0 4px 12px rgba(255, 127, 0, 0.15)"
              : "0 4px 12px rgba(255, 127, 0, 0.1)"};
          }

          .ant-menu-item:hover,
          .ant-menu-submenu-title:hover {
            backdrop-filter: blur(10px);
          }

          .ant-menu-item-selected::before {
            content: "";
            position: absolute;
            left: 0;
            top: 15%;
            height: 70%;
            width: 5px;
            background: linear-gradient(
              180deg,
              ${SB_ORANGE_GRADIENT_START} 0%,
              ${SB_ORANGE_GRADIENT_END} 100%
            );
            border-radius: 0 6px 6px 0;
            opacity: ${collapsed ? 0 : 1};
            box-shadow: 3px 0 12px rgba(255, 127, 0, 0.4);
          }

          .ant-menu-item:hover,
          .ant-menu-submenu-title:hover {
            transform: translateX(4px);
          }

          .ant-menu-item .anticon,
          .ant-menu-submenu-title .anticon {
            font-size: 22px !important;
            color: ${isDark ? token.colorTextSecondary : "#8c8c8c"};
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .ant-menu-item-selected .anticon,
          .ant-menu-item:hover .anticon,
          .ant-menu-submenu-title:hover .anticon {
            color: ${SB_ORANGE_PRIMARY};
            transform: scale(1.1);
          }

          .ant-menu-submenu-popup .ant-menu-item-title-content,
          .ant-menu-submenu-popup .ant-menu-title-content {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            width: 100%;
            overflow: visible !important;
          }

          .ant-menu-submenu-popup .ant-menu {
            min-width: 240px;
            border-radius: 12px;
            box-shadow: ${isDark
              ? "0 8px 32px rgba(0, 0, 0, 0.6)"
              : "0 8px 32px rgba(0, 0, 0, 0.12)"};
            backdrop-filter: blur(10px);
            background: ${isDark
              ? `${token.colorBgElevated} !important`
              : "#ffffff !important"};
          }

          .ant-menu-submenu-popup .sb-submenu-label-wrapper span {
            color: inherit;
          }

          /* Fix collapsed menu popup visibility */
          .ant-menu-inline-collapsed > .ant-menu-item,
          .ant-menu-inline-collapsed
            > .ant-menu-submenu
            > .ant-menu-submenu-title {
            padding-inline: 16px !important;
          }

          .ant-menu-inline-collapsed .ant-menu-item-icon,
          .ant-menu-inline-collapsed .anticon {
            min-width: 22px;
            line-height: 1;
            vertical-align: middle;
            margin-right: 0 !important;
          }

          /* Ensure popup menu text is visible when collapsed */
          .ant-menu-inline-collapsed
            + .ant-menu-submenu-popup
            .ant-menu-item-title-content,
          .ant-menu-inline-collapsed
            + .ant-menu-submenu-popup
            .ant-menu-title-content,
          .ant-menu-inline-collapsed
            ~ .ant-menu-submenu-popup
            .ant-menu-item-title-content,
          .ant-menu-inline-collapsed
            ~ .ant-menu-submenu-popup
            .ant-menu-title-content {
            display: inline-block !important;
            opacity: 1 !important;
            visibility: visible !important;
            color: ${isDark ? token.colorText : "#262626"} !important;
          }

          /* Popup menu items styling */
          .ant-menu-submenu-popup .ant-menu-item,
          .ant-menu-submenu-popup .ant-menu-submenu-title {
            color: ${isDark ? token.colorText : "#262626"} !important;
          }

          .ant-menu-submenu-popup .ant-menu-item .ant-menu-title-content,
          .ant-menu-submenu-popup
            .ant-menu-submenu-title
            .ant-menu-title-content {
            color: ${isDark ? token.colorText : "#262626"} !important;
          }

          .ant-menu-submenu-expand-icon,
          .ant-menu-submenu-arrow {
            color: ${isDark ? token.colorTextTertiary : "#bfbfbf"} !important;
            font-size: 12px !important;
          }

          .sb-modern-sidebar-wrapper::-webkit-scrollbar {
            width: 4px;
          }
          .sb-modern-sidebar-wrapper::-webkit-scrollbar-thumb {
            background: ${isDark
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.15)"};
            border-radius: 6px;
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
