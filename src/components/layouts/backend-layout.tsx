"use client";

import "@ant-design/v5-patch-for-react-19";
import {Layout, Skeleton, theme} from "antd";
import React, {Suspense, useMemo, useState} from "react";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";
import SidebarContent from "@components/layouts/backend/sidebar-component";
import MainHeader from "@components/layouts/backend/navbar";
import BreadcrumbComponent from "../breadcrump/breadcrumb-component";


// Memoize components เพื่อป้องกัน re-render ถ้า props ไม่เปลี่ยน
const MemoSidebarContent = React.memo(SidebarContent);
const MemoMainHeader = React.memo(MainHeader);
const MemoBreadcrumbs = React.memo(BreadcrumbComponent);

/**
 * DashboardLayout: โครงสร้างหลักของ layout ในระบบ backend
 * ใช้ static import แทน dynamic import เพื่อให้โค้ดเรียบง่าย
 * ใช้ Skeleton fallback เฉพาะในส่วน children
 */
export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    // สถานะให้ Sider ยุบ/ขยาย
    const [collapsed, setCollapsed] = useState(false);

    // ดึง token ธีมจาก Ant Design Theme
    const {token} = theme.useToken();
    const {Header, Sider, Content} = Layout;

    // skeleton ใน fallback ของ Suspense สำหรับ children
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

    // DarkModeToggle จะแสดงเฉพาะเมื่อ Sider ไม่ถูกยุบ
    const darkToggleSection = useMemo(() => {
        if (!collapsed) {
            return <div style={{padding: 16}}><DarkModeToggle/></div>;
        }
        return null;
    }, [collapsed]);

    return (
        <Layout style={{minHeight: "100vh", background: token.colorBgLayout}}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={260}
                breakpoint="lg"
                style={{
                    background: token.colorBgContainer,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                    <div style={{flex: 1, overflowY: "auto", padding: 16}}>
                        <MemoSidebarContent/>
                    </div>
                    {darkToggleSection}
                </div>
            </Sider>

            <Layout>
                <Header
                    style={{
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                        paddingInline: 0,
                    }}
                >
                    <MemoMainHeader/>
                </Header>

                <Content
                    style={{
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        gap: 16,
                    }}
                >
                    <div>
                        <MemoBreadcrumbs/>
                    </div>

                    <div style={{flex: 1, minHeight: 0, overflow: "auto"}}>
                        <Suspense fallback={contentSkeleton}>{children}</Suspense>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
