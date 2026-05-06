"use client";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Grid, Popover, theme, Tooltip } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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

// ตรวจสอบว่า item หรือ child ใดเป็น active route
function isDescendantActive(
  item: CustomMenuItemType,
  pathname: string,
): boolean {
  if (item.href === pathname) return true;
  if (!item.children) return false;
  return item.children.some((child) => isDescendantActive(child, pathname));
}

// --- Animation Variants ---
const EASE_SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };
const EASE_SMOOTH = [0.32, 0.72, 0, 1] as const;
const EASE_OUT = [0, 0, 0.2, 1] as const;

const submenuVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.26, ease: EASE_SMOOTH },
  },
  open: {
    height: "auto" as const,
    opacity: 1,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: EASE_SMOOTH },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10, filter: "blur(2px)" },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.035, duration: 0.28, ease: EASE_OUT },
  }),
};

const collapsedIconVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 4 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.045, duration: 0.28, ...EASE_SPRING },
  }),
};

// --- Dark Mode Toggle ---
function DarkModeToggle({ collapsed }: { collapsed: boolean }) {
  const { token } = theme.useToken();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(DARK_MODE_KEY);
    return saved !== null
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-base cursor-pointer border-0 outline-none overflow-hidden"
            style={{
              background: isDark
                ? token.colorFillSecondary
                : token.colorPrimaryBg,
              color: isDark ? token.colorWarning : token.colorPrimary,
              boxShadow: isDark
                ? `0 0 12px ${token.colorWarning}20`
                : `0 0 12px ${token.colorPrimary}20`,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -120, opacity: 0, scale: 0.4 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 120, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
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
      className="border-t mt-6 pt-5 flex items-center justify-between gap-3"
      style={{ borderColor: token.colorBorderSecondary }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* ไอคอน */}
        <motion.div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm overflow-hidden flex-shrink-0"
          animate={{
            background: isDark
              ? token.colorFillSecondary
              : token.colorPrimaryBg,
            color: isDark ? token.colorWarning : token.colorPrimary,
            boxShadow: isDark
              ? `0 0 14px ${token.colorWarning}25`
              : `0 0 14px ${token.colorPrimary}25`,
          }}
          transition={{ duration: 0.35 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? "moon" : "sun"}
              initial={{ rotate: -120, opacity: 0, scale: 0.4 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 120, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="flex items-center justify-center"
            >
              {isDark ? <MoonOutlined /> : <SunOutlined />}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* ข้อความ */}
        <div className="flex flex-col leading-none gap-0.5 min-w-0">
          <motion.span
            className="text-[12.5px] font-semibold"
            animate={{ color: token.colorText }}
            transition={{ duration: 0.25 }}
          >
            {isDark ? "โหมดมืด" : "โหมดสว่าง"}
          </motion.span>
          <span
            className="text-[10.5px] truncate"
            style={{ color: token.colorTextTertiary }}
          >
            {isDark ? "ปกป้องดวงตาของคุณ" : "มองเห็นได้ชัดเจน"}
          </span>
        </div>
      </div>

      {/* Toggle Pill */}
      <motion.button
        type="button"
        onClick={toggle}
        whileTap={{ scale: 0.93 }}
        className="relative flex-shrink-0 w-12 h-6 rounded-full cursor-pointer border-0 outline-none"
        animate={{
          backgroundColor: isDark
            ? token.colorPrimary
            : token.colorFillTertiary,
          boxShadow: isDark
            ? `0 0 10px ${token.colorPrimary}50, inset 0 1px 2px rgba(0,0,0,0.15)`
            : `inset 0 1px 3px rgba(0,0,0,0.12)`,
        }}
        transition={{ duration: 0.35 }}
      >
        <motion.span
          layout
          transition={EASE_SPRING}
          className="absolute top-0.5 w-5 h-5 rounded-full"
          style={{
            left: isDark ? "calc(100% - 22px)" : "2px",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </motion.button>
    </div>
  );
}

// --- Status Badge ---
function StatusBadge({ type }: { type: "new" | "revamp" | "maintenance" }) {
  const { t } = useTranslation("menu");
  const map = {
    new: {
      className: "bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/20",
      label: t("status.new"),
    },
    revamp: {
      className: "bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/20",
      label: t("status.revamp"),
    },
    maintenance: {
      className: "bg-red-500/15 text-red-500 ring-1 ring-red-500/20",
      label: t("status.maintenance"),
    },
  };
  const { className, label } = map[type];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ...EASE_SPRING }}
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 ${className}`}
    >
      {label}
    </motion.span>
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={
        !shouldReduceMotion
          ? { x: 4, transition: { duration: 0.18, ease: EASE_OUT } }
          : {}
      }
      whileTap={!shouldReduceMotion ? { scale: 0.975 } : {}}
      onClick={() => item.href && onNavigate(item.href)}
      className="relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer border-0 outline-none group overflow-hidden"
      style={{
        background: isActive ? `${token.colorPrimary}12` : "transparent",
        color: isActive ? token.colorPrimary : token.colorTextSecondary,
        transition: "background 0.2s, color 0.2s",
      }}
    >
      {/* Active left-bar indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="active-bar"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full"
            style={{
              height: "60%",
              background: token.colorPrimary,
              boxShadow: `0 0 8px ${token.colorPrimary}60`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Hover background shimmer */}
      <motion.span
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `${token.colorPrimary}08`,
          transition: "opacity 0.2s",
        }}
      />

      {/* Icon or dot */}
      {item.icon ? (
        <motion.span
          animate={{
            color: isActive ? token.colorPrimary : token.colorTextQuaternary,
            scale: isActive ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="text-sm flex-shrink-0 flex items-center justify-center w-5 h-5"
        >
          {item.icon}
        </motion.span>
      ) : (
        <motion.span
          animate={{
            scale: isActive ? 1.5 : 1,
            backgroundColor: isActive
              ? token.colorPrimary
              : token.colorTextQuaternary,
            boxShadow: isActive ? `0 0 6px ${token.colorPrimary}80` : "none",
          }}
          transition={{ duration: 0.22 }}
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-0.5"
        />
      )}

      {/* Label */}
      <span
        className={`relative flex-1 text-[12.5px] leading-snug truncate text-left z-10 ${
          isActive ? "font-semibold" : "font-normal"
        }`}
      >
        {item.label}
      </span>

      {/* Badges */}
      <div className="flex items-center gap-1 flex-shrink-0 z-10">
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
        whileHover={{ x: 3, transition: { duration: 0.16 } }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer border-0 outline-none"
        style={{
          background:
            isActive && !open ? `${token.colorPrimary}08` : "transparent",
          color: isActive ? token.colorPrimary : token.colorTextSecondary,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {item.icon && (
          <motion.span
            animate={{
              color: isActive ? token.colorPrimary : token.colorTextQuaternary,
            }}
            transition={{ duration: 0.2 }}
            className="text-sm flex-shrink-0 flex items-center justify-center w-5 h-5"
          >
            {item.icon}
          </motion.span>
        )}
        <span
          className={`flex-1 text-[12.5px] leading-snug truncate text-left ${
            isActive ? "font-semibold" : "font-medium"
          }`}
        >
          {item.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.28, ease: EASE_SMOOTH }}
          className="flex-shrink-0 text-[10px] opacity-50"
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
              className="flex flex-col gap-0.5 mt-0.5 ml-4 pl-3 py-0.5 border-l"
              style={{ borderColor: `${token.colorPrimary}25` }}
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
        whileHover={{ x: 2, transition: { duration: 0.16 } }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border-0 outline-none overflow-hidden"
        animate={{
          background: isActive ? `${token.colorPrimary}10` : "rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.25 }}
        style={{
          border: isActive
            ? `1px solid ${token.colorPrimary}20`
            : "1px solid transparent",
        }}
      >
        {/* Section Icon */}
        <motion.span
          animate={{
            background: isActive
              ? `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover})`
              : token.colorFillSecondary,
            color: isActive ? "#fff" : token.colorTextTertiary,
            boxShadow: isActive
              ? `0 4px 12px ${token.colorPrimary}40, 0 0 0 1px ${token.colorPrimary}20`
              : "none",
          }}
          transition={{ duration: 0.28 }}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-[15px]"
        >
          {item.icon}
        </motion.span>

        <span
          className={`flex-1 text-[13px] leading-snug truncate text-left tracking-wide ${
            isActive ? "font-bold" : "font-semibold"
          }`}
          style={{ color: isActive ? token.colorPrimary : token.colorText }}
        >
          {item.label}
        </span>

        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.28, ease: EASE_SMOOTH }}
          className="flex-shrink-0 text-[10px]"
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
              className="flex flex-col gap-0.5 mt-1 ml-4 pl-3 pb-2 border-l"
              style={{ borderColor: `${token.colorPrimary}20` }}
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

  const renderPopoverContent = (item: CustomMenuItemType) => {
    return (
      <div className="sidebar-popover-content">
        <div
          className="sidebar-popover-title"
          style={{ color: token.colorPrimary }}
        >
          {item.label}
        </div>
        <div className="sidebar-popover-children flex flex-col gap-1">
          {item.children?.map((child) => (
            <Link
              key={child.href ?? child.label}
              href={child.href ?? "#"}
              onClick={(e) => {
                if (!child.href) e.preventDefault();
                else onNavigate(child.href);
              }}
              className={`sidebar-popover-child px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 group ${
                currentPathname === child.href
                  ? "bg-primary/10 font-bold"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95"
              }`}
              style={{
                color:
                  currentPathname === child.href
                    ? token.colorPrimary
                    : token.colorText,
              }}
            >
              {child.icon && (
                <span
                  className="text-base"
                  style={{
                    color:
                      currentPathname === child.href
                        ? token.colorPrimary
                        : token.colorTextTertiary,
                  }}
                >
                  {child.icon}
                </span>
              )}
              <span className="flex-1">{child.label}</span>
              {(child.news || child.revamp || child.maintenance) && (
                <div className="flex gap-1 transform scale-75 origin-right">
                  {child.news && <StatusBadge type="new" />}
                  {child.revamp && <StatusBadge type="revamp" />}
                  {child.maintenance && <StatusBadge type="maintenance" />}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 px-1">
      {items.map((item, i) => {
        const isActive = isDescendantActive(item, currentPathname);
        const hasChildren = item.children && item.children.length > 0;
        const href = item.href;

        const button = (
          <motion.button
            type="button"
            custom={i}
            variants={collapsedIconVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
              scale: 1.14,
              x: 3,
              transition: { duration: 0.16, ease: EASE_OUT },
            }}
            whileTap={{ scale: 0.88 }}
            onClick={() => (href ? onNavigate(href) : undefined)}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl mx-auto cursor-pointer border-0 outline-none flex-shrink-0 overflow-hidden"
            style={{ fontSize: 17 }}
          >
            {/* Background */}
            <motion.span
              className="absolute inset-0 rounded-xl"
              animate={{
                background: isActive
                  ? `${token.colorPrimary}15`
                  : "rgba(0,0,0,0)",
                border: isActive
                  ? `1px solid ${token.colorPrimary}35`
                  : "1px solid transparent",
                boxShadow: isActive
                  ? `0 0 14px ${token.colorPrimary}30, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : "none",
              }}
              transition={{ duration: 0.25 }}
            />

            {/* Icon */}
            <motion.span
              animate={{
                color: isActive ? token.colorPrimary : token.colorTextTertiary,
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ duration: 0.22 }}
              className="relative z-10 flex items-center justify-center"
            >
              {item.icon}
            </motion.span>

            {/* Active dot */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  key="dot"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ...EASE_SPRING }}
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full z-10"
                  style={{
                    background: token.colorPrimary,
                    boxShadow: `0 0 6px ${token.colorPrimary}`,
                  }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        );

        if (hasChildren) {
          return (
            <Popover
              key={item.href ?? item.label}
              content={renderPopoverContent(item)}
              placement="rightTop"
              overlayClassName="sidebar-collapsed-menu-popover"
              trigger="hover"
              mouseEnterDelay={0.1}
            >
              {button}
            </Popover>
          );
        }

        return (
          <Tooltip
            key={item.href ?? item.label}
            title={item.label}
            placement="right"
          >
            {button}
          </Tooltip>
        );
      })}
    </div>
  );
}

// --- Logo Area ---
function LogoArea({
  collapsed,
  onLogoClick,
  onToggle,
  showToggle,
}: {
  collapsed: boolean;
  onLogoClick: () => void;
  onToggle?: () => void;
  showToggle: boolean;
}) {
  const { token } = theme.useToken();

  return (
    <div className="flex items-center px-4 mb-5 gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {!collapsed && (
          <motion.button
            key="logo"
            type="button"
            onClick={onLogoClick}
            initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
            animate={{
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              transition: { duration: 0.28, ease: EASE_OUT },
            }}
            exit={{
              opacity: 0,
              x: -12,
              filter: "blur(4px)",
              transition: { duration: 0.18 },
            }}
            className="flex items-center gap-3 cursor-pointer border-0 bg-transparent outline-none p-0 flex-1 min-w-0"
          >
            {/* Logo image with ring */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={EASE_SPRING}
              className="relative flex-shrink-0"
            >
              <div
                className="absolute inset-0 rounded-xl opacity-60"
                style={{
                  background: `radial-gradient(circle, ${token.colorPrimary}30, transparent 70%)`,
                  filter: "blur(6px)",
                }}
              />
              <Image
                src="/web-app-manifest-192x192.png"
                alt="Logo"
                width={38}
                height={38}
                className="relative rounded-xl object-cover"
                style={{ boxShadow: `0 2px 10px ${token.colorPrimary}30` }}
              />
            </motion.div>

            <div className="flex flex-col leading-none gap-1 min-w-0">
              <span
                className="text-[15px] font-extrabold whitespace-nowrap truncate tracking-tight"
                style={{ color: token.colorText }}
              >
                School Bright
              </span>
              <span
                className="text-[9px] font-medium tracking-widest whitespace-nowrap uppercase"
                style={{ color: token.colorTextQuaternary }}
              >
                Backend System
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {showToggle && (
        <motion.button
          type="button"
          onClick={onToggle}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          transition={EASE_SPRING}
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
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="flex items-center justify-center"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
}

// --- Main Sidebar ---
export default function SidebarContent({
  collapsed = false,
  onToggleAction,
  onMobileCloseAction,
}: {
  collapsed?: boolean;
  onToggleAction?: () => void;
  onMobileCloseAction?: () => void;
}) {
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
      onMobileCloseAction?.();
    },
    [router, onMobileCloseAction],
  );

  return (
    <div
      className="flex flex-col h-screen py-5 select-none w-full relative"
      style={{ background: token.colorBgContainer }}
    >
      {/* Decorative top-right glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${token.colorPrimary}08, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Header */}
      <LogoArea
        collapsed={collapsed}
        onLogoClick={() => router.push("/main")}
        onToggle={onToggleAction}
        showToggle={!!screens.lg}
      />

      {/* Divider */}
      <div
        className="mx-4 mb-4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${token.colorBorderSecondary}, transparent)`,
        }}
      />

      {/* Menu List */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 w-full"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`
          .sidebar-scroll::-webkit-scrollbar { display: none; }
        `}</style>

        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 0.22, delay: 0.06 },
              }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
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
              animate={{
                opacity: 1,
                transition: { duration: 0.22, delay: 0.06 },
              }}
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
        <motion.div
          className={`mt-3 flex ${
            collapsed ? "justify-center" : "justify-start"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <span
            className="text-[10px] font-medium tracking-widest"
            style={{ color: token.colorTextQuaternary }}
          >
            v{packageJson.version}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
