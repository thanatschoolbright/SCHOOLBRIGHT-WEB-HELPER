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
    <div className="relative h-full min-h-[100px] sm:min-h-[120px] rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-white/5 p-4 sm:p-5 flex flex-col justify-center overflow-hidden text-transparent">
      {/* shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <SkeletonPulse className="w-16 sm:w-24 h-3 sm:h-4" />
          <SkeletonPulse className="w-24 sm:w-32 h-6 sm:h-8" />
          <SkeletonPulse className="w-16 sm:w-20 h-2.5 sm:h-3" />
        </div>
        <SkeletonPulse className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl" />
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

  const accentBg = `${color}18`;

  return (
    <div
      className="group relative h-full min-h-[100px] sm:min-h-[120px] rounded-2xl border bg-white dark:bg-white/[0.03] overflow-hidden flex flex-col justify-center p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 cursor-default shadow-sm hover:shadow-md"
      style={{
        borderColor: `${color}30`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }}
      />

      {/* Background glow orb */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 sm:opacity-20 group-hover:opacity-30 sm:group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
        style={{ background: color }}
      />

      <div className="flex justify-between items-start gap-3 sm:gap-4">
        <div className="flex flex-col gap-1 z-10 min-w-0">
          {/* Title + Tooltip */}
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] sm:text-[13px] font-semibold leading-tight text-black/50 dark:text-white/45 tracking-wide uppercase truncate"
              style={{ letterSpacing: "0.02em" }}
            >
              {title}
            </span>
            {tooltip && (
              <div className="group/tip relative flex-shrink-0">
                <div
                  className="w-3.5 h-3.5 sm:w-4 h-4 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] cursor-help transition-colors duration-200"
                  style={{ color: `${color}B0`, background: accentBg }}
                >
                  ℹ
                </div>
                {/* Custom tooltip */}
                <div
                  className="pointer-events-none absolute left-0 top-6 z-50 w-max max-w-[150px] sm:max-w-[200px] rounded-lg px-2.5 py-1.5 text-[10px] sm:text-[11px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 shadow-xl"
                  style={{ background: color }}
                >
                  {tooltip}
                </div>
              </div>
            )}
          </div>

          {/* Value + Unit + Suffix */}
          <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-[24px] sm:text-[32px] font-bold leading-none tracking-tight text-black dark:text-white truncate">
              {value}
            </span>
            {(unit || suffix) && (
              <span className="text-[12px] sm:text-[14px] font-semibold text-black/40 dark:text-white/35 leading-none mb-0.5 sm:mb-1">
                {unit || suffix}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-[10px] sm:text-[12px] font-medium text-black/40 dark:text-white/35 leading-snug mt-0.5 sm:mt-1 animate-in fade-in slide-in-from-left-1 duration-500 line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </div>
          )}
        </div>

        {/* Icon on the right */}
        {icon && (
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 shadow-lg shadow-current/5"
            style={{ background: accentBg, color }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
