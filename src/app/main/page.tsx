"use client";

import DashboardLayout from "@/components/layouts/backend-layout";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import MainHero from "./_components/main-hero";
import MainMenuGrid from "./_components/main-menu-grid";

export default function MainDashboardPage() {
  const sidebarMenuItems = useSidebarMenu();

  return (
    <DashboardLayout>
      <div className="px-2 py-4">
        {/* Hero section: heading + search */}
        <MainHero />

        {/* เมนูทั้งหมดแบบ 3 คอลัมน์ */}
        <MainMenuGrid menuItems={sidebarMenuItems} />
      </div>
    </DashboardLayout>
  );
}
