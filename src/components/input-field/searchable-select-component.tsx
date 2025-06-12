"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  hidden?: boolean;
}

export function SearchableSelectComponent({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  hidden = false,
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
        onChange(opt.value);
        setOpen(false);
        setSearch("");
      }
    }
  };

  // Display label for current value
  const currentLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className={`w-full ${hidden ? "hidden" : "bounce-once"}`} ref={ref}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={`relative cursor-pointer`}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className={`flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg`}
        >
          <span className="text-gray-800 dark:text-gray-200">
            {currentLabel}
          </span>
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
                    className={`px-4 py-2 cursor-pointer truncate ${
                      idx === highlighted
                        ? "bg-purple-100 dark:bg-purple-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${
                      value === opt.value
                        ? "font-semibold text-purple-600 dark:text-purple-400"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                    onMouseDown={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    onMouseEnter={() => setHighlighted(idx)}
                  >
                    {opt.label}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  No results
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
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
