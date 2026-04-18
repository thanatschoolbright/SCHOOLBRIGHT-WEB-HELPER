"use client";

import React from "react";

export interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
  isLoading?: boolean;
  suffix?: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-black/8 dark:bg-white/8 ${className}`}
    />
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="relative h-full min-h-[90px] sm:min-h-[110px] rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/5 p-4 sm:p-5 flex flex-col justify-center overflow-hidden">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2.5">
          <SkeletonPulse className="w-16 h-3" />
          <SkeletonPulse className="w-24 h-6" />
          <SkeletonPulse className="w-16 h-2.5" />
        </div>
        <SkeletonPulse className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  color = "#6366F1",
  tooltip,
  isLoading = false,
  suffix,
}) => {
  if (isLoading) return <SummaryCardSkeleton />;

  return (
    <div className="group relative h-full min-h-[90px] sm:min-h-[110px] rounded-xl border-none bg-white dark:bg-[#1E293B] overflow-hidden flex flex-col justify-center p-4 sm:p-5 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5 cursor-default shadow-sm border border-[#F1F5F9] dark:border-[#334155]">
      {/* Accent Top Bar - Dynamic Branding */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-80 group-hover:h-[4px] group-hover:opacity-100 transition-all duration-300"
        style={{ background: color }}
      />

      <div className="flex justify-between items-center gap-4 relative z-10">
        <div className="flex flex-col gap-1 min-w-0">
          {/* Title + Tooltip */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[11px] sm:text-[12px] font-bold leading-tight text-[#64748B] dark:text-[#CBD5E1] tracking-widest uppercase truncate"
              style={{ letterSpacing: "0.08em" }}
            >
              {title}
            </span>
            {tooltip && (
              <div className="group/tip relative flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] cursor-help text-[#64748B]/30 dark:text-[#CBD5E1]/30 hover:text-[#64748B]/60 dark:hover:text-[#CBD5E1]/60 transition-colors">
                  ℹ
                </div>
                {/* Premium Tooltip */}
                <div
                  className="pointer-events-none absolute left-0 top-5 z-50 w-max max-w-[150px] sm:max-w-[200px] rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 shadow-2xl"
                  style={{ background: "#0F172A" }}
                >
                  {tooltip}
                </div>
              </div>
            )}
          </div>

          {/* Value + Unit + Suffix */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[24px] sm:text-[30px] font-bold leading-none tracking-tight text-[#0F172A] dark:text-[#FFFFFF] truncate">
              {value}
            </span>
            {(unit || suffix) && (
              <span className="text-[12px] sm:text-[13px] font-bold text-[#64748B]/60 dark:text-[#CBD5E1]/40 leading-none">
                {unit || suffix}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-[11px] font-medium text-[#64748B]/70 dark:text-[#CBD5E1]/50 leading-snug mt-1.5 line-clamp-1 sm:line-clamp-none animate-in fade-in slide-in-from-left-2 duration-700">
              {subtitle}
            </div>
          )}
        </div>

        {/* Solid Icon - Adjusted scaling */}
        {icon && (
          <div
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-all duration-500 shadow-inner group-hover:scale-105"
            style={{
              backgroundColor: `${color}08`,
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Subtle Background Glow on Hover */}
      <div
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
        style={{ background: color }}
      />
    </div>
  );
};

export default SummaryCard;
