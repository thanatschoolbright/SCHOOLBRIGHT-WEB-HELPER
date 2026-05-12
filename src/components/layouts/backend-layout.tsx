"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Drawer, Flex, Grid, Layout, theme } from "antd";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import BreadcrumbComponent from "@components/breadcrump/breadcrumb-component";
import BackendFooter from "@components/layouts/backend/footer";
import MainHeader from "@components/layouts/backend/navbar";
import SidebarContent from "@components/layouts/backend/sidebar-component";

/**
 * Constants for Layout configuration
 */
const SIDEBAR_COLLAPSED_KEY = "sb_sidebar_collapsed";
const DESKTOP_SIDEBAR_WIDTH = 320;
const COLLAPSED_SIDEBAR_WIDTH = 88;
const HEADER_HEIGHT = 80;

const MemoSidebarContent = React.memo(SidebarContent);
const MemoMainHeader = React.memo(MainHeader);
const MemoBreadcrumbs = React.memo(BreadcrumbComponent);

/**
 * Modern Backend Layout (Standard 2026)
 * Features: High responsiveness, Glassmorphism, Fluid animations, and Symmetrical design.
 */
export default function BackendLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { token } = theme.useToken();
  const { Sider, Content, Header } = Layout;
  const screens = Grid.useBreakpoint();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const scrollRef = useRef<number>(0);

  // Motion values สำหรับ floating navbar — spring ทำให้ลื่นไหลเหมือนก้อนเมฆ
  const rawWidth = useMotionValue(100); // % ของ container
  const rawY = useMotionValue(0);
  const rawRadius = useMotionValue(0);
  const rawBlur = useMotionValue(12);
  const rawShadowOpa = useMotionValue(0.03);

  const springCfg = { stiffness: 180, damping: 28, mass: 1 };
  const width = useSpring(rawWidth, springCfg);
  const y = useSpring(rawY, springCfg);
  const radius = useSpring(rawRadius, springCfg);
  const blur = useSpring(rawBlur, springCfg);
  const shadowOpa = useSpring(rawShadowOpa, springCfg);

  // แปลง blur motion value เป็น css string
  const backdropFilter = useTransform(
    blur,
    (v) => `blur(${v}px) saturate(180%)`,
  );
  const boxShadow = useTransform(
    shadowOpa,
    (v) =>
      `0 8px 40px -8px rgba(0,0,0,${v}), 0 2px 12px -4px rgba(0,0,0,${
        v * 0.5
      })`,
  );

  // Initialize sidebar state from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedSidebarState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedSidebarState !== null) {
      setCollapsed(savedSidebarState === "true");
    }
  }, []);

  // ตรวจ scroll — เมื่อเลื่อนเกิน threshold เปลี่ยนเป็น floating pill
  useEffect(() => {
    const THRESHOLD = 80;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const wasFloating = scrollRef.current > THRESHOLD;
      const nowFloating = scrollY > THRESHOLD;
      scrollRef.current = scrollY;

      if (nowFloating === wasFloating) return;

      setIsFloating(nowFloating);

      if (nowFloating) {
        // floating — หดเหลือ pill กลางจอ ลอยขึ้นเล็กน้อย
        rawWidth.set(70);
        rawY.set(12);
        rawRadius.set(9999);
        rawBlur.set(20);
        rawShadowOpa.set(0.18);
      } else {
        // docked — กลับเต็มความกว้าง
        rawWidth.set(100);
        rawY.set(0);
        rawRadius.set(0);
        rawBlur.set(12);
        rawShadowOpa.set(0.03);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [rawBlur, rawRadius, rawShadowOpa, rawWidth, rawY]);

  const handleToggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
      return newState;
    });
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    setMobileDrawerOpen((prev) => !prev);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(false);
  }, []);

  const isDesktop = !!screens.lg;

  if (!isMounted)
    return (
      <div style={{ background: token.colorBgLayout, minHeight: "100vh" }} />
    );

  return (
    <Layout
      className="min-h-screen relative"
      style={{
        background: token.colorBgLayout,
        transition: "background 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "visible",
      }}
    >
      <style jsx global>{`
        @keyframes blob-float {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40px, -60px) scale(1.15);
          }
          66% {
            transform: translate(-30px, 40px) scale(0.95);
          }
        }
        .modern-glass {
          background: rgba(255, 255, 255, 0.5) !important;
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
        }
        .dark .modern-glass {
          background: rgba(28, 28, 30, 0.25) !important;
        }
        .layout-transition {
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        .background-blobs {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          animation: blob-float 20s infinite alternate ease-in-out;
        }
      `}</style>

      {/* Decorative Background Elements */}
      <div className="background-blobs">
        <div
          className="blob"
          style={{
            top: "-10%",
            right: "-5%",
            width: "50vw",
            height: "50vw",
            background: token.colorPrimary,
            animationDuration: "25s",
          }}
        />
        <div
          className="blob"
          style={{
            bottom: "-10%",
            left: "-5%",
            width: "45vw",
            height: "45vw",
            background: token.colorSuccess,
            animationDelay: "-7s",
            animationDuration: "30s",
          }}
        />
      </div>

      {/* Sidebar for Desktop */}
      {isDesktop && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={DESKTOP_SIDEBAR_WIDTH}
          collapsedWidth={COLLAPSED_SIDEBAR_WIDTH}
          className="layout-transition modern-glass"
          style={{
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            zIndex: 100,
            height: "100vh",
            position: "sticky",
            top: 0,
            flexShrink: 0,
            alignSelf: "flex-start",
            boxShadow: "4px 0 24px -12px rgba(0,0,0,0.05)",
          }}
        >
          <MemoSidebarContent
            collapsed={collapsed}
            onToggleAction={handleToggleSidebar}
          />
        </Sider>
      )}

      {/* Mobile Sidebar Drawer */}
      {!isDesktop && (
        <Drawer
          placement="left"
          onClose={closeMobileDrawer}
          open={mobileDrawerOpen}
          width={DESKTOP_SIDEBAR_WIDTH}
          styles={{
            body: { padding: 0 },
            header: { display: "none" },
          }}
          className="modern-glass"
          classNames={{ wrapper: "z-[1000]" }}
        >
          <MemoSidebarContent
            collapsed={false}
            onMobileCloseAction={closeMobileDrawer}
          />
        </Drawer>
      )}

      {/* Main Layout Area */}
      <Layout
        className="layout-transition"
        style={{
          background: "transparent",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Sticky wrapper — จอง space ให้ content ไม่กระโดด */}
        <Header
          style={{
            padding: 0,
            height: HEADER_HEIGHT,
            position: "relative",
            top: 0,
            zIndex: 90,
            width: "100%",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            boxShadow: "none",
          }}
        >
          {/* Floating pill — animate ตาม scroll */}
          <motion.div
            style={{
              y,
              borderRadius: radius,
              backdropFilter,
              WebkitBackdropFilter: backdropFilter,
              boxShadow,
              height: HEADER_HEIGHT,
            }}
            animate={{
              width: isFloating ? "min(780px, 72%)" : "100%",
              y: isFloating ? 12 : 0,
              borderRadius: isFloating ? 9999 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 28,
              mass: 1,
            }}
            className={[
              "relative flex items-center overflow-hidden",
              isFloating
                ? "px-4 bg-white/70 dark:bg-black/40 border border-white/60 dark:border-white/10"
                : "px-6 bg-white/50 dark:bg-black/20 border-b border-black/[0.06] dark:border-white/[0.06]",
            ].join(" ")}
          >
            {/* Shimmer ริ้วแสงที่ขอบบน — animate opacity เท่านั้น background เป็น static */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)",
              }}
              animate={{ opacity: isFloating ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            />

            {/* Subtle inner glow เมื่อ floating — animate opacity เท่านั้น background เป็น static */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)",
              }}
              animate={{ opacity: isFloating ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />

            <Flex
              align="center"
              gap="middle"
              style={{ width: "100%", position: "relative" }}
            >
              {!isDesktop && (
                <Button
                  type="text"
                  icon={
                    mobileDrawerOpen ? (
                      <MenuFoldOutlined />
                    ) : (
                      <MenuUnfoldOutlined />
                    )
                  }
                  onClick={toggleMobileDrawer}
                  style={{
                    fontSize: 20,
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                />
              )}
              <MemoMainHeader />
            </Flex>
          </motion.div>
        </Header>

        <Content
          style={{
            padding: screens.md ? "32px 40px" : "24px 16px",
            minHeight: "auto",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 32,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 32,
              width: "100%",
            }}
          >
            <MemoBreadcrumbs />

            <Layout.Content
              style={{ background: "transparent", position: "relative" }}
            >
              <Suspense fallback={null}>{children}</Suspense>
            </Layout.Content>
          </div>
        </Content>

        <BackendFooter />

        {/* Dynamic Mobile Float Button (Optional enhancement) */}
        {!isDesktop && !mobileDrawerOpen && (
          <div
            style={{
              position: "fixed",
              bottom: 32,
              right: 32,
              zIndex: 999,
            }}
          >
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<MenuUnfoldOutlined />}
              onClick={toggleMobileDrawer}
              style={{
                width: 60,
                height: 60,
                fontSize: 24,
                boxShadow: `0 8px 32px ${token.colorPrimary}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover})`,
              }}
            />
          </div>
        )}
      </Layout>
    </Layout>
  );
}
