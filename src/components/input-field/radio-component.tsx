"use client";

import {Radio, Skeleton} from "antd";
import React from "react";

interface RadioOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface RadioComponentProps {
    label?: string;
    id?: string;
    options: RadioOption[];
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    direction?: "horizontal" | "vertical";
    size?: "small" | "middle" | "large";
}

/**
 * Component Radio Button Group พร้อมรองรับ Dark Mode
 * @param props - Properties ของ Radio Component
 */
export const RadioComponent: React.FC<RadioComponentProps> = ({
                                                                  label,
                                                                  id,
                                                                  options,
                                                                  value,
                                                                  onChange,
                                                                  error,
                                                                  required = false,
                                                                  disabled = false,
                                                                  loading = false,
                                                                  direction = "horizontal",
                                                                  size = "middle",
                                                              }) => {
    //** จัดการการเปลี่ยนค่า */
    const handleChange = (e: any) => {
        onChange?.(e.target.value);
    };

    //** แสดง Skeleton ขณะโหลด */
    if (loading) {
        return (
            <div>
                {label && (
                    <div style={{marginBottom: 8}}>
                        <Skeleton.Input
                            active
                            size="small"
                            style={{width: 100, height: 20}}
                        />
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        flexDirection:
                            direction === "vertical" ? "column" : "row",
                    }}
                >
                    {Array.from({length: options.length || 3}).map((_, index) => (
                        <Skeleton.Input
                            key={index}
                            active
                            size="small"
                            style={{width: 80, height: 24}}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Label ของ Radio Group */}
            {label && (
                <div style={{marginBottom: 8}}>
                    <label htmlFor={id} style={{fontWeight: 500}}>
                        {label}
                        {required && (
                            <span style={{color: "#ff4d4f", marginLeft: 4}}>*</span>
                        )}
                    </label>
                </div>
            )}

            {/* Radio Group */}
            <Radio.Group
                id={id}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                size={size}
                style={{
                    display: "flex",
                    flexDirection:
                        direction === "vertical" ? "column" : "row",
                    gap: direction === "vertical" ? 8 : 16,
                }}
            >
                {options.map((option) => (
                    <Radio
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled || disabled}
                    >
                        {option.label}
                    </Radio>
                ))}
            </Radio.Group>

            {/* ข้อความ Error */}
            {error && (
                <div style={{marginTop: 4, color: "#ff4d4f", fontSize: 14}}>
                    {error}
                </div>
            )}
        </div>
    );
};
