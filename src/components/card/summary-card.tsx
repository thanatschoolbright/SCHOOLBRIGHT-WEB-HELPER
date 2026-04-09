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
  return <div className={`animate-pulse rounded-lg bg-black/8 dark:bg-white/8 ${className}`} />;
}

function SummaryCardSkeleton() {
  return (
    <div className="relative h-full min-h-[160px] rounded-3xl border border-black/8 dark:border-white/8 bg-white dark:bg-white/5 p-7 flex flex-col justify-between overflow-hidden">
      {/* shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-center gap-3">
        <SkeletonPulse className="w-10 h-10 rounded-xl" />
        <SkeletonPulse className="w-32 h-4" />
      </div>
      <div className="flex flex-col gap-2 mt-6">
        <SkeletonPulse className="w-44 h-10" />
        <SkeletonPulse className="w-24 h-3.5" />
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
  const accentGlow = `${color}28`;

  return (
    <div
      className="group relative h-full min-h-[160px] rounded-3xl border bg-white dark:bg-white/[0.03] overflow-hidden flex flex-col justify-between p-7 transition-all duration-300 ease-out hover:-translate-y-1 cursor-default"
      style={{
        borderColor: `${color}30`,
        boxShadow: `0 1px 3px ${accentGlow}, 0 0 0 1px ${color}10`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 16px 40px -12px ${accentGlow}, 0 0 0 1px ${color}40`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 1px 3px ${accentGlow}, 0 0 0 1px ${color}10`;
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }}
      />

      {/* Background glow orb */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
        style={{ background: accentBg }}
      />

      {/* ── Top: Icon + Title + Tooltip ── */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              style={{ background: accentBg, color }}
            >
              {icon}
            </div>
          )}
          <span
            className="text-[14px] font-semibold leading-snug text-black/50 dark:text-white/45 tracking-wide uppercase"
            style={{ letterSpacing: "0.04em" }}
          >
            {title}
          </span>
        </div>

        {tooltip && (
          <div className="group/tip relative flex-shrink-0 mt-0.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] cursor-help transition-colors duration-200"
              style={{ color: `${color}80`, background: accentBg }}
            >
              ℹ
            </div>
            {/* Custom tooltip */}
            <div className="pointer-events-none absolute right-0 top-8 z-50 w-max max-w-[200px] rounded-xl px-3 py-2 text-[11px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 shadow-xl"
              style={{ background: color }}>
              {tooltip}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: Value + Unit + Subtitle ── */}
      <div className="relative flex flex-col gap-1.5 mt-5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-[52px] font-black leading-none tracking-tight text-black dark:text-white"
            style={{ letterSpacing: "-2px" }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[18px] font-bold text-black/40 dark:text-white/35 leading-none">
              {unit}
            </span>
          )}
          {suffix && (
            <span className="text-[18px] font-bold text-black/40 dark:text-white/35 leading-none">
              {suffix}
            </span>
          )}
        </div>

        {subtitle && (
          <div className="text-[13px] font-medium text-black/40 dark:text-white/35 leading-snug">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
