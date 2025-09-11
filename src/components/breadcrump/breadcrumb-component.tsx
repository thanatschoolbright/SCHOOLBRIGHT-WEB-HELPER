"use client";

import { Breadcrumb } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";

/* 🧭 Breadcrumb สร้างจาก Sidebar Menu */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const menu = useSidebarMenu();

  // หา parent และ child ที่ตรงกับ path ปัจจุบัน
  const findBreadcrumb = () => {
    for (const parent of menu) {
      // 1) ถ้า parent มี children → หา child ที่ href ตรง
      if (parent.children) {
        const child = parent.children.find((c) => c.href === pathname);
        if (child) {
          return [
            { title: parent.label, href: parent.href || "#" },
            { title: child.label, href: child.href },
          ];
        }
      }

      // 2) ถ้า parent เองมี href และตรงกับ path
      if (parent.href === pathname) {
        return [{ title: parent.label, href: parent.href }];
      }
    }
    return [];
  };

  const breadcrumbItems = findBreadcrumb();

  return (
    <Breadcrumb
      items={[
        { title: <Link href="/">Home</Link> },
        ...breadcrumbItems.map((item, idx) => ({
          title: item.href ? <Link href={item.href}>{item.title}</Link> : item.title,
        })),
      ]}
    />
  );
}
