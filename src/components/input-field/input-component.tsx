// src/components/InputComponent.tsx
import React, { useState } from "react";

// กำหนด type ของ props
interface InputComponentProps
  extends React.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textAlign?: "left" | "center" | "right";
  type: any;
  disabled: boolean;
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

  return (
    <div className="flex flex-col gap-1 items-center w-full">
      <div className="relative w-full group overflow-visible">
        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-1 transition-colors duration-200 peer-focus:text-purple-600 peer-focus:dark:text-purple-400 ">
              {leftIcon}
            </div>
          )}
          {type === "textarea" ? (
            <textarea
              id={id}
              required={required}
              placeholder=" "
              className={`
                peer w-full px-4 pt-5 pb-3 border border-2 rounded-md
                ${
                  error
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${
                  props.disabled
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800"
                }
                text-gray-900 dark:text-gray-100 placeholder-transparent transition-all duration-300 ease-in-out
                focus:outline-none focus:border-purple-500
                ${leftIcon ? "pl-10" : ""}
                ${rightIcon ? "pr-10" : ""}
                ${
                  textAlign === "right"
                    ? "text-right"
                    : textAlign === "center"
                    ? "text-center"
                    : "text-left"
                }
              `}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
              onChange={handleChange}
            />
          ) : (
            <input
              id={id}
              type={type}
              required={required}
              placeholder=" "
              className={`
                peer w-full px-4 pt-5 pb-3 border border-2 rounded-md
                ${
                  error
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${
                  props.disabled
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800"
                }
                text-gray-900 dark:text-gray-100 placeholder-transparent transition-all duration-300 ease-in-out
                focus:outline-none focus:border-purple-500
                ${leftIcon ? "pl-10" : ""}
                ${rightIcon ? "pr-[4rem]" : ""}
                ${
                  textAlign === "right"
                    ? "text-right"
                    : textAlign === "center"
                    ? "text-center"
                    : "text-left"
                }
              `}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
              onChange={handleChange}
            />
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200 peer-focus:text-purple-600 peer-focus:dark:text-purple-400">
              {rightIcon}
            </div>
          )}
        </div>
        <label
          htmlFor={id}
          className={`
            absolute -top-2 left-3 px-1 text-gray-500 dark:text-gray-400 text-sm font-extralight pointer-events-none
            transition-all duration-300 ease-in-out
            peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:dark:text-gray-500
            peer-focus:-top-2 peer-focus:left-3 peer-focus:text-purple-600 peer-focus:dark:text-purple-400
            ${
              required
                ? "after:content-['*'] after:ml-1 after:text-red-500 after:font-thin"
                : ""
            }
            ${
              props.disabled
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-800"
            }
          `}
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
