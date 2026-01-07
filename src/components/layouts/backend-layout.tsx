"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { Suspense, useMemo, useState, useEffect } from "react";
import { Layout, Skeleton, theme, Drawer, Grid, Button, Flex } from "antd";
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
  const { Sider, Content, Header } = Layout; // ใช้ Header จาก Layout
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
      <Flex vertical gap="small" className="p-3">
        <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
        <div className="mt-4">
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </Flex>
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
      className="min-h-screen transition-colors duration-300 relative overflow-hidden"
      style={{ background: token.colorBgLayout }}
    >
      <style jsx global>{`
        @keyframes blob-float {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .bg-blob {
          position: fixed;
          width: 600px;
          height: 600px;
          filter: blur(100px);
          opacity: 0.12;
          z-index: 0;
          border-radius: 50%;
          pointer-events: none;
          animation: blob-float 25s infinite alternate ease-in-out;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.65) !important;
          backdrop-filter: blur(14px) !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04) !important;
        }
        .dark .glass-card {
          background: rgba(20, 20, 20, 0.65) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      {/* 🌌 Animated Background Decor */}
      <div
        className="bg-blob"
        style={{
          top: "-150px",
          right: "-100px",
          background: token.colorPrimary,
          animationDelay: "0s",
        }}
      />
      <div
        className="bg-blob"
        style={{
          bottom: "-150px",
          left: "-100px",
          background: token.colorSuccess,
          animationDelay: "-5s",
        }}
      />
      <div
        className="bg-blob"
        style={{
          top: "40%",
          left: "30%",
          width: 400,
          height: 400,
          background: token.colorInfo,
          opacity: 0.08,
          animationDelay: "-10s",
        }}
      />

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
          <Flex vertical style={{ height: "100%" }}>
            <div className="flex-1 overflow-y-auto mt-6">
              <MemoSidebarContent
                collapsed={false}
                onMobileClose={() => setMobileOpen(false)}
              />
            </div>
            <div className="p-4">
              <DarkModeToggle />
            </div>
          </Flex>
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
          <Flex vertical style={{ height: "100%" }}>
            {/* Logo Area */}
            <Flex align="center" justify="center" style={{ height: 64 }}>
              {/* Logo Here */}
            </Flex>

            {/* Menu Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <MemoSidebarContent collapsed={collapsed} />
            </div>

            {/* Footer / Toggle Area */}
            {renderDarkToggle()}

            <Flex
              align="center"
              justify="center"
              className="h-12 cursor-pointer hover:bg-black/5 transition-colors border-t"
              style={{ borderColor: token.colorBorderSecondary }}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Flex>
          </Flex>
        </Sider>
      )}

      {/* 🔹 Main Layout Content Wrapper */}
      <Layout className="transition-all duration-300 bg-transparent z-10">
        {/* 🧭 Header */}
        <Header
          className="sticky top-0 z-30 w-full p-0 h-20"
          style={{ background: "transparent" }}
        >
          <MemoMainHeader />
        </Header>

        {/* 📄 Content Area */}
        <Content
          className="p-4 sm:p-6 overflow-x-hidden min-h-0"
          style={{
            background: "transparent",
          }}
        >
          <Flex vertical gap="middle" style={{ height: "100%" }}>
            <div className="w-full">
              <MemoBreadcrumbs />
            </div>

            <div className="flex-1 w-full h-full relative fade-in">
              <Suspense fallback={contentSkeleton}>{children}</Suspense>
            </div>
          </Flex>
        </Content>
      </Layout>

      {/* 🔘 Mobile Floating Hamburger Button (Bottom-Right) */}
      {isMobile && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={mobileOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            fontSize: 24,
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            backgroundColor: token.colorPrimary,
            border: "none",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="hover:scale-110 active:scale-95 transition-transform duration-200 animate-bounce-in"
        />
      )}
    </Layout>
  );
}
