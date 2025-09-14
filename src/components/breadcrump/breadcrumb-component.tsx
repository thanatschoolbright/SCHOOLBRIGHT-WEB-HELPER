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
                Home
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
