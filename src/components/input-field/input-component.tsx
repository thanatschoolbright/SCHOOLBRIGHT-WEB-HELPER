import React, { useState } from "react";

interface InputComponentProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
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
      <div className="relative group">
        <input
          id={id}
          type={type}
          required={required}
          placeholder=" "
          className={`peer w-full px-4 pt-6 pb-2 border ${
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } rounded-xl ${
            props.disabled
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-transparent"
          } focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-transparent ${
            props.disabled ? "text-gray-400 dark:text-gray-500" : ""
          }`}
          {...props}
          onChange={handleChange}
        />
        <label
          htmlFor={id}
          className={`absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm font-extralight pointer-events-none transition-all duration-200 ease-in-out ${
            required
              ? "after:content-['*'] after:ml-1 after:text-red-500 after:font-thin"
              : ""
          } peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:dark:text-gray-500 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 dark:peer-focus:text-blue-400 ${
            props.disabled ? "text-gray-400 dark:text-gray-500" : ""
          }`}
          style={{ letterSpacing: "0.00em" }}
        >
          {label}
        </label>
      </div>
      {type === "file" && fileName && (
        <span className="text-xs text-gray-500 mt-1">{fileName}</span>
      )}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default InputComponent;
