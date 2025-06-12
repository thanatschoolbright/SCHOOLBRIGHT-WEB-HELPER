export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left */}
      <div>
        <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">
          Dashboard
        </h1>
        <p className="text-sm text-gray-900 dark:text-gray-300">
          Mon, Nov 6, 2023 — Sun, Nov 12, 2023
        </p>
      </div>

      {/* Right - Total Balance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
        Total balance
        <span className="block text-lg text-right text-black dark:text-gray-200">
          $23,651
        </span>
      </div>
    </div>
  );
}
