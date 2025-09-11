"use client";

import { ReactNode } from "react";

interface MinimalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  textSize?: "sm" | "base" | "lg" | "xl";
  className?: string;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function RoundedButton({
  children,
  onClick,
  iconLeft,
  iconRight,
  textSize = "base",
  className = "",
  isLoading = false,
  type = "button",
  disabled = false,
}: Readonly<MinimalButtonProps>) {
  const textSizeClass = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  return (
    <div className="p-1">
      <button
        type={type}
        disabled={disabled || isLoading} // ✅ ปิดการใช้งานปุ่มเมื่อกำลังโหลด
        onClick={onClick}
        className={`
        flex items-center gap-2 px-6 py-3 rounded-[999px] text-white font-semibold shadow-sm
        transition-all duration-300 ease-in-out
        hover:scale-105
        focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-opacity-50
        dark:focus:ring-offset-gray-900
        ${textSizeClass[textSize]} ${className}
        ${
          disabled || isLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }
      `}
      >
        {isLoading ? (
          <span className="w-20 h-4 bg-white/40 rounded-full animate-pulse" />
        ) : (
          <>
            {iconLeft && <span className="flex items-center">{iconLeft}</span>}
            <span>{children}</span>
            {iconRight && (
              <span className="flex items-center">{iconRight}</span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
