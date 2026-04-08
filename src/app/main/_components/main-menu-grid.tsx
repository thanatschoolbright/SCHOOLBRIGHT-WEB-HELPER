"use client";

import { type SidebarItem } from "@/constants/sidebar-menu-constant";
import { type Variants, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useMainStore } from "../_state/main-store";

// Variants
const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// SVG Arrow icon
function IconArrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover/item:translate-x-0.5"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ---- Menu Item (Leaf หรือ Child ที่ไม่มี sub-children) ----
interface MenuItemRowProps {
  icon?: React.ReactNode;
  label: string;
  isNew?: boolean;
  onClick: () => void;
}

function MenuItemRow({ icon, label, isNew, onClick }: MenuItemRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/item w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-150 text-left"
    >
      {/* Icon Badge */}
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-[16px] flex-shrink-0 group-hover/item:bg-slate-200 dark:group-hover/item:bg-slate-600 transition-colors">
        {icon}
      </div>

      {/* Label */}
      <span className="flex-1 text-[14px] font-medium text-slate-700 dark:text-slate-300 truncate group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
        {label}
      </span>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isNew ? (
          <span className="text-[9px] font-bold tracking-widest text-red-500 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 rounded px-1.5 py-0.5 uppercase">
            New
          </span>
        ) : null}
        <span className="text-slate-300 dark:text-slate-600 group-hover/item:text-slate-500 dark:group-hover/item:text-slate-400 transition-colors">
          <IconArrow />
        </span>
      </div>
    </button>
  );
}

// ---- Sub-section (category ที่มี children) ----
interface MenuSectionProps {
  label: string;
  children: React.ReactNode;
}

function MenuSection({ label, children }: MenuSectionProps) {
  return (
    <div className="mb-1">
      <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-400 dark:text-slate-500 px-4 pt-4 pb-2 m-0">
        {label}
      </p>
      {children}
    </div>
  );
}

// ---- Group Card ----
interface MenuGroupCardProps {
  group: SidebarItem;
  onNavigate: (href?: string) => void;
  index: number;
}

function MenuGroupCard({ group, onNavigate, index }: MenuGroupCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)" }}
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white text-[18px] flex-shrink-0">
          {group.icon}
        </div>
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 m-0 tracking-tight">
          {group.label}
        </h3>
      </div>

      {/* Card Body */}
      <div className="p-2">
        {group.children?.map((child, ci) =>
          child.children ? (
            // Sub-category ที่มี children
            <MenuSection key={ci} label={child.label}>
              {child.children.map((leaf, li) => (
                <MenuItemRow
                  key={li}
                  icon={leaf.icon}
                  label={leaf.label}
                  isNew={leaf.news}
                  onClick={() => onNavigate(leaf.href)}
                />
              ))}
            </MenuSection>
          ) : (
            // Direct leaf item
            <MenuItemRow
              key={ci}
              icon={child.icon}
              label={child.label}
              isNew={child.news}
              onClick={() => onNavigate(child.href)}
            />
          )
        )}
      </div>
    </motion.div>
  );
}

// ---- Empty State ----
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 m-0 mb-1">ไม่พบระบบที่ระบุ</p>
        <p className="text-[13px] text-slate-400 dark:text-slate-500 m-0">ลองค้นหาด้วยคำสำคัญอื่น หรือตรวจสอบตัวสะกด</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-[13px] font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/60 px-5 py-2.5 rounded-xl transition-colors border-none cursor-pointer"
      >
        แสดงเมนูทั้งหมด
      </button>
    </motion.div>
  );
}

// ---- Main Export ----
interface MainMenuGridProps {
  menuItems: SidebarItem[];
}

export default function MainMenuGrid({ menuItems }: MainMenuGridProps) {
  const router = useRouter();
  const { searchKeyword, clearSearch } = useMainStore();

  // Filter ตาม keyword
  const filteredGroups = useMemo(() => {
    if (!searchKeyword) return menuItems;
    const kw = searchKeyword.toLowerCase();

    return menuItems
      .map((group) => {
        const isGroupMatch = group.label.toLowerCase().includes(kw);
        const filteredChildren = group.children
          ?.map((child) => {
            const isChildMatch = child.label.toLowerCase().includes(kw);
            const filteredSubs = child.children?.filter((s) =>
              s.label.toLowerCase().includes(kw)
            );
            if (isChildMatch || (filteredSubs && filteredSubs.length > 0)) {
              return {
                ...child,
                children:
                  filteredSubs && filteredSubs.length > 0
                    ? filteredSubs
                    : child.children,
              };
            }
            return null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);

        if (isGroupMatch) return group;
        if (filteredChildren && filteredChildren.length > 0) {
          return { ...group, children: filteredChildren };
        }
        return null;
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [menuItems, searchKeyword]);

  // แบ่ง 3 คอลัมน์ masonry
  const columns = useMemo(() => {
    const col0 = filteredGroups.filter((_, i) => i % 3 === 0);
    const col1 = filteredGroups.filter((_, i) => i % 3 === 1);
    const col2 = filteredGroups.filter((_, i) => i % 3 === 2);
    return [col0, col1, col2];
  }, [filteredGroups]);

  // Navigation handler
  const handleNavigate = (href?: string) => {
    if (!href) return;
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  if (filteredGroups.length === 0) {
    return <EmptyState onReset={clearSearch} />;
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-5">
          {col.map((group, gi) => (
            <MenuGroupCard
              key={gi}
              group={group}
              onNavigate={handleNavigate}
              index={ci * 10 + gi}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
}
