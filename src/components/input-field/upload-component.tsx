"use client";

import React, { ChangeEvent, useState } from "react";
import { FiUpload } from "react-icons/fi";

interface UploadComponentProps {
  label?: string;
  id?: string;
  name?: string;
  accept?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  value?: string;
  error?: string;
}

const UploadComponent: React.FC<UploadComponentProps> = ({
  label = "อัปโหลดไฟล์",
  id = "upload-file",
  name,
  accept,
  onChange,
  className = "",
  disabled = false,
  value,
  error = "",
}) => {
  const [fileName, setFileName] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name); // ⬅️ อัปเดตชื่อไฟล์
    }

    if (onChange) {
      onChange(e); // ⬅️ call callback ไปยัง parent component ด้วย
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
        >
          {label}
        </label>
      )}
      <label
        htmlFor={id}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer
          bg-blue-600 hover:bg-blue-700 text-white font-semibold
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
        tabIndex={0}
      >
        <FiUpload className="w-5 h-5" />
        <span>{label}</span>
        <input
          id={id}
          name={name}
          type="file"
          accept={accept}
          onChange={handleChange} // 🔁 เปลี่ยนเป็น handleChange
          className="hidden"
          disabled={disabled}
          value={value}
        />
      </label>

      {/* 👇 แสดงชื่อไฟล์ด้านล่าง */}
      {fileName && (
         <span className="text-xs text-gray-500 mt-1">ไฟล์ที่อัปโหลด: {fileName}</span>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default UploadComponent;