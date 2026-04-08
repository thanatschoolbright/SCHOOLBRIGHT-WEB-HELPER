"use client";

// Footer ของ Backend Layout — minimal และ enterprise
export default function BackendFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-[1] w-full px-10 py-5 border-t border-slate-100 dark:border-white/5 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Branding */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "#f97316" }}
          >
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </div>
          <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
            SchoolBright
          </span>
          <span className="text-slate-200 dark:text-white/10">·</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Web Helper Portal
          </span>
        </div>

        {/* Right: Meta */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <span>© {year} SchoolBright Co., Ltd.</span>
          <span className="w-px h-3 bg-slate-200 dark:bg-white/10" />
          <span className="font-mono">v2.0.0</span>
          <span className="w-px h-3 bg-slate-200 dark:bg-white/10" />
          <span>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
}
