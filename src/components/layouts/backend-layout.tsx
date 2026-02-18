"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Drawer, Flex, Grid, Layout, Skeleton, theme } from "antd";
import React, { Suspense, useEffect, useMemo, useState } from "react";

import BreadcrumbComponent from "@components/breadcrump/breadcrumb-component";
import MainHeader from "@components/layouts/backend/navbar";
import SidebarContent from "@components/layouts/backend/sidebar-component";

const SIDEBAR_COLLAPSED_KEY = "sb_sidebar_collapsed";

const MemoSidebarContent = React.memo(SidebarContent);
const MemoMainHeader = React.memo(MainHeader);
const MemoBreadcrumbs = React.memo(BreadcrumbComponent);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { token } = theme.useToken();
  const { Sider, Content, Header } = Layout;
  const screens = Grid.useBreakpoint();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const isDesktop = !!screens.lg;
  const sidebarWidth = 300;
  const collapsedWidth = 80;

  const contentSkeleton = useMemo(
    () => (
      <Flex vertical gap="small" style={{ padding: 12 }}>
        <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
        <Flex style={{ marginTop: 16 }}>
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </Flex>
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
      `}</style>

      <Flex
        className="bg-blob"
        style={{ top: "-10%", right: "-10%", background: token.colorPrimary }}
      />
      <Flex
        className="bg-blob"
        style={{
          bottom: "-10%",
          left: "-10%",
          background: token.colorSuccess,
          animationDelay: "-5s",
        }}
      />

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
          <MemoSidebarContent
            collapsed={false}
            onMobileClose={() => setMobileOpen(false)}
          />
        </Drawer>
      )}

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
            overflow: "hidden", // Use hidden here, and allow internal Flex to scroll if needed
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1) 0s",
          }}
        >
          <MemoSidebarContent
            collapsed={collapsed}
            onToggle={handleToggleCollapse}
          />
        </Sider>
      )}

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
          <Flex vertical gap={32} style={{ height: "100%" }}>
            <MemoBreadcrumbs />
            <Flex vertical style={{ flex: 1, position: "relative" }}>
              <Suspense fallback={contentSkeleton}>{children}</Suspense>
            </Flex>
          </Flex>
        </Content>
      </Layout>

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
