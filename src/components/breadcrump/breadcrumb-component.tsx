"use client";

import {Breadcrumb, Skeleton} from "antd";
import {motion} from "framer-motion";
import Link from "next/link";
import {usePathname} from "next/navigation";
import React, {useMemo} from "react";

import {useSidebarMenu} from "@/constants/sidebar-menu-constant";

interface BreadcrumbItem {
    title: string;
    href: string;
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
                                            }) {
    const pathname = usePathname();
    const menu = useSidebarMenu();

    //** ค้นหา breadcrumb items จาก path ปัจจุบัน */
    const breadcrumbItems = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);
        const items: BreadcrumbItem[] = [];
        let accumulatedPath = "";

        //** ฟังก์ชันค้นหา label จาก menu items */
        const findLabel = (path: string, menuItems: MenuItem[]): string | null => {
            for (const item of menuItems) {
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

        //** เพิ่มหน้าแรกหากต้องการ */
        if (showHome && pathname !== "/") {
            items.push({title: "หน้าแรก", href: "/"});
        }

        //** สร้าง breadcrumb จาก segments */
        for (const segment of segments) {
            accumulatedPath += `/${segment}`;
            const label = findLabel(accumulatedPath, menu);

            if (label) {
                items.push({
                    title: label,
                    href: accumulatedPath,
                });
            }
        }

        return items;
    }, [pathname, menu, showHome]);

    //** แสดง Skeleton ขณะโหลด */
    if (loading) {
        return (
            <div style={{padding: "8px 0"}}>
                <Skeleton.Input active size="small" style={{width: 200, height: 24}}/>
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

        return {
            title: isLast ? (
                <span style={{fontWeight: 600}}>{item.title}</span>
            ) : (
                <Link
                    href={item.href}
                    style={{
                        color: "inherit",
                        textDecoration: "none",
                        transition: "color 0.2s",
                    }}
                >
                    {item.title}
                </Link>
            ),
        };
    });

    return (
        <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.3}}
            style={{padding: "8px 0"}}
        >
            <Breadcrumb
                items={antBreadcrumbItems}
                separator="/"
            />
        </motion.div>
    );
};
