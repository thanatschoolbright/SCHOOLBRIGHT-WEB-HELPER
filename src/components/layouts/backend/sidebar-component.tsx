"use client";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Grid, theme, Tooltip } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../package.json";

export interface CustomMenuItemType {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  news?: boolean;
  revamp?: boolean;
  maintenance?: boolean;
  tag?: string;
  children?: CustomMenuItemType[];
}

const DARK_MODE_KEY = "theme";

function isDescendantActive(item: CustomMenuItemType, pathname: string): boolean {
  if (item.href === pathname) return true;
  if (!item.children) return false;
  return item.children.some((child) => isDescendantActive(child, pathname));
}

// --- Animation variants ---
// framer-motion v12 ต้องการ ease เป็น tuple 4 ค่าหรือ string เท่านั้น
const EASE_STD = "easeInOut" as const;

const submenuVariants = {
  closed: { height: 0, opacity: 0 },
  open: {
    height: "auto" as const,
    opacity: 1,
    transition: { duration: 0.28, ease: EASE_STD },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: EASE_STD },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.22, ease: EASE_STD },
  }),
};

const collapsedIconVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.25, type: "spring" as const, stiffness: 300, damping: 20 },
  }),
};

// --- Dark Mode Toggle ---
function DarkModeToggle({ collapsed }: { collapsed: boolean }) {
  const { token } = theme.useToken();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    const initialDark =
      saved !== null
        ? saved === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark, mounted]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(DARK_MODE_KEY, next ? "dark" : "light");
  };

  if (!mounted) return null;

  if (collapsed) {
    return (
      <div
        className="border-t mt-4 pt-4 flex justify-center"
        style={{ borderColor: token.colorBorderSecondary }}
      >
        <Tooltip title={isDark ? "โหมดมืด" : "โหมดสว่าง"} placement="right">
          <motion.button
            type="button"
            onClick={toggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base cursor-pointer border-0 outline-none"
            style={{
              background: isDark ? token.colorFillSecondary : token.colorPrimaryBg,
              color: isDark ? token.colorText : token.colorPrimary,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center justify-center"
              >
                {isDark ? <MoonOutlined /> : <SunOutlined />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className="border-t mt-6 pt-6 flex items-center justify-between"
      style={{ borderColor: token.colorBorderSecondary }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-base overflow-hidden"
          style={{
            background: isDark ? token.colorFillSecondary : token.colorPrimaryBg,
            color: isDark ? token.colorText : token.colorPrimary,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? "moon" : "sun"}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center justify-center"
            >
              {isDark ? <MoonOutlined /> : <SunOutlined />}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex flex-col leading-none gap-0.5">
          <span className="text-sm font-semibold" style={{ color: token.colorText }}>
            {isDark ? "โหมดมืด" : "โหมดสว่าง"}
          </span>
          <span className="text-xs" style={{ color: token.colorTextTertiary }}>
            {isDark ? "ปกป้องดวงตาของคุณ" : "มองเห็นได้ชัดเจน"}
          </span>
        </div>
      </div>
      {/* Toggle pill */}
      <motion.button
        type="button"
        onClick={toggle}
        whileTap={{ scale: 0.95 }}
        className="relative w-12 h-6 rounded-full cursor-pointer border-0 outline-none flex-shrink-0"
        style={{ background: isDark ? token.colorPrimary : token.colorFillSecondary }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{
            left: isDark ? "calc(100% - 22px)" : "2px",
            background: "#fff",
            color: isDark ? token.colorPrimary : token.colorTextTertiary,
          }}
        >
          {isDark ? "🌙" : "☀️"}
        </motion.span>
      </motion.button>
    </div>
  );
}

// --- Status Badge ---
function StatusBadge({ type }: { type: "new" | "revamp" | "maintenance" }) {
  const { t } = useTranslation("menu");
  const map = {
    new: { bg: "bg-orange-500/15 text-orange-500", label: t("status.new") },
    revamp: { bg: "bg-blue-500/15 text-blue-500", label: t("status.revamp") },
    maintenance: { bg: "bg-red-500/15 text-red-500", label: t("status.maintenance") },
  };
  const { bg, label } = map[type];
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 ${bg}`}>
      {label}
    </span>
  );
}

// --- Leaf Item ---
function LeafItem({
  item,
  currentPathname,
  onNavigate,
  index = 0,
}: {
  item: CustomMenuItemType;
  currentPathname: string;
  onNavigate: (href: string) => void;
  index?: number;
}) {
  const { token } = theme.useToken();
  const isActive = currentPathname === item.href;

  return (
    <motion.button
      type="button"
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ x: 3, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => item.href && onNavigate(item.href)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer border-0 outline-none"
      style={{
        background: isActive ? token.colorPrimaryBg : "transparent",
        color: isActive ? token.colorPrimary : token.colorTextSecondary,
        border: isActive ? `1px solid ${token.colorPrimary}30` : "1px solid transparent",
        transition: "background 0.2s, color 0.2s, border-color 0.2s",
      }}
    >
      {item.icon ? (
        <span
          className="text-sm flex-shrink-0 flex items-center justify-center w-5 h-5"
          style={{ color: isActive ? token.colorPrimary : token.colorTextTertiary }}
        >
          {item.icon}
        </span>
      ) : (
        <motion.span
          animate={{
            scale: isActive ? 1.4 : 1,
            backgroundColor: isActive ? token.colorPrimary : token.colorTextQuaternary,
          }}
          transition={{ duration: 0.2 }}
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-0.5"
        />
      )}
      <span
        className={`flex-1 text-[13px] leading-snug truncate text-left ${isActive ? "font-semibold" : "font-normal"}`}
      >
        {item.label}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.news && <StatusBadge type="new" />}
        {item.revamp && <StatusBadge type="revamp" />}
        {item.maintenance && <StatusBadge type="maintenance" />}
      </div>
    </motion.button>
  );
}

// --- Group Item (non-leaf, non-top-level) ---
function GroupItem({
  item,
  currentPathname,
  onNavigate,
  defaultOpen = false,
  index = 0,
}: {
  item: CustomMenuItemType;
  currentPathname: string;
  onNavigate: (href: string) => void;
  defaultOpen?: boolean;
  index?: number;
}) {
  const { token } = theme.useToken();
  const isActive = isDescendantActive(item, currentPathname);
  const [open, setOpen] = useState(defaultOpen || isActive);

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      <motion.button
        type="button"
        onClick={() => setOpen((p) => !p)}
        whileHover={{ x: 3, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer border-0 outline-none"
        style={{
          background: isActive && !open ? token.colorFillTertiary : "transparent",
          color: isActive ? token.colorPrimary : token.colorTextSecondary,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {item.icon && (
          <span className="text-sm flex-shrink-0 flex items-center justify-center w-5 h-5">
            {item.icon}
          </span>
        )}
        <span className="flex-1 text-[13px] font-semibold leading-snug truncate text-left">
          {item.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 text-xs"
          style={{ color: token.colorTextQuaternary }}
        >
          ▾
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="group-children"
            variants={submenuVariants}
            initial="closed"
            animate="open"
            exit="exit"
            className="overflow-hidden"
          >
            <div
              className="flex flex-col gap-0.5 mt-1 ml-4 pl-3 border-l"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              {item.children?.map((child, i) =>
                child.children ? (
                  <GroupItem
                    key={child.label}
                    item={child}
                    currentPathname={currentPathname}
                    onNavigate={onNavigate}
                    defaultOpen={isDescendantActive(child, currentPathname)}
                    index={i}
                  />
                ) : (
                  <LeafItem
                    key={child.href ?? child.label}
                    item={child}
                    currentPathname={currentPathname}
                    onNavigate={onNavigate}
                    index={i}
                  />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Section Item (top-level) ---
function SectionItem({
  item,
  currentPathname,
  onNavigate,
  index = 0,
}: {
  item: CustomMenuItemType;
  currentPathname: string;
  onNavigate: (href: string) => void;
  index?: number;
}) {
  const { token } = theme.useToken();
  const isActive = isDescendantActive(item, currentPathname);
  const [open, setOpen] = useState(isActive);

  if (item.href) {
    return (
      <LeafItem
        item={item}
        currentPathname={currentPathname}
        onNavigate={onNavigate}
        index={index}
      />
    );
  }

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      {/* Section Header */}
      <motion.button
        type="button"
        onClick={() => setOpen((p) => !p)}
        whileHover={{ x: 2, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-0 outline-none"
        style={{
          background: isActive ? token.colorPrimaryBg : "transparent",
          color: isActive ? token.colorPrimary : token.colorText,
          border: isActive ? `1px solid ${token.colorPrimary}20` : "1px solid transparent",
          transition: "background 0.2s, color 0.2s, border-color 0.2s",
        }}
      >
        <motion.span
          animate={{
            background: isActive ? token.colorPrimary : token.colorFillSecondary,
            color: isActive ? "#fff" : token.colorTextSecondary,
          }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-base"
        >
          {item.icon}
        </motion.span>
        <span className="flex-1 text-[13.5px] leading-snug font-bold tracking-wide truncate text-left">
          {item.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 text-[11px]"
          style={{ color: token.colorTextQuaternary }}
        >
          ▶
        </motion.span>
      </motion.button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="section-children"
            variants={submenuVariants}
            initial="closed"
            animate="open"
            exit="exit"
            className="overflow-hidden"
          >
            <div
              className="flex flex-col gap-0.5 mt-1 ml-4 pl-3 border-l mb-2"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              {item.children?.map((child, i) =>
                child.children ? (
                  <GroupItem
                    key={child.label}
                    item={child}
                    currentPathname={currentPathname}
                    onNavigate={onNavigate}
                    defaultOpen={isDescendantActive(child, currentPathname)}
                    index={i}
                  />
                ) : (
                  <LeafItem
                    key={child.href ?? child.label}
                    item={child}
                    currentPathname={currentPathname}
                    onNavigate={onNavigate}
                    index={i}
                  />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Collapsed Icon Rail ---
function CollapsedRail({
  items,
  currentPathname,
  onNavigate,
}: {
  items: CustomMenuItemType[];
  currentPathname: string;
  onNavigate: (href: string) => void;
}) {
  const { token } = theme.useToken();

  return (
    <div className="flex flex-col gap-2 px-2">
      {items.map((item, i) => {
        const isActive = isDescendantActive(item, currentPathname);
        const href = item.href;

        return (
          <Tooltip key={item.href ?? item.label} title={item.label} placement="right">
            <motion.button
              type="button"
              custom={i}
              variants={collapsedIconVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.12, x: 2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => (href ? onNavigate(href) : undefined)}
              className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto cursor-pointer border-0 outline-none flex-shrink-0"
              style={{
                background: isActive ? token.colorPrimaryBg : "transparent",
                color: isActive ? token.colorPrimary : token.colorTextSecondary,
                border: isActive
                  ? `1px solid ${token.colorPrimary}40`
                  : "1px solid transparent",
                fontSize: 18,
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
              }}
            >
              {item.icon}
            </motion.button>
          </Tooltip>
        );
      })}
    </div>
  );
}

// --- Main Sidebar ---
export default function SidebarContent({
  collapsed = false,
  onToggle,
  onMobileClose,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  onMobileClose?: () => void;
}) {
  const { t: translate } = useTranslation("translate");
  const sidebarMenu = useSidebarMenu() as CustomMenuItemType[];
  const currentPathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const handleNavigate = useCallback(
    (href: string) => {
      if (href.startsWith("http")) {
        window.open(href, "_blank");
      } else {
        router.push(href);
      }
      onMobileClose?.();
    },
    [router, onMobileClose],
  );

  return (
    <div
      className="flex flex-col h-screen py-5 select-none w-full"
      style={{ background: token.colorBgContainer }}
    >
      {/* Header */}
      <div className="flex items-center px-4 mb-6 gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {!collapsed && (
            <motion.button
              key="logo"
              type="button"
              onClick={() => router.push("/main")}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }}
              exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
              className="flex items-center gap-3 cursor-pointer border-0 bg-transparent outline-none p-0 flex-1 min-w-0"
            >
              <Image
                src="/web-app-manifest-192x192.png"
                alt="Logo"
                width={38}
                height={38}
                className="rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex flex-col leading-none gap-1 min-w-0">
                <span
                  className="text-[15px] font-extrabold whitespace-nowrap truncate"
                  style={{ color: token.colorText }}
                >
                  School Bright
                </span>
                <span
                  className="text-[9px] font-medium tracking-widest whitespace-nowrap uppercase"
                  style={{ color: token.colorTextTertiary }}
                >
                  {translate("navbar.backend_system")}
                </span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {screens.lg && (
          <motion.button
            type="button"
            onClick={onToggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer border-0 outline-none text-sm flex-shrink-0"
            style={{
              background: token.colorFillTertiary,
              color: token.colorTextSecondary,
              marginLeft: collapsed ? "auto" : 0,
              marginRight: collapsed ? "auto" : 0,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={collapsed ? "unfold" : "fold"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center justify-center"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 w-full">
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.05 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <CollapsedRail
                items={sidebarMenu}
                currentPathname={currentPathname}
                onNavigate={handleNavigate}
              />
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.05 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex flex-col gap-0.5 w-full"
            >
              {sidebarMenu.map((item, i) => (
                <SectionItem
                  key={item.href ?? item.label}
                  item={item}
                  currentPathname={currentPathname}
                  onNavigate={handleNavigate}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="mt-auto w-full transition-all duration-300"
        style={{ padding: collapsed ? "0 8px" : "0 16px" }}
      >
        <DarkModeToggle collapsed={collapsed} />
        <div className={`mt-2 flex ${collapsed ? "justify-center" : "justify-start"}`}>
          <span
            className="text-[10px] font-medium tracking-wide opacity-50"
            style={{ color: token.colorTextTertiary }}
          >
            v{packageJson.version}
          </span>
        </div>
      </div>
    </div>
  );
}
