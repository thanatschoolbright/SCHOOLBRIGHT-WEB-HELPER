import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";
import { Suspense, useState } from "react";
import "@ant-design/v5-patch-for-react-19";
import { Layout, Skeleton, theme } from "antd";
import Breadcrumbs from "../breadcrump/breadcrumb-component";
import dynamic from "next/dynamic";

// Lazy chunks with local skeleton fallbacks
const SidebarContent = dynamic(
  () => import("@components/layouts/backend/sidebar-component"),
  {
    loading: () => (
      <div style={{ padding: 16 }}>
        <Skeleton active title={{ width: 120 }} paragraph={false} />
        <div style={{ marginTop: 12 }}>
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </div>
    ),
    ssr: true,
  }
);

const MainHeader = dynamic(() => import("@components/layouts/backend/navbar"), {
  loading: () => (
    <div style={{ paddingBlock: 8 }}>
      <Skeleton active title={{ width: 220 }} paragraph={false} />
    </div>
  ),
  ssr: true,
});

const BreadcrumbsLazy = dynamic(
  () => import("../breadcrump/breadcrumb-component"),
  {
    loading: () => (
      <Skeleton active title={false} paragraph={{ rows: 1, width: "60%" }} />
    ),
    ssr: true,
  }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const { Header, Sider, Content } = Layout;

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
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
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <SidebarContent />
          </div>
          {!collapsed && (
            <div
              style={{
                padding: 16,
              }}
            >
              <DarkModeToggle />
            </div>
          )}
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: "sticky",
            top: 0,
            zIndex: 50,
            paddingInline: 20,
          }}
        >
          <MainHeader />
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
            <BreadcrumbsLazy />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <Suspense
              fallback={
                <div style={{ padding: 12 }}>
                  <Skeleton
                    active
                    title={{ width: "40%" }}
                    paragraph={{ rows: 2 }}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Skeleton active title={false} paragraph={{ rows: 6 }} />
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
