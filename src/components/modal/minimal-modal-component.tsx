"use client";
import React, { useEffect, useState } from "react";

export default function MinimalModal({
  title,
  onClose,
  children,
  confirmMode = false,
  onConfirm,
  isOpen,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  confirmMode?: boolean;
  onConfirm?: () => void;
  isOpen?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true); // ควบคุม unmount

  useEffect(() => {
    if (isOpen === undefined) {
      const timer = setTimeout(() => setVisible(true), 10); // trigger เปิด
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isOpen === undefined) {
      setVisible(false); // ค่อยๆ หายไปก่อน
      setTimeout(() => {
        setShouldRender(false);
        onClose(); // แล้วค่อยปิดจริง
      }, 300); // ระยะเวลาเดียวกับ duration-300
    } else {
      onClose();
    }
  };

  if (isOpen === false || (!shouldRender && isOpen === undefined)) return null;

  const isVisible = isOpen === undefined ? visible : isOpen;
  const isRendered = isOpen === undefined ? shouldRender : isOpen;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center px-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-40" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal content */}
      <div
        className={`
          relative bg-white/95 dark:bg-gray-900/95 w-full max-w-4xl rounded-xl shadow-2xl shadow-purple-100/30 dark:shadow-purple-800/20 p-6
          transition-all duration-300 ${
            isVisible
              ? "opacity-100 scale-100 ease-out"
              : "opacity-0 scale-95 ease-in"
          }
        `}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-200">
          {title}
        </h2>
        <button
          onClick={handleClose}
          className="absolute top-3 right-4 text-gray-400 dark:text-gray-300 hover:text-black dark:hover:text-white text-2xl"
        >
          &times;
        </button>
        <div className="max-h-[75vh] overflow-y-auto space-y-4 ">
          {children}
        </div>
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
                handleClose();
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
