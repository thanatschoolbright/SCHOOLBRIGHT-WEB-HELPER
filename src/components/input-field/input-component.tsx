import React, { useState } from "react";

interface InputComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  required?: boolean; // 🟥 เพิ่ม required prop
}

const InputComponent: React.FC<InputComponentProps> = ({
  label,
  id,
  type,
  error,
  required = false,
  ...props
}) => {
  const [fileName, setFileName] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "file" && e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-base font-bold text-black flex items-center gap-1 mb-1"
        style={{
          letterSpacing: "0.02em",
        }}
      >
        {label}
        {required && (
          <span
            className="text-red-500 text-base font-bold ml-1"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className={`w-full px-4 py-2 border ${
          error
            ? "border-red-500"
            : "border-gray-300 dark:border-gray-600"
        } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white`}
        {...props}
        onChange={handleChange}
      />
      {type === "file" && fileName && (
        <span className="text-xs text-gray-500 mt-1">{fileName}</span>
      )}
      {error && (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      )}
    </div>
  );
};

export default InputComponent;