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
  const { Sider, Content } = Layout;
  const { useBreakpoint } = Grid;

  // 📱 States
  const screens = useBreakpoint();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 🛠️ Detect Mobile View
  useEffect(() => {
    setIsMobile(!screens.lg);
    if (!screens.lg) {
      setCollapsed(false);
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

  // 🌙 Dark Mode Toggle Section
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
      className="min-h-screen transition-colors duration-300 relative" // เพิ่ม relative
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
          classNames={{ wrapper: "z-[9999]" }}
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
          className="shadow-sm border-r z-40 transition-all duration-300 ease-in-out sticky top-0 h-screen"
          style={{
            background: token.colorBgContainer,
            borderRightColor: token.colorBorderSecondary,
          }}
        >
          <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center">
              {/* Logo Here */}
            </div>

            {/* Menu Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <MemoSidebarContent collapsed={collapsed} />
            </div>

            {/* Footer / Toggle Area */}
            {renderDarkToggle()}

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

      {/* 🔹 Main Layout Content Wrapper */}
      <Layout className="transition-all duration-300 bg-transparent">
        {/* 🧭 Header */}
        <div className="sticky top-0 z-30 w-full">
          <MemoMainHeader />
        </div>

        {/* 📄 Content Area */}
        <Content
          className="p-4 sm:p-6 flex flex-col gap-4 overflow-x-hidden min-h-0"
          style={{
            background: token.colorBgLayout,
            marginTop: 0,
          }}
        >
          <div className="w-full">
            <MemoBreadcrumbs />
          </div>

          <div className="flex-1 w-full h-full relative fade-in">
            <Suspense fallback={contentSkeleton}>{children}</Suspense>
          </div>
        </Content>
      </Layout>

      {/* 🔘 Mobile Floating Hamburger Button (Bottom-Right) */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={mobileOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              width: 56,
              height: 56,
              fontSize: 24,
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)", // เงาชัดๆ
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: token.colorPrimary, // สีหลักของ Theme (สีส้ม)
              border: "none",
            }}
            className="hover:scale-110 active:scale-95 transition-transform duration-200"
          />
        </div>
      )}
    </Layout>
  );
}
