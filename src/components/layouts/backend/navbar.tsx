"use client";

import UserDropdown from "@components/layouts/backend/user-dropdown";

export default function MainHeader() {
  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-gradient-to-r from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl shadow-md hover:shadow-lg rounded-3xl border border-white/30 dark:border-gray-700 transition-all duration-500 animate-fade-in-down">
      {/* Left - Logo & Nav */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-1 text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
          SCHOOLBRIGHT
        </div>

        {/* Nav (optional) */}
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300 [&>button]:relative [&>button]:overflow-hidden [&>button]:after:absolute [&>button]:after:bottom-0 [&>button]:after:left-0 [&>button]:after:h-[2px] [&>button]:after:w-0 [&>button]:after:bg-orange-500 [&>button]:after:transition-all [&>button:hover:after]:w-full">
          {/*<button className="border-b-2 border-black pb-0.5">Dashboard</button>*/}
        </nav>
      </div>

      {/* Right - Utilities */}
      <div className="flex items-center gap-5 pr-2 [&>*]:transition-transform [&>*]:duration-300 [&>*:hover]:scale-110">
        {/* Notification */}
        {/* <button className="relative hover:text-orange-600 transition">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-0 right-0 bg-red-500 rounded-full w-2 h-2" />
        </button> */}

        {/* User */}
        <UserDropdown />
      </div>
    </header>
  );
}
