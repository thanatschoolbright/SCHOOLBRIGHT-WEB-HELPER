"use client";
import React, { useEffect, useState } from "react";

export default function MinimalModal({
  title,
  onClose,
  children,
  confirmMode = false,
  onConfirm,
  isOpen = false,
  width,
  height,
}: Readonly<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  confirmMode?: boolean;
  onConfirm?: () => void;
  isOpen?: boolean;
  width?: string;
  height?: string;
}>) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else if (!isOpen && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center px-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-40" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={`
          relative bg-white dark:bg-gray-900 w-full max-w-4xl rounded-xl shadow-2xl p-6
          transform transition-all duration-300 ease-out
          ${isOpen ? "animate-modal-bounce" : "animate-modal-fadeout"}
        `}
        style={{
          width: width || undefined,
          height: height || undefined,
        }}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-200">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 dark:text-gray-300 hover:text-black dark:hover:text-white text-2xl"
        >
          &times;
        </button>
        <div className="max-h-[75vh] overflow-y-auto space-y-4">{children}</div>
        {confirmMode && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-300"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
