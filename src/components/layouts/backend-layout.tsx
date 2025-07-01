import SidebarContent from "@components/layouts/backend/sidebar-component";
import MainHeader from "@components/layouts/backend/navbar";
import DarkModeToggle from "@components/toggle/dark-mode-toggle-component";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#e8e6f3]/80 dark:bg-gray-900/80 text-gray-800 dark:text-gray-200 flex transition-colors duration-500 overflow-hidden">
      {/* 🌌 Background DNA Image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/background/bg-dna.png"
          alt="DNA background"
          className="w-full h-full object-cover animate-[dnaFloat_10s_ease-in-out_infinite]"
          style={{ opacity: 1 }}
        />
      </div>

      {/* 🧭 Sidebar */}
      <aside
        className="w-64 p-5 h-full ml-5 mt-5 flex flex-col justify-between transition-all duration-500 
        bg-white/40 dark:bg-gray-800/40 
        hover:bg-white dark:hover:bg-gray-700 
        backdrop-blur-md shadow-md 
        rounded-3xl border border-white/20 dark:border-white/10"
      >
        <div>
          <SidebarContent />
        </div>
        <DarkModeToggle />
      </aside>

      {/* 📄 Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* 🔝 Sticky Header */}
        <div className="sticky top-0 z-50 bg-[#e8e6f3] dark:bg-gray-900 px-5 py-4">
          <MainHeader />
        </div>

        {/* 🧩 Page Children */}
        <main className="flex-1 p-5 overflow-y-auto animate-fade-in-down">
          {children}
        </main>
      </div>
    </div>
  );
}
