// src/components/InputComponent.tsx
import React, { useState } from "react";

// กำหนด type ของ props
interface InputComponentProps {
  label: string;
  id: string;
  name?: string; // Add the name property
  value?: any; // Add the value property for controlled components
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void; // Define onChange explicitly
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textAlign?: "left" | "center" | "right";
  type: string; // Change type to string to be more specific
  disabled?: boolean; // Make disabled optional
  placeholder?: string; // Add placeholder to the interface
}

const InputComponent: React.FC<InputComponentProps> = ({
  label,
  id,
  type,
  error,
  required = false,
  leftIcon,
  rightIcon,
  textAlign,
  ...props
}) => {
  const [fileName, setFileName] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (
      type === "file" &&
      "files" in e.target &&
      e.target.files &&
      e.target.files.length > 0
    ) {
      setFileName(e.target.files[0].name);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const baseInputClasses = `
    peer
    w-full
    rounded-lg
    border
    border-gray-300
    // 
    // dark:bg-gray-900
    dark:border-gray-700
    text-gray-900
    dark:text-gray-100
    placeholder-transparent
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-500
    focus:border-indigo-500
    transition
    duration-300
    ease-in-out
    shadow-sm
    hover:shadow-md
    disabled:bg-gray-100
    disabled:text-gray-400
    disabled:cursor-not-allowed
  `;

  const inputPaddingLeft = leftIcon ? "pl-12" : "pl-4";
  const inputPaddingRight = rightIcon ? "pr-12" : "pr-4";

  const textAlignClass =
    textAlign === "right"
      ? "text-right"
      : textAlign === "center"
      ? "text-center"
      : "text-left";

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        {type === "textarea" ? (
          <textarea
            id={id}
            required={required}
            placeholder=" "
            className={`${baseInputClasses} ${inputPaddingLeft} ${inputPaddingRight} pt-6 pb-2 resize-none ${textAlignClass} min-h-[6rem]`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            onChange={handleChange}
          />
        ) : (
          <input
            id={id}
            type={type}
            required={required}
            placeholder=" "
            className={`${baseInputClasses} ${inputPaddingLeft} ${inputPaddingRight} pt-6 pb-2 ${textAlignClass}`}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            onChange={handleChange}
          />
        )}

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 pointer-events-none">
            {rightIcon}
          </div>
        )}

        <label
          htmlFor={id}
          className={`
            absolute
            ${leftIcon ? "left-9" : "left-3 "}
            top-3
            text-gray-500
            dark:text-gray-400
            text-xs
            font-medium
            px-1
            pointer-events-none
            transition-all
            duration-300
            ease-in-out
            peer-placeholder-shown:top-6
            peer-placeholder-shown:text-base
            peer-placeholder-shown:text-gray-400
            peer-placeholder-shown:dark:text-gray-500
            peer-focus:top-3
            peer-focus:text-indigo-600
            peer-focus:dark:text-indigo-400
            peer-focus:text-sm

            ${
              required
                ? "after:content-['*'] after:ml-0.5 after:text-red-500 after:font-normal"
                : ""
            }
            ${
              props.disabled
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : ""
            }
          `}
        >
          {label}
        </label>
      </div>

      {type === "file" && fileName && (
        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
          {fileName}
        </span>
      )}

      {error && (
        <span className="mt-1 text-xs text-red-600 dark:text-red-500 font-semibold">
          {error}
        </span>
      )}
    </div>
  );
};

export default InputComponent;
