import React from "react";

interface RadioOption {
    label: string;
    value: string;
}

interface RadioComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    options: RadioOption[];
    error?: string;
    required?: boolean;
    name: string;
}

const RadioComponent: React.FC<RadioComponentProps> = ({
                                                           label,
                                                           id,
                                                           options,
                                                           error,
                                                           required = false,
                                                           name,
                                                           ...props
                                                       }) => {
    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor={id}
                className="text-base font-bold text-black flex items-center gap-1 mb-1"
                style={{letterSpacing: "0.02em"}}
            >
                {label}
                {required && (
                    <span className="text-red-500 text-base font-bold ml-1" aria-hidden="true">
            *
          </span>
                )}
            </label>

            <div className="flex flex-col gap-2">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            className={`accent-blue-600 w-4 h-4`}
                            required={required}
                            {...props}
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>

            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};

export default RadioComponent;