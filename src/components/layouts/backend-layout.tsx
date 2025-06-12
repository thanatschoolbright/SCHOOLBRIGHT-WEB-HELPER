import SidebarContent from "@components/layouts/backend/sidebar-component";
import MainHeader from "@components/layouts/backend/navbar";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#e8e6f3] dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex transition-colors duration-500 ">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 rounded-r-3xl shadow-lg p-6 flex flex-col justify-between transition-colors duration-500">
        <div>
          <SidebarContent />
        </div>
        <DarkModeToggle />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* ✅ MainHeader ลอยด้านบน */}
        <div className="sticky top-0 z-50 bg-[#e8e6f3] dark:bg-gray-900 px-5 py-4">
          <MainHeader />
        </div>

        {/* ✅ Children content อยู่ด้านล่าง */}
        <main className="flex-1 p-5 overflow-y-auto animate-fade-in-down">
          {children}
        </main>
      </div>
    </div>
  );
}
