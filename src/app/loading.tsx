import React from "react";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"></div>
        
        {/* Inner Logo Placeholder */}
        <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/30">
          <div className="h-6 w-6 animate-pulse rounded-md bg-orange-500/50"></div>
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 animate-pulse">
           SchoolBright Helper
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          กำลังเตรียมความพร้อมของระบบ...
        </p>
      </div>
    </div>
  );
}
