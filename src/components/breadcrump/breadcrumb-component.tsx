"use client";

import { Breadcrumb, Skeleton } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface MenuItem {
  href?: string;
  label: string;
  children?: MenuItem[];
}

interface BreadcrumbComponentProps {
  loading?: boolean;
  showHome?: boolean;
}

/**
 * Component Breadcrumb ที่สร้างจาก Sidebar Menu
 * @param props - Properties ของ Breadcrumb
 */
export default function BreadcrumbComponent({
  loading = false,
  showHome = true,
}: BreadcrumbComponentProps) {
  const pathname = usePathname();
  const menu = useSidebarMenu();
  const { t } = useTranslation();

  //** ค้นหา breadcrumb items จาก path ปัจจุบัน */
  const breadcrumbItems = useMemo(() => {
    //** ฟังก์ชันค้นหาเส้นทาง breadcrumb จาก menu items */
    const findPath = (
      items: MenuItem[],
      targetPath: string,
    ): BreadcrumbItem[] | null => {
      for (const item of items) {
        if (item.href === targetPath) {
          return [{ title: item.label, href: item.href }];
        }
        if (item.children) {
          const path = findPath(item.children, targetPath);
          if (path) {
            return [{ title: item.label, href: item.href }, ...path];
          }
        }
      }
      return null;
    };

    let items: BreadcrumbItem[] = findPath(menu, pathname) || [];

    //** ถ้าไม่พบในเมนู (เช่น หน้า detail) ให้ใช้ fallback logic แบบเดิม */
    if (items.length === 0) {
      const segments = pathname.split("/").filter(Boolean);
      let accumulatedPath = "";

      const findLabel = (
        path: string,
        menuItems: MenuItem[],
      ): string | null => {
        for (const item of menuItems) {
          if (item.href && path === item.href) return item.label;
          if (item.children) {
            const label = findLabel(path, item.children);
            if (label) return label;
          }
        }
        return null;
      };

      for (const segment of segments) {
        accumulatedPath += `/${segment}`;
        const label = findLabel(accumulatedPath, menu);

        // ถ้าไม่เจอ label ในเมนู ให้ใช้ชื่อ segment แทน (Capitalized)
        items.push({
          title:
            label ||
            segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          href: accumulatedPath,
        });
      }
    }

    //** เพิ่มหน้าแรกถ้าไม่ใช่หน้าแรก */
    if (
      showHome &&
      pathname !== "/" &&
      !items.some((item) => item.href === "/")
    ) {
      items = [{ title: t("navbar.home"), href: "/" }, ...items];
    }

    return items;
  }, [pathname, menu, showHome, t]);

  //** แสดง Skeleton ขณะโหลด */
  if (loading) {
    return (
      <div style={{ padding: "8px 0" }}>
        <Skeleton.Input
          active
          size="small"
          style={{ width: 200, height: 24 }}
        />
      </div>
    );
  }

  //** ไม่แสดงอะไรหากไม่มี breadcrumb items */
  if (breadcrumbItems.length === 0) {
    return null;
  }

  //** สร้าง breadcrumb items สำหรับ Ant Design */
  const antBreadcrumbItems = breadcrumbItems.map((item, index) => {
    const isLast = index === breadcrumbItems.length - 1;

    // ถ้าไม่มี href หรือเป็นตัวสุดท้าย ไม่ต้องทำ link
    const shouldLink = !isLast && item.href;

    return {
      title: shouldLink ? (
        <Link
          href={item.href as string}
          style={{
            color: "inherit",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          {item.title}
        </Link>
      ) : (
        <span style={isLast ? { fontWeight: 600 } : undefined}>
          {item.title}
        </span>
      ),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: "8px 0" }}
    >
      <Breadcrumb items={antBreadcrumbItems} separator="/" />
    </motion.div>
  );
}
