"use client";

import {Select, Skeleton} from "antd";
import React from "react";

interface OptionType {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: OptionType[];
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    label?: string;
    hidden?: boolean;
    id?: string;
    name?: string;
    multiselect?: boolean;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    loading?: boolean;
    allowClear?: boolean;
    showSearch?: boolean;
}

/**
 * Component Select ที่สามารถค้นหาได้ พร้อมรองรับ Dark Mode
 * @param props - Properties ของ Select
 */
export function SearchableSelectComponent({
                                              options,
                                              value,
                                              onChange,
                                              placeholder = "เลือก...",
                                              label,
                                              hidden = false,
                                              id,
                                              name,
                                              multiselect = false,
                                              required = false,
                                              error = "",
                                              disabled = false,
                                              loading = false,
                                              allowClear = true,
                                              showSearch = true,
                                          }: Readonly<SearchableSelectProps>) {
    //** ซ่อน Component หากต้องการ */
    if (hidden) {
        return null;
    }

    //** แสดง Skeleton ขณะโหลดข้อมูล */
    if (loading && !options.length) {
        return (
            <div>
                {label && (
                    <label className="block text-sm font-medium mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <Skeleton.Input active size="large" style={{width: "100%"}}/>
            </div>
        );
    }

    //** จัดการการเปลี่ยนค่า */
    const handleChange = (selectedValue: string | string[]) => {
        onChange(selectedValue);
    };

    //** ฟังก์ชันค้นหาตัวเลือก */
    const filterOption = (input: string, option?: OptionType) =>
        (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

    return (
        <div>
            {/* Label ของ Field */}
            {label && (
                <label className="block text-sm font-medium mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Select Component */}
            <Select
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                options={options}
                mode={multiselect ? "multiple" : undefined}
                showSearch={showSearch}
                allowClear={allowClear}
                disabled={disabled}
                loading={loading}
                filterOption={filterOption}
                style={{width: "100%"}}
                status={error ? "error" : undefined}
                notFoundContent={loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}
            />

            {/* ข้อความ Error */}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

