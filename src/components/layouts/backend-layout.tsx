import SidebarContent from "@components/layouts/backend/sidebar-component";
import MainHeader from "@components/layouts/backend/navbar";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";
import { useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import "@ant-design/v5-patch-for-react-19";
import { Breadcrumb } from "antd";
import Link from "next/link";
import Breadcrumbs from "../breadcrump/breadcrumb-component";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="relative min-h-screen bg-[#e8e6f3]/80 dark:bg-gray-900/80 text-gray-800 dark:text-gray-200 flex transition-colors duration-500 overflow-hidden">
      {/* 🌌 Background DNA Image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/background/bg-dna.png"
          alt="DNA background"
          className="w-full h-full object-cover "
          style={{ opacity: 1 }}
        />
      </div>

      {/* 🧭 Sidebar */}
      <aside
        className={`
          ${collapsed ? "w-2" : "w-64"}
          p-5 h-full ${
            collapsed ? "" : "ml-5"
          } mt-5 flex flex-col justify-between transition-all duration-250
          bg-white/40 dark:bg-gray-800/40
          hover:bg-white dark:hover:bg-gray-700
          backdrop-blur-md shadow-md
          rounded-3xl border border-white/20 dark:border-white/10
          relative
        `}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute -right-4 top-6 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all duration-300 ${
            collapsed ? "w-12 h-12 hover:scale-110" : "w-9 h-9 hover:scale-105"
          }`}
        >
          {collapsed ? (
            <IoIosArrowForward className="text-2xl" />
          ) : (
            <IoIosArrowBack className="text-lg" />
          )}
        </button>
        <div className={collapsed ? "hidden" : "block"}>
          <SidebarContent />
        </div>
        <div className={collapsed ? "hidden" : ""}>
          <DarkModeToggle />
        </div>
      </aside>

      {/* 📄 Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* 🔝 Sticky Header */}
        <div className="sticky top-0 z-50 px-5 py-4">
          <MainHeader />
        </div>

        {/* 🧭 Breadcrumb */}
        <div className="px-5 py-2">
          {/* 🧭 Breadcrumb */}
          <div className="px-5 py-2">
            <Breadcrumbs />
          </div>
        </div>

        {/* 🧩 Page Children */}
        <main className="flex-1 p-5 overflow-y-auto animate-fade-in-down">
          {children}
        </main>
      </div>
    </div>
  );
}
