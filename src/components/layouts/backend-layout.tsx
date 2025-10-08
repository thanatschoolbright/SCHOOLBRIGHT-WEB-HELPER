"use client";

/**
 * 📱 DashboardLayout: โครงสร้างหลักของ layout ในระบบ backend
 * ใช้ Ant Design สำหรับ UI minimal โทนขาวคล้าย Apple Web, รองรับ Dark Mode
 * มี Skeleton Loading ในส่วน Content และ Memoize components เพื่อประสิทธิภาพ
 */

import "@ant-design/v5-patch-for-react-19";
import {Layout, Skeleton, theme} from "antd";
import React, {Suspense, useMemo, useState} from "react";

import BreadcrumbComponent from "@components/breadcrump/breadcrumb-component";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";
import MainHeader from "@components/layouts/backend/navbar";
import SidebarContent from "@components/layouts/backend/sidebar-component";

/**
 * 🎯 Props สำหรับ DashboardLayout
 */
type DashboardLayoutProps = {
    children: React.ReactNode;
};

/**
 * 🏗️ Memoize components เพื่อป้องกัน re-render ถ้า props ไม่เปลี่ยน
 */
const MemoSidebarContent = React.memo(SidebarContent);
const MemoMainHeader = React.memo(MainHeader);
const MemoBreadcrumbs = React.memo(BreadcrumbComponent);

/**
 * 📦 DashboardLayout: Component หลักสำหรับ layout ของ backend
 * - ใช้ static import เพื่อความเรียบง่าย
 * - Skeleton fallback เฉพาะในส่วน children
 * - รองรับ Dark Mode ด้วย theme token
 */
export default function DashboardLayout({children}: DashboardLayoutProps): JSX.Element {
    //** 🌐 สถานะให้ Sider ยุบ/ขยาย
    const [collapsed, setCollapsed] = useState<boolean>(false);

    //** 🎨 ดึง token ธีมจาก Ant Design Theme สำหรับ Dark Mode
    const {token} = theme.useToken();
    const {Header, Sider, Content} = Layout;

    /**
     * 🦴 Skeleton ใน fallback ของ Suspense สำหรับ children
     * แสดง loading ขณะโหลดเนื้อหา
     */
    const contentSkeleton = useMemo(
        () => (
            <div style={{padding: 12}}>
                <Skeleton active title={{width: "40%"}} paragraph={{rows: 2}}/>
                <div style={{marginTop: 12}}>
                    <Skeleton active title={false} paragraph={{rows: 6}}/>
                </div>
            </div>
        ),
        []
    );

    /**
     * 🌙 DarkModeToggle จะแสดงเฉพาะเมื่อ Sider ไม่ถูกยุบ
     * เพื่อประหยัดพื้นที่
     */
    const darkToggleSection = useMemo(() => {
        if (!collapsed) {
            return (
                <div style={{padding: 16}}>
                    <DarkModeToggle/>
                </div>
            );
        }
        return null;
    }, [collapsed]);

    return (
        <Layout
            style={{
                minHeight: "100vh",
                background: token.colorBgLayout, // รองรับ Dark Mode
            }}
        >
            {/* 🔸 Sidebar ด้านซ้าย */}
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={260}
                breakpoint="lg"
                style={{
                    background: token.colorBgContainer, // รองรับ Dark Mode
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                    {/* 📋 เนื้อหา Sidebar */}
                    <div style={{flex: 1, overflowY: "auto", padding: 16}}>
                        <MemoSidebarContent/>
                    </div>
                    {/* 🌙 Toggle Dark Mode */}
                    {darkToggleSection}
                </div>
            </Sider>

            {/* 🔹 Layout หลัก */}
            <Layout>
                {/* 🧭 Header ด้านบน */}
                <Header
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                        paddingInline: 0,
                    }}
                >
                    <MemoMainHeader/>
                </Header>

                {/* 📄 Content หลัก */}
                <Content
                    style={{
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        gap: 16,
                        background: token.colorBgLayout, // รองรับ Dark Mode
                    }}
                >
                    {/* 🍞 Breadcrumbs */}
                    <div>
                        <MemoBreadcrumbs/>
                    </div>

                    {/* 📦 เนื้อหาหลักกับ Skeleton Loading */}
                    <div style={{flex: 1, minHeight: 0, overflow: "auto"}}>
                        <Suspense fallback={contentSkeleton}>{children}</Suspense>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
