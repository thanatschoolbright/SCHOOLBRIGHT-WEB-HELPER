"use client";

import {useSidebarMenu} from "@/constants/sidebar-menu-constant";
import {useEffect, useMemo, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {Menu, Tag, theme, Tooltip, Typography} from "antd";
import "./sidebar-component.css";

//** [เพิ่ม] Key สำหรับบันทึกสถานะเมนูใน Local Storage */
const SIDEBAR_OPEN_KEYS_STORAGE_KEY = "sidebar_open_keys";

export default function SidebarContent() {
    const menu: {
        label: string;
        icon: JSX.Element;
        children?: { label: string; href: string; news?: boolean }[];
        href?: string;
        tag?: string;
    }[] = useSidebarMenu();

    //** [แก้ไข] อ่านค่าเริ่มต้นของเมนูที่เปิดอยู่จาก Local Storage */
    const [openKeys, setOpenKeys] = useState<string[]>(() => {
        // โค้ดส่วนนี้จะทำงานแค่ครั้งแรกที่ Component ถูก Render
        if (typeof window !== "undefined") {
            try {
                const savedOpenKeys = window.localStorage.getItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY);
                // ถ้ามีค่าที่เคยบันทึกไว้ ให้ใช้ค่านั้น
                return savedOpenKeys ? JSON.parse(savedOpenKeys) : [];
            } catch (error) {
                console.error("Failed to parse sidebar open keys from localStorage", error);
                // หาก parse ไม่ได้ ให้กลับไปใช้ค่าเริ่มต้น (ว่าง)
                return [];
            }
        }
        return [];
    });

    const pathname = usePathname();
    const router = useRouter();
    const {token} = theme.useToken();

    useEffect(() => {
        const activeParents = menu
            .filter((m) => m.children?.some((c) => c.href === pathname))
            .map((m) => m.label);

        //** [ปรับปรุง] ทำให้เมนูของหน้าปัจจุบันเปิดเสมอ โดยไม่ปิดเมนูอื่นที่ผู้ใช้เปิดไว้ */
        if (activeParents.length > 0) {
            setOpenKeys((currentKeys) => {
                // ใช้ Set เพื่อรวม keys เดิมกับ keys ของหน้าปัจจุบัน และป้องกันค่าซ้ำ
                const newKeys = new Set([...currentKeys, ...activeParents]);
                return Array.from(newKeys);
            });
        }
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
                                    <Tag color="red" style={{marginInlineStart: 8}}>
                                        NEW
                                    </Tag>
                                ) : null}
                            </div>
                        ),
                    })),
                } as const;
            }
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
                            style={{whiteSpace: "normal", wordBreak: "break-word"}}
                        >
                            {m.label}
                        </Typography.Text>
                        {m.tag ? (
                            <Tag color="purple" style={{marginInlineStart: 8}}>
                                {m.tag}
                            </Tag>
                        ) : null}
                    </div>
                ),
            } as const;
        });
    }, [menu]);

    //** [แก้ไข] เมื่อผู้ใช้เปิด/ปิดเมนู ให้บันทึกสถานะล่าสุดลง Local Storage */
    const onOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY, JSON.stringify(keys));
        }
    };

    const onClick: Parameters<typeof Menu>[0]["onClick"] = (info) => {
        const key = String(info.key);
        if (key.startsWith("/")) router.push(key);
    };

    return (
        <>
            <div
                className="flex flex-col h-full justify-between text-sm overflow-visible sb-sidebar-wrap"
                style={{["--sb-primary" as any]: token.colorPrimary}}
            >
                <div>
                    <div
                        className="mb-4 text-base font-semibold"
                        style={{color: token.colorTextSecondary}}
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
                        style={{borderInlineEnd: "none"}}
                        className="sb-sidebar-menu"
                    />
                </div>
            </div>
        </>
    );
}
