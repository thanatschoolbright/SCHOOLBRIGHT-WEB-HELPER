"use client";

import { type Variants, motion } from "framer-motion";
import { useMainStore } from "../_state/main-store";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, duration: 0.5 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// SVG Icon Search
function IconSearch() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function MainHero() {
  const { searchKeyword, setSearchKeyword, clearSearch } = useMainStore();

  return (
    <motion.div
      className="mb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Badge */}
      <motion.div variants={itemVariants} className="mb-6">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          System Navigation Hub
        </span>
      </motion.div>

      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-4">
        <h1
          className="font-bold text-slate-900 dark:text-white m-0 leading-tight"
          style={{ fontSize: "clamp(36px, 4vw, 56px)", letterSpacing: "-0.03em" }}
        >
          Web Helper{" "}
          <span className="text-orange-500">Central</span>
        </h1>
      </motion.div>

      {/* Subtext */}
      <motion.div variants={itemVariants} className="mb-10">
        <p className="text-[16px] text-slate-500 dark:text-slate-400 m-0 max-w-[500px] leading-relaxed">
          แหล่งรวมเครื่องมือและระบบจัดการทั้งหมดที่คุณต้องการ
          เข้าถึงทุกฟีเจอร์ได้ในที่เดียว
        </p>
      </motion.div>

      {/* Search Box */}
      <motion.div variants={itemVariants} className="max-w-[520px]">
        <div className="group flex items-center gap-3 h-[54px] px-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-all duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] dark:focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]">
          <span className="text-slate-400 flex-shrink-0 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="ค้นหาระบบที่ต้องการ..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 font-medium"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors flex-shrink-0"
            >
              <IconX />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
