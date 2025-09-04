import React, { useState } from "react";

interface InputComponentProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputComponent: React.FC<InputComponentProps> = ({
  label,
  id,
  type = "text",
  error,
  required = false,
  leftIcon,
  rightIcon,
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
    <div className="flex flex-col gap-1 w-full px-1">
      {/* Label อยู่ด้านบน input */}
      <label
        htmlFor={id}
        className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
          required ? "after:content-['*'] after:ml-1 after:text-red-500" : ""
        }`}
      >
        {label}
      </label>

      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          type={type}
          required={required}
          className={`w-full rounded-full border ${
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } py-2 px-4 ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
          focus:outline-none focus:ring-2 focus:ring-purple-500`}
          {...props}
          onChange={handleChange}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>

      {type === "file" && fileName && (
        <span className="text-xs text-gray-500 mt-1">{fileName}</span>
      )}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default InputComponent;
