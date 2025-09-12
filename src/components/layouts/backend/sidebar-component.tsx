"use client";

import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  IoIosArrowForward,
  IoIosArrowDown,
  IoIosArrowUp,
} from "react-icons/io";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SidebarContent() {
  const menu: {
    label: string;
    icon: JSX.Element;
    children?: { label: string; href: string; news?: boolean }[];
    href?: string;
    tag?: string;
  }[] = useSidebarMenu();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    menu.forEach((item) => {
      if (item.children?.some((child) => child.href === pathname)) {
        setOpenKey(item.label);
      }
    });
  }, [pathname]);

  const submenuVariants = {
    open: {
      opacity: 1,
      height: "auto", // Keep 'auto' for correct animation
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        staggerChildren: 0.05,
      },
    },
    closed: {
      opacity: 0,
      height: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
      },
    },
  };

  const childVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  return (
    <div
      className="flex flex-col h-full justify-between text-sm font-medium transition-all duration-500 ease-in-out
        animate-fade-in-down overflow-visible"
    >
      <div>
        <div className="mb-6 text-2xl font-extrabold text-[#ff7b00] dark:text-orange-400">
          เมนู
        </div>

        <nav className="space-y-2">
          {menu.map((item) => {
            if (item.children) {
              const isOpen = openKey === item.label;
              return (
                <div key={item.label}>
                  <motion.button
                    onClick={() => setOpenKey(isOpen ? null : item.label)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left text-gray-700 dark:text-gray-200 hover:ring-2 hover:ring-orange-300 dark:hover:ring-orange-500 transition border-b border-gray-200 dark:border-gray-700"
                    whileHover={{ scale: 1.03, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {isOpen ? (
                      <IoIosArrowUp className="text-sm text-gray-500" />
                    ) : (
                      <IoIosArrowDown className="text-sm text-gray-500" />
                    )}
                  </motion.button>

                  <motion.div
                    className="ml-8 mt-2 flex flex-col space-y-1 overflow-hidden"
                    initial="closed"
                    animate={isOpen ? "open" : "closed"}
                    exit="closed"
                    variants={submenuVariants as any}
                  >
                    {item.children.map((child) => {
                      const isActive = child.href === pathname;
                      return (
                        <motion.div
                          key={child.label}
                          variants={childVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                        >
                          <Link
                            href={child.href!}
                            className={
                              `flex items-center gap-2 w-full px-4 py-2 rounded-lg transition-colors duration-200 ` +
                              (isActive
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 font-semibold border-l-4 border-orange-500 pl-3"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800")
                            }
                          >
                            <span
                              className={
                                "w-2 h-2 rounded-full flex-shrink-0 " +
                                (isActive ? "bg-orange-500" : "bg-orange-300")
                              }
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span>{child.label}</span>
                              {child.news && (
                                <motion.span
                                  className="ml-2 text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15,
                                  }}
                                >
                                  NEW
                                </motion.span>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              );
            } else {
              return (
                <Link
                  href={
                    "href" in item && typeof item.href === "string"
                      ? item.href
                      : "#"
                  }
                  key={item.label}
                  className={
                    `w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-colors hover:ring-2 hover:ring-orange-300 dark:hover:ring-orange-500 border-b border-gray-200 dark:border-gray-700 ` +
                    ("href" in item && item.href === pathname
                      ? "bg-black text-white dark:bg-orange-500"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800")
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.tag && (
                    <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  )}
                </Link>
              );
            }
          })}
        </nav>
      </div>

      {/* AI Assistant Card */}
      <div className="hidden mt-8 p-4 bg-purple-100 dark:bg-purple-900 rounded-2xl text-sm relative overflow-hidden text-gray-700 dark:text-gray-200">
        <h3 className="font-bold mb-1">AI Assistant</h3>
        <p className="text-xs mb-2">
          Technology that helps people complete tasks faster and more
          efficiently.
        </p>
        <div className="absolute -bottom-3 -left-3 transform rotate-12 text-purple-400 text-5xl opacity-20">
          <IoIosArrowForward />
        </div>
      </div>
    </div>
  );
}
