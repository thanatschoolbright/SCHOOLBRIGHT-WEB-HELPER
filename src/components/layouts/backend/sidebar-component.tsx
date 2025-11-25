import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Tag, Tooltip, theme } from "antd";

function MenuTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={label} placement="right">
      <span>{children}</span>
    </Tooltip>
  );
}

type SidebarContentProps = {
  collapsed?: boolean;
};

export default function SidebarContent({
  collapsed = false,
}: SidebarContentProps) {
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    const parent = menu.find(
      (m) => m.children && m.children.some((c) => c.href === pathname)
    );
    if (parent && !collapsed) {
      setOpenKeys([parent.label]);
    }
  }, [menu, pathname, collapsed]);

  const items = useMemo(() => {
    return menu.map((m) => {
      if (m.children && m.children.length) {
        return {
          key: m.label,
          icon: m.icon,
          label: m.label,
          title: m.label,
          children: m.children.map((c) => ({
            key: c.href,
            icon: c.icon,
            title: c.label,
            label: (
              <>
                <MenuTooltip label={c.label}>{c.label}</MenuTooltip>
                {!collapsed && c.news && (
                  <Tag color="red" style={{ marginLeft: 8, fontSize: 12 }}>
                    NEW
                  </Tag>
                )}
                {!collapsed && c.revamp && (
                  <Tag color="red" style={{ marginLeft: 8, fontSize: 12 }}>
                    REVAMP
                  </Tag>
                )}
              </>
            ),
          })),
        };
      }
      return {
        key: m.href || m.label,
        icon: m.icon,
        title: m.label,
        label: (
          <>
            {m.label}
            {m.tag && (
              <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>
                {m.tag}
              </Tag>
            )}
          </>
        ),
      };
    });
  }, [menu, collapsed]);

  const onOpenChange = (keys: string[]) => !collapsed && setOpenKeys(keys);
  const onClick: Parameters<typeof Menu>[0]["onClick"] = (info) => {
    const key = String(info.key);
    if (key.startsWith("/")) router.push(key);
  };

  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={[pathname]}
      openKeys={!collapsed ? openKeys : undefined}
      onOpenChange={onOpenChange}
      onClick={onClick}
      triggerSubMenuAction={collapsed ? "hover" : "click"}
      items={items as any}
      style={{
        borderInlineEnd: "none",
        padding: collapsed ? 8 : 12,
        borderRadius: 14,
      }}
      rootClassName="sb-modern-sidebar"
    />
  );
}
