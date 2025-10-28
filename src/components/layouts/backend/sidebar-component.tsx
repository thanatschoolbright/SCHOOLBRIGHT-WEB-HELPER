
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Tag, Tooltip } from "antd";

function MenuTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip title={label} placement="right">
      <span>{children}</span>
    </Tooltip>
  );
}

type SidebarContentProps = {
  collapsed?: boolean;
};

export default function SidebarContent({ collapsed = false }: SidebarContentProps) {
  const menu = useSidebarMenu();
  const pathname = usePathname();
  const router = useRouter();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const items = useMemo(() => {
    return menu.map((m) => {
      if (m.children && m.children.length) {
        return {
          key: m.label,
          icon: m.icon,
          label: m.label,
          children: m.children.map((c) => ({
            key: c.href,
            icon: c.icon,
            label: (
              <>
                <MenuTooltip label={c.label}>{c.label}</MenuTooltip>
                {!collapsed && c.news && (
                  <Tag color="red" style={{ marginLeft: 8, fontSize: 12 }}>NEW</Tag>
                )}
              </>
            ),
          })),
        };
      }
      return {
        key: m.href || m.label,
        icon: m.icon,
        label: (
          <>
            {m.label}
            {m.tag && (
              <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>{m.tag}</Tag>
            )}
          </>
        ),
      };
    });
  }, [menu]);

  const onOpenChange = (keys: string[]) => setOpenKeys(keys);
  const onClick: Parameters<typeof Menu>[0]["onClick"] = (info) => {
    const key = String(info.key);
    if (key.startsWith("/")) router.push(key);
  };

  return (
    <Menu
      mode="vertical"
      inlineCollapsed={collapsed}
      selectedKeys={[pathname]}
      openKeys={collapsed ? [] : openKeys}
      onOpenChange={onOpenChange}
      onClick={onClick}
      items={items as any}
    />
  );
}
