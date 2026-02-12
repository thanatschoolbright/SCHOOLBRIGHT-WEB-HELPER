"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Drawer, Flex, Grid, Layout, Skeleton, theme } from "antd";
import React, { Suspense, useEffect, useMemo, useState } from "react";

// Components
import BreadcrumbComponent from "@components/breadcrump/breadcrumb-component";
import MainHeader from "@components/layouts/backend/navbar";
import SidebarContent from "@components/layouts/backend/sidebar-component";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";

const SIDEBAR_COLLAPSED_KEY = "sb_sidebar_collapsed";

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
  const { token } = theme.useToken();
  const { Sider, Content, Header } = Layout;
  const screens = Grid.useBreakpoint();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Load persistence state
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }
  }, []);

  const handleToggleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  };

  // Constants
  const isDesktop = !!screens.lg;
  const sidebarWidth = 260;
  const collapsedWidth = 80;

  // 🦴 Skeleton Fallback
  const contentSkeleton = useMemo(
    () => (
      <Flex vertical gap="small" style={{ padding: 12 }}>
        <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
        <div style={{ marginTop: 16 }}>
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </Flex>
    ),
    [],
  );

  return (
    <Layout
      className="min-h-screen relative overflow-hidden"
      style={{
        background: token.colorBgLayout,
        transition: "background 0.3s ease",
      }}
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
          opacity: 0.1;
          z-index: 0;
          border-radius: 50%;
          pointer-events: none;
          animation: blob-float 25s infinite alternate ease-in-out;
        }
        .sidebar-menu-container::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-menu-container::-webkit-scrollbar-thumb {
          background: ${token.colorBorderSecondary};
          border-radius: 10px;
        }
      `}</style>

      {/* 🌌 Background Decor */}
      <div
        className="bg-blob"
        style={{ top: "-10%", right: "-10%", background: token.colorPrimary }}
      />
      <div
        className="bg-blob"
        style={{
          bottom: "-10%",
          left: "-10%",
          background: token.colorSuccess,
          animationDelay: "-5s",
        }}
      />

      {/* 📱 Mobile Sidebar (Drawer) */}
      {!isDesktop && (
        <Drawer
          placement="left"
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          width={sidebarWidth}
          styles={{
            body: { padding: 0, backgroundColor: token.colorBgContainer },
            header: { display: "none" },
          }}
          classNames={{ wrapper: "z-[9999]" }}
        >
          <Flex vertical style={{ height: "100%", paddingTop: 24 }}>
            <div className="flex-1 overflow-y-auto">
              <MemoSidebarContent
                collapsed={false}
                onMobileClose={() => setMobileOpen(false)}
              />
            </div>
            <div style={{ padding: 16 }}>
              <DarkModeToggle />
            </div>
          </Flex>
        </Drawer>
      )}

      {/* 🖥️ Desktop Sidebar (Sider) */}
      {isDesktop && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={handleToggleCollapse}
          trigger={null}
          width={sidebarWidth}
          collapsedWidth={collapsedWidth}
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            zIndex: 40,
            height: "100vh",
            position: "sticky",
            top: 0,
            overflow: "hidden",
            transition: "all 0.2s",
          }}
        >
          <Flex vertical style={{ height: "100%", width: "100%" }}>
            <Flex
              align="center"
              justify="center"
              style={{ height: 64, width: "100%" }}
            >
              {/* Optional: Add Sidebar Logo placeholder */}
            </Flex>

            <div
              className="flex-1 overflow-y-auto sidebar-menu-container"
              style={{ width: "100%" }}
            >
              <MemoSidebarContent collapsed={collapsed} />
            </div>

            {!collapsed && (
              <div style={{ padding: 16, width: "100%" }}>
                <DarkModeToggle />
              </div>
            )}

            <Flex
              align="center"
              justify="center"
              style={{
                height: 48,
                width: "100%",
                cursor: "pointer",
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                fontSize: 18,
                color: token.colorTextSecondary,
              }}
              onClick={() => handleToggleCollapse(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Flex>
          </Flex>
        </Sider>
      )}

      {/* 🔹 Main Layout Area */}
      <Layout style={{ background: "transparent", minWidth: 0 }}>
        <Header
          style={{
            padding: 0,
            height: 72,
            background: "transparent",
            position: "sticky",
            top: 0,
            zIndex: 30,
            width: "100%",
          }}
        >
          <MemoMainHeader />
        </Header>

        <Content
          style={{ padding: screens.sm ? "24px" : "16px", minHeight: 0 }}
        >
          <Flex vertical gap="middle" style={{ height: "100%" }}>
            <MemoBreadcrumbs />
            <div style={{ flex: 1, position: "relative" }}>
              <Suspense fallback={contentSkeleton}>{children}</Suspense>
            </div>
          </Flex>
        </Content>
      </Layout>

      {/* 🔘 Mobile Floating Action Button */}
      {!isDesktop && (
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
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      )}
    </Layout>
  );
}
