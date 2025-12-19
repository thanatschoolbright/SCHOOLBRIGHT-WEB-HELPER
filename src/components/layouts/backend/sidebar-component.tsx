import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Tag, Tooltip, ConfigProvider } from "antd";
import type { MenuProps } from "antd";

// --- School Bright Theme Colors ---
const SB_ORANGE_PRIMARY = "#FF7F00"; // ส้มหลัก
const SB_ORANGE_LIGHT = "#FFF2E8"; // ส้มพาสเทล (พื้นหลัง)
const SB_ORANGE_GRADIENT_START = "#FF9933";
const SB_ORANGE_GRADIENT_END = "#FF6600";
const TEXT_DARK = "#4A4A4A"; // เทาเข้ม

// --- Components ---

function MenuTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={label} placement="right" mouseEnterDelay={0.5}>
      <span className="truncate block font-medium tracking-wide">
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
        fontSize: 9, // ปรับให้อ่านง่ายขึ้นนิดนึง
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

// --- Main Component ---

type SidebarContentProps = {
  collapsed?: boolean;
};

export default function SidebarContent({
  collapsed = false,
}: SidebarContentProps) {
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // Auto-open parent submenu based on pathname (Only when Expanded)
  useEffect(() => {
    if (collapsed) return; // ไม่ต้อง Auto open ตอนหุบ
    const parent = menu.find(
      (m) => m.children && m.children.some((c) => c.href === pathname)
    );
    if (parent) {
      setOpenKeys((prev) => Array.from(new Set([...prev, parent.label])));
    }
  }, [menu, pathname, collapsed]);

  // Generate Menu Items
  const items: MenuProps["items"] = useMemo(() => {
    return menu.map((m) => {
      // 1. กรณีมี Submenu (ลูกเมนู)
      if (m.children && m.children.length) {
        return {
          key: m.label,
          icon: m.icon,
          // [Fix Bug] ตอนหุบ ส่งแค่ Text (String) ไป เพื่อให้ Antd จัดการ Tooltip เอง
          // ตอนกาง ส่ง JSX เพื่อความสวยงาม
          label: collapsed ? (
            m.label
          ) : (
            <span
              style={{
                fontWeight: 500,
                color: TEXT_DARK,
                letterSpacing: "0.3px",
              }}
            >
              {m.label}
            </span>
          ),
          children: m.children.map((c) => ({
            key: c.href,
            icon: c.icon,
            // ใน Popup (Submenu) แสดงผลเต็มรูปแบบเสมอ เพราะ Popup มีพื้นที่เยอะ
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <MenuTooltip label={c.label}>{c.label}</MenuTooltip>
                <>
                  {c.news && <StatusTag type="new" />}
                  {c.revamp && <StatusTag type="revamp" />}
                </>
              </div>
            ),
          })),
        };
      }

      // 2. กรณีเมนูชั้นเดียว (Single Item)
      return {
        key: m.href || m.label,
        icon: m.icon,
        // [Fix Bug] Logic เดียวกัน: หุบส่ง Text / กางส่ง Div Flexbox
        label: collapsed ? (
          m.label
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span
              style={{
                fontWeight: 400,
                color: TEXT_DARK,
                letterSpacing: "0.3px",
              }}
            >
              {m.label}
            </span>
            {m.tag && (
              <Tag
                color="orange"
                bordered={false}
                style={{
                  borderRadius: 6,
                  fontSize: 10,
                  color: SB_ORANGE_PRIMARY,
                  background: "rgba(255, 127, 0, 0.1)",
                }}
              >
                {m.tag}
              </Tag>
            )}
          </div>
        ),
      };
    });
  }, [menu, collapsed]);

  const onClick: MenuProps["onClick"] = (info) => {
    const key = String(info.key);
    if (key.startsWith("/")) router.push(key);
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            // Theme Config
            itemBorderRadius: 8,
            // [Fix Design] ตอนหุบให้ระยะขอบน้อยลง (4px) เพื่อให้ Icon ไม่ตกขอบ
            itemMarginInline: collapsed ? 4 : 12,
            itemHeight: 42,

            // Colors (School Bright Orange)
            itemSelectedBg: SB_ORANGE_LIGHT,
            itemSelectedColor: SB_ORANGE_PRIMARY,

            // Hover
            itemHoverBg: "rgba(0, 0, 0, 0.02)",
            itemHoverColor: SB_ORANGE_PRIMARY,

            // Typography
            fontSize: 14,
            iconSize: 18,

            // Submenu
            subMenuItemBg: "transparent",
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
          // [Fix Bug สำคัญ]
          // ถ้า collapsed ให้เป็น undefined เพื่อให้ Antd จัดการ Popup Hover เอง
          // ถ้า !collapsed ให้ใช้ state openKeys ที่เราคุมเอง
          openKeys={!collapsed ? openKeys : undefined}
          onOpenChange={(keys) => !collapsed && setOpenKeys(keys)}
          onClick={onClick}
          items={items}
          style={{
            borderInlineEnd: "none",
            background: "transparent",
          }}
        />

        {/* Global Styles for Animations & Orange Theme */}
        <style jsx global>{`
          /* Smooth transition */
          .ant-menu-item,
          .ant-menu-submenu-title {
            transition: all 0.25s ease-in-out !important;
          }

          /* Active Item Style */
          .ant-menu-item-selected {
            position: relative;
            font-weight: 500 !important;
            background: linear-gradient(
              90deg,
              ${SB_ORANGE_LIGHT} 0%,
              #ffffff 100%
            ) !important;
          }

          /* Orange Bar Indicator (ซ่อนเมื่อหุบ) */
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

          /* Icon Colors */
          .ant-menu-item .anticon,
          .ant-menu-submenu-title .anticon {
            color: #8c8c8c;
            transition: color 0.3s;
          }

          /* เปลี่ยนสีไอคอนเมื่อ Select หรือ Hover */
          .ant-menu-item-selected .anticon,
          .ant-menu-item:hover .anticon,
          .ant-menu-submenu-title:hover .anticon {
            color: ${SB_ORANGE_PRIMARY};
          }

          /* จัด Icon ให้อยู่กึ่งกลางเป๊ะๆ ตอนหุบ */
          .ant-menu-inline-collapsed .ant-menu-item-icon,
          .ant-menu-inline-collapsed .anticon {
            min-width: 18px;
            line-height: 1;
            vertical-align: middle;
            margin-right: 0 !important; /* บังคับลบ margin ขวา */
          }

          /* Submenu Arrow Color */
          .ant-menu-submenu-expand-icon,
          .ant-menu-submenu-arrow {
            color: #bfbfbf !important;
          }

          /* Custom Scrollbar */
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
        `}</style>
      </div>
    </ConfigProvider>
  );
}
