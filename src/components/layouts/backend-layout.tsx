"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { Suspense, useMemo, useState, useEffect } from "react";
import { Layout, Skeleton, theme, Drawer, Grid, Button } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";

// Components
import BreadcrumbComponent from "@components/breadcrump/breadcrumb-component";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";
import MainHeader from "@components/layouts/backend/navbar";
import SidebarContent from "@components/layouts/backend/sidebar-component";

// Types
type DashboardLayoutProps = {
  children: React.ReactNode;
};

// Memoize Components
const MemoSidebarContent = React.memo(SidebarContent);
const MemoMainHeader = React.memo(MainHeader);
const MemoBreadcrumbs = React.memo(BreadcrumbComponent);

export default function DashboardLayout({
  children,
}: DashboardLayoutProps): JSX.Element {
  // 🎨 Theme Token
  const { token } = theme.useToken();
  const { Header, Sider, Content } = Layout;
  const { useBreakpoint } = Grid;

  // 📱 States
  const screens = useBreakpoint();
  const [collapsed, setCollapsed] = useState<boolean>(false); // Desktop State
  const [mobileOpen, setMobileOpen] = useState<boolean>(false); // Mobile Drawer State
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 🛠️ Detect Mobile View (Hydration Safe)
  useEffect(() => {
    setIsMobile(!screens.lg); // ถ้าน้อยกว่า lg (Desktop) ถือเป็น Mobile/Tablet
    if (!screens.lg) {
      setCollapsed(false); // Reset collapsed state on mobile
    }
  }, [screens.lg]);

  // 🦴 Skeleton Fallback
  const contentSkeleton = useMemo(
    () => (
      <div className="p-3">
        <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
        <div className="mt-4">
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </div>
    ),
    []
  );

  // 🌙 Dark Mode Toggle Section (Desktop Only)
  const renderDarkToggle = () => {
    if (collapsed) return null;
    return (
      <div className="p-4 fade-in">
        <DarkModeToggle />
      </div>
    );
  };

  return (
    <Layout
      className="min-h-screen transition-colors duration-300"
      style={{ background: token.colorBgLayout }}
    >
      {/* 📱 Mobile Sidebar (Drawer) */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          width={260}
          styles={{
            body: { padding: 0, backgroundColor: token.colorBgContainer },
            header: { display: "none" },
          }}
          classNames={{ wrapper: "z-[9999]" }} // Ensure it's on top
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mt-6">
              <MemoSidebarContent
                collapsed={false}
                onMobileClose={() => setMobileOpen(false)}
              />
            </div>
            <div className="p-4">
              <DarkModeToggle />
            </div>
          </div>
        </Drawer>
      )}

      {/* 🖥️ Desktop Sidebar (Sider) */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          collapsedWidth={80}
          className="shadow-sm border-r z-40 transition-all duration-300 ease-in-out"
          style={{
            background: token.colorBgContainer,
            borderRightColor: token.colorBorderSecondary,
            // ❌ ลบ overflow: hidden ออก เพื่อให้ Tooltip ทำงานได้ถูกต้อง
            // position: "sticky", top: 0, height: "100vh" // Optional: ถ้าอยากให้ Sidebar ลอยค้าง
          }}
        >
          <div className="flex flex-col h-full">
            {/* Logo Area or Spacer */}
            <div className="h-16 flex items-center justify-center">
              {/* ใส่ Logo ตรงนี้ได้ */}
            </div>

            {/* Menu Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <MemoSidebarContent collapsed={collapsed} />
            </div>

            {/* Footer / Toggle Area */}
            {renderDarkToggle()}

            {/* Collapse Trigger Button (Custom) */}
            <div
              className="h-12 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors border-t"
              style={{ borderColor: token.colorBorderSecondary }}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </div>
        </Sider>
      )}

      {/* 🔹 Main Layout */}
      <Layout className="transition-all duration-300">
        {/* 🧭 Header */}
        <Header
          className="sticky top-0 z-30 w-full px-0 shadow-sm"
          style={{ background: token.colorBgContainer }}
        >
          <div className="flex items-center h-full px-4 gap-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                type="text"
                icon={
                  mobileOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
                }
                onClick={() => setMobileOpen(!mobileOpen)}
                size="large"
              />
            )}

            <div className="flex-1">
              <MemoMainHeader />
            </div>
          </div>
        </Header>

        {/* 📄 Content Area */}
        <Content
          className="p-4 sm:p-6 flex flex-col gap-4 overflow-x-hidden min-h-0"
          style={{ background: token.colorBgLayout }}
        >
          <div className="w-full">
            <MemoBreadcrumbs />
          </div>

          <div className="flex-1 w-full h-full relative fade-in">
            <Suspense fallback={contentSkeleton}>{children}</Suspense>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
