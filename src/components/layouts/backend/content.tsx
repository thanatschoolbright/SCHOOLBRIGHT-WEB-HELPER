"use client";

import { ReactNode } from "react";

type SizeOption = "s" | "m" | "l" | "xl";

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  size?: SizeOption;
  width?: string;
  height?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  hidden?: boolean;
}

const sizeMap: Record<SizeOption, string> = {
  s: "w-64 p-4",
  m: "w-80 p-6",
  l: "w-[28rem] p-8",
  xl: "w-full p-10",
};

export default function ContentCard({
  children,
  className = "",
  title,
  size = "m",
  width,
  height,
  fullWidth = false,
  isLoading = false,
  hidden = false,
}: Readonly<ContentCardProps>) {
  const dimensionClass =
    width || height ? `${width || ""} ${height || ""}` : sizeMap[size];

  const fullSpanClass = fullWidth ? "col-span-full" : "";

  return (
    <div className="">
      <div
        className={`
        bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm
        rounded-2xl shadow-lg border
        border-white/30 dark:border-white/10
        transition-all duration-500 ease-in-out
        hover:bg-white/90 dark:hover:bg-gray-900/70
        text-sm
        ${hidden ? "hidden" : "show"}
        ${dimensionClass} ${fullSpanClass} ${className}
      `}
      >
        {/* Title */}
        {title && (
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        )}

        {/* Skeleton */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        ) : (
          <div className="text-gray-800 dark:text-gray-100">{children}</div>
        )}
      </div>
    </div>
  );
}
