"use client";

import { Breadcrumb } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { RightOutlined } from "@ant-design/icons";

/* 🧭 Breadcrumb สร้างจาก Sidebar Menu */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const menu = useSidebarMenu();

  // หา parent และ child ที่ตรงกับ path ปัจจุบัน โดยรองรับ nested paths
  const findBreadcrumb = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbItems: { title: string; href: string }[] = [];
    let accumulatedPath = "";

    const findLabel = (path: string, items: any[]): string | null => {
      for (const item of items) {
        if (item.href && path === item.href) {
          return item.label;
        }
        if (item.children) {
          const label = findLabel(path, item.children);
          if (label) return label;
        }
      }
      return null;
    };

    for (const segment of segments) {
      accumulatedPath += "/" + segment;
      let label = findLabel(accumulatedPath, menu);
      if (!label) {
        // If no label found, use the segment itself (capitalized)
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      breadcrumbItems.push({ title: label, href: accumulatedPath });
    }

    return breadcrumbItems;
  };

  const breadcrumbItems = findBreadcrumb();

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Breadcrumb
        separator={
          <RightOutlined className="text-gray-500 dark:text-gray-400" />
        }
        items={[
          {
            title: (
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-200 transition-colors duration-300"
              >
                หน้าหลัก
              </Link>
            ),
          },
          ...breadcrumbItems.map((item) => ({
            title: (
              <Link
                href={item.href || "#"}
                className="text-gray-700 dark:text-gray-200 transition-colors duration-300"
              >
                {item.title}
              </Link>
            ),
          })),
        ]}
      />
    </motion.div>
  );
}
