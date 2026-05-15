"use client";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";
import { Skeleton, theme, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// ✨ โครงสร้างของแต่ละ node ใน breadcrumb chain
interface BreadcrumbNode {
  label: string;
  href?: string;
}

// ✨ ค้นหา ancestor chain ของ node ที่ตรงกับ pathname โดยเดิน tree แบบ DFS
function findAncestors(
  list: BreadcrumbNode[],
  target: string,
  ancestors: BreadcrumbNode[] = [],
): BreadcrumbNode[] | null {
  for (const item of list) {
    const current = [...ancestors, { label: item.label, href: (item as any).href }];
    if ((item as any).href === target) return current;
    if ((item as any).children) {
      const found = findAncestors((item as any).children, target, current);
      if (found) return found;
    }
  }
  return null;
}

// ✨ Breadcrumb Component - แสดง path navigation จาก sidebar menu tree
export default function BreadcrumbComponent({ loading = false }) {
  const pathname = usePathname();
  const menu = useSidebarMenu();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const chain = useMemo(() => {
    if (pathname === "/") return null;

    const found = findAncestors(menu as any, pathname);
    if (found) return found;

    // fallback: แตก path segment เมื่อหาใน menu ไม่เจอ
    return pathname
      .split("/")
      .filter(Boolean)
      .map((seg, i, arr) => ({
        label: seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        href: i < arr.length - 1 ? `/${arr.slice(0, i + 1).join("/")}` : undefined,
      }));
  }, [pathname, menu]);

  if (loading)
    return <Skeleton.Input active size="small" style={{ width: 240 }} />;
  if (!chain) return null;

  return (
    <nav
      aria-label="breadcrumb"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: token.borderRadiusLG,
        background: token.colorFillQuaternary,
        border: `1px solid ${token.colorBorderSecondary}`,
        backdropFilter: "blur(8px)",
        flexWrap: "wrap",
        maxWidth: "100%",
      }}
    >
      {/* หน้าแรก */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color: token.colorTextSecondary,
          fontSize: 13,
          fontWeight: 400,
          textDecoration: "none",
          transition: "color 0.2s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = token.colorPrimary)}
        onMouseLeave={(e) => (e.currentTarget.style.color = token.colorTextSecondary)}
      >
        <HomeOutlined style={{ fontSize: 12 }} />
        <span>{t("navbar.home") || "หน้าแรก"}</span>
      </Link>

      {chain.map(({ label, href }, i) => {
        const isLast = i === chain.length - 1;
        return (
          <span
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RightOutlined
              style={{
                fontSize: 9,
                color: token.colorTextQuaternary,
                flexShrink: 0,
              }}
            />
            {isLast || !href ? (
              <Typography.Text
                strong
                style={{
                  fontSize: 13,
                  color: token.colorText,
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                {label}
              </Typography.Text>
            ) : (
              <Link
                href={href}
                style={{
                  color: token.colorTextSecondary,
                  fontSize: 13,
                  fontWeight: 400,
                  textDecoration: "none",
                  transition: "color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = token.colorPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = token.colorTextSecondary)}
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
