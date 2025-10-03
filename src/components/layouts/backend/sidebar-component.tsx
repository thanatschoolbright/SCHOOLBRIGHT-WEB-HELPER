"use client";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Tag, theme, Typography, Tooltip } from "antd";
import "./sidebar-component.css";

export default function SidebarContent() {
  const menu: {
    label: string;
    icon: JSX.Element;
    children?: { label: string; href: string; news?: boolean }[];
    href?: string;
    tag?: string;
  }[] = useSidebarMenu();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  useEffect(() => {
    const parents = menu
      .filter((m) => m.children?.some((c) => c.href === pathname))
      .map((m) => m.label);
    setOpenKeys(parents);
  }, [menu, pathname]);

  const items = useMemo(() => {
    return menu.map((m) => {
      if (m.children && m.children.length) {
        return {
          key: m.label,
          icon: m.icon,
          label: m.label,
          children: m.children.map((c) => ({
            key: c.href,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Tooltip title={c.label} placement="right">
                  <Typography.Text
                    style={{
                      fontSize: 14,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {c.label}
                  </Typography.Text>
                </Tooltip>
                {c.news ? (
                  <Tag color="red" style={{ marginInlineStart: 8 }}>
                    NEW
                  </Tag>
                ) : null}
              </div>
            ),
          })),
        } as const;
      }
      // single clickable item
      return {
        key: m.href || m.label,
        icon: m.icon,
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Typography.Text
              style={{ whiteSpace: "normal", wordBreak: "break-word" }}
            >
              {m.label}
            </Typography.Text>
            {m.tag ? (
              <Tag color="purple" style={{ marginInlineStart: 8 }}>
                {m.tag}
              </Tag>
            ) : null}
          </div>
        ),
      } as const;
    });
  }, [menu]);

  const onOpenChange = (keys: string[]) => setOpenKeys(keys);

  const onClick: Parameters<typeof Menu>[0]["onClick"] = (info) => {
    const key = String(info.key);
    if (key.startsWith("/")) router.push(key);
  };

  return (
    <>
      <div
        className="flex flex-col h-full justify-between text-sm overflow-visible sb-sidebar-wrap"
        style={{ ["--sb-primary" as any]: token.colorPrimary }}
      >
        <div>
          <div
            className="mb-4 text-base font-semibold"
            style={{ color: token.colorTextSecondary }}
          >
            เมนู
          </div>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={onClick}
            items={items as any}
            style={{ borderInlineEnd: "none" }}
            className="sb-sidebar-menu"
          />
        </div>
      </div>
    </>
  );
}
