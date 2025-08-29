"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  hidden?: boolean;
  id?: string;
  name?: string;
  multiselect?: boolean; // <-- add this prop
  required?: boolean;
  error?: string;
  disabled?: boolean; // Optional prop to disable the select
}

export function SearchableSelectComponent({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  hidden = false,
  id,
  name,
  multiselect = false,
  required = false,
  error = "",
  disabled = false, // Optional prop to disable the select
}: Readonly<SearchableSelectProps>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filtered options
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation (optional basic support)
  const [highlighted, setHighlighted] = useState(0);
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      const opt = filtered[highlighted];
      if (opt) {
        if (multiselect) {
          handleMultiSelect(opt.value);
        } else {
          onChange(opt.value);
          setOpen(false);
          setSearch("");
        }
      }
    }
  };

  // For multiselect, value is string[]
  const isSelected = (val: string) => {
    if (multiselect) {
      return Array.isArray(value) && value.includes(val);
    }
    return value === val;
  };

  // For multiselect, display selected labels as chips
  const selectedLabels = multiselect
    ? options.filter((opt) => Array.isArray(value) && value.includes(opt.value))
    : [];

  // Handle select/deselect for multiselect
  const handleMultiSelect = (val: string) => {
    if (!Array.isArray(value)) {
      onChange([val]);
      setSearch("");
      return;
    }
    if (value.includes(val)) {
      // Remove
      const newVals = value.filter((v) => v !== val);
      onChange(newVals);
    } else {
      // Add
      const newVals = [...value, val];
      onChange(newVals);
    }
    setSearch("");
  };

  // Remove chip for multiselect
  const handleRemoveChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Array.isArray(value)) {
      onChange(value.filter((v) => v !== val));
    }
  };

  // Display label for current value (single select)
  const currentLabel = !multiselect
    ? options.find((opt) => opt.value === value)?.label || placeholder
    : selectedLabels.length > 0
    ? ""
    : placeholder;

  return (
    <div className={`w-full ${hidden ? "hidden" : "bounce-once"}`} ref={ref}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && (
            <span className="text-red-500 text-xs ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div
        className={`relative cursor-pointer`}
        onClick={() => setOpen((o) => !o)}
        tabIndex={0}
      >
        <div
          className={`flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[40px] flex-wrap gap-1`}
        >
          {multiselect ? (
            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
              {selectedLabels.length > 0 ? (
                selectedLabels.map((opt) => (
                  <span
                    key={opt.value}
                    className="flex items-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full px-2 py-0.5 text-xs font-medium mr-1"
                  >
                    {opt.label}
                    <button
                      type="button"
                      className="ml-1 text-purple-500 hover:text-purple-800 dark:hover:text-purple-200 focus:outline-none"
                      onClick={(e) => handleRemoveChip(opt.value, e)}
                      tabIndex={-1}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {placeholder}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-800 dark:text-gray-200 truncate">
              {currentLabel}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-500 transform transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
            <input
              id={id}
              name={name}
              disabled={disabled}
              type="text"
              className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-700 outline-none bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            <ul
              className="max-h-48 overflow-auto"
              onMouseLeave={() => setHighlighted(-1)}
            >
              {filtered.length > 0 ? (
                filtered.map((opt, idx) => (
                  <li
                    key={opt.value}
                    className={`px-4 py-2 cursor-pointer truncate flex items-center ${
                      idx === highlighted
                        ? "bg-purple-100 dark:bg-purple-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${
                      isSelected(opt.value)
                        ? "font-semibold text-purple-600 dark:text-purple-400"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                    onMouseDown={() => {
                      if (multiselect) {
                        handleMultiSelect(opt.value);
                      } else {
                        onChange(opt.value);
                        setOpen(false);
                        setSearch("");
                      }
                    }}
                    onMouseEnter={() => setHighlighted(idx)}
                  >
                    {multiselect && (
                      <input
                        type="checkbox"
                        checked={isSelected(opt.value)}
                        readOnly
                        className="mr-2 accent-purple-600"
                        tabIndex={-1}
                      />
                    )}
                    {opt.label}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  No results
                </li>
              )}
            </ul>
            {multiselect && (
              <div className="flex justify-end p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

/* Add bounce-once animation */
<style jsx global>{`
  @keyframes bounce-once {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-25%);
    }
  }

  .bounce-once {
    animation: bounce-once 1s ease-out;
  }
`}</style>;
