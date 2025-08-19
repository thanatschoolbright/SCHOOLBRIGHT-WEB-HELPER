"use client";

import {ReactNode} from "react";

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

export default function MinimalButton({
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
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold
        hover:shadow-md   transition-all duration-500 ease-in-out
        focus:outline-none focus:ring-2  focus:ring-offset-2
        dark:hover:bg-orange-700 dark:focus:ring-offset-gray-800
        
        ${textSizeClass[textSize]} ${className}`}
        >
            {isLoading ? (
                <span className="w-20 h-4 bg-white/40 rounded animate-pulse"/>
            ) : (
                <>
                    {iconLeft && <span className="flex items-center">{iconLeft}</span>}
                    <span>{children}</span>
                    {iconRight && <span className="flex items-center">{iconRight}</span>}
                </>
            )}
        </button>
    );
}
