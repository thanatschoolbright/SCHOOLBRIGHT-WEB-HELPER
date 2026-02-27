"use client";
import { useState, InputHTMLAttributes, ReactNode } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface InputFieldComponentProps
  extends InputHTMLAttributes<HTMLInputElement> {
  /** ป้ายชื่อฟิลด์ */
  label?: string;
  /** ข้อความ error */
  error?: string;
  /** hint ด้านล่าง (เช่น ลิงก์ "Forgot?") */
  hint?: ReactNode;
  /** icon ด้านซ้าย กำหนดเองได้ หรือไม่ต้องใส่ก็ได้ */
  icon?: ReactNode;
  /** จะโชว์ปุ่ม toggle เฉพาะเมื่อเป็น password input */
  showToggle?: boolean;
  /** className */
  className?: string;
  /** ประเภทของ input */
  type?: string;
  /** กำหนดให้ฟิลด์นี้เป็นฟิลด์ที่ต้องกรอก */
  required?: boolean;
}

export function InputFieldComponent({
  label,
  error,
  hint,
  icon,
  showToggle = false,
  className = "",
  type = "text",
  required = false,
  ...rest
}: InputFieldComponentProps) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);

  const baseClasses =
    "w-full flex items-center px-4 py-2 rounded-lg border transition-colors";
  const normalBorder = "border-gray-300 dark:border-gray-600";
  const focusBorder =
    "focus-within:border-purple-500 dark:focus-within:border-purple-400";
  const errorBorder = "border-red-500";
  const bg = " dark:bg-gray-800";
  const text = "text-gray-900 dark:text-gray-100";
  const placeholder = "placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium ${text}`}>
          {label}
          {/* แสดง required  */}
          {required && (
            <span className="text-red-500 text-xs ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* input field */}

      <div
        className={[
          baseClasses,
          bg,
          text,
          placeholder,
          error ? errorBorder : normalBorder,
          !error && focusBorder,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* แสดง icon ถ้ามี */}
        {icon && <span className="flex-shrink-0 mr-2">{icon}</span>}

        <input
          type={isPassword && showToggle ? (show ? "text" : "password") : type}
          className="flex-1 bg-transparent outline-none leading-tight"
          {...rest}
        />

        {/* ปุ่ม toggle เฉพาะกรณี showToggle ถูกเปิดไว้ */}
        {isPassword && showToggle && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="ml-2 text-gray-500 dark:text-gray-400"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>

      <div className="flex justify-between items-center">
        {hint && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>
        )}
        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>
    </div>
  );
}
