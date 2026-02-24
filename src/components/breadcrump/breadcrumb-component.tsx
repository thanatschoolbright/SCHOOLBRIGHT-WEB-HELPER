"use client";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { Breadcrumb, Skeleton } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Breadcrumb Component - Performance optimized using Ant Design
 */
export default function BreadcrumbComponent({ loading = false }) {
  const pathname = usePathname();
  const menu = useSidebarMenu();
  const { t } = useTranslation();

  const items = useMemo(() => {
    if (pathname === "/") return [];

    // Flatten menu to map href -> label for fast lookup
    const menuMap: Record<string, string> = {};
    const flatten = (list: any[]) =>
      list.forEach((item) => {
        if (item.href) menuMap[item.href] = item.label;
        if (item.children) flatten(item.children);
      });
    flatten(menu);

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => {
      const path = `/${segments.slice(0, i + 1).join("/")}`;
      const isLast = i === segments.length - 1;
      const label =
        menuMap[path] ||
        seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        title: isLast ? <b>{label}</b> : <Link href={path}>{label}</Link>,
      };
    });

    return [
      { title: <Link href="/">{t("navbar.home") || "Home"}</Link> },
      ...breadcrumbs,
    ];
  }, [pathname, menu, t]);

  if (loading)
    return <Skeleton.Input active size="small" style={{ margin: "8px 0" }} />;
  return items.length ? (
    <Breadcrumb items={items} style={{ padding: "8px 0" }} />
  ) : null;
}
