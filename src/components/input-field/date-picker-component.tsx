"use client";
import React from "react";
import { FiCalendar } from "react-icons/fi";
import { InputFieldComponent } from "./input-field-component";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  isLoading?: boolean;
  className?: string;
  hidden?: boolean;
}

export default function DatePickerComponent({
  label,
  value,
  onChange,
  isLoading = false,
  className = "",
  hidden = false,
}: DatePickerProps) {
  return (
    <div
      className={`space-y-1 ${className} ${
        hidden ? "hidden" : "show animate-pulse"
      }`}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {isLoading ? (
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      ) : (
        <InputFieldComponent
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // icon={<FiCalendar className="text-gray-400 dark:text-gray-500" />}
          placeholder="เลือกวันที่"
          className=" transition-shadow duration-200"
        />
      )}
    </div>
  );
}
