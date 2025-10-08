"use client";

import {GlobalOutlined} from "@ant-design/icons";
import {Select, Skeleton} from "antd";
import React, {useState} from "react";
import {toast} from "sonner";

import i18n from "@/i18n";

interface LanguageOption {
    label: string;
    value: string;
    flag: string;
}

interface LanguageSwitcherProps {
    loading?: boolean;
    size?: "small" | "middle" | "large";
    disabled?: boolean;
}

/**
 * ตัวเลือกภาษาที่รองรับ
 */
const LANGUAGE_OPTIONS: LanguageOption[] = [
    {label: "English", value: "en", flag: "🇺🇸"},
    {label: "ไทย", value: "th", flag: "🇹🇭"},
];

/**
 * Component สำหรับเปลี่ยนภาษา พร้อมรองรับ Dark Mode
 * @param props - Properties ของ Language Switcher
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
                                                                      loading = false,
                                                                      size = "middle",
                                                                      disabled = false,
                                                                  }) => {
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "th");
    const TOAST_ID = "language-switcher";

    //** จัดการการเปลี่ยนภาษา */
    const handleLanguageChange = async (languageValue: string) => {
        try {
            toast.loading("กำลังเปลี่ยนภาษา...", {id: TOAST_ID});

            //** เปลี่ยนภาษาใน i18n */
            await i18n.changeLanguage(languageValue);
            setCurrentLanguage(languageValue);

            const selectedLanguage = LANGUAGE_OPTIONS.find(
                (option) => option.value === languageValue
            );

            toast.success(
                `เปลี่ยนภาษาเป็น ${selectedLanguage?.label} สำเร็จ`,
                {id: TOAST_ID}
            );
        } catch (error) {
            console.error("Failed to change language:", error);
            toast.error("เปลี่ยนภาษาไม่สำเร็จ", {id: TOAST_ID});
        }
    };

    //** แสดง Skeleton ขณะโหลด */
    if (loading) {
        return (
            <Skeleton.Input
                active
                size={size as any}
                style={{
                    width: 120,
                    height:
                        size === "small"
                            ? 24
                            : size === "large"
                                ? 40
                                : 32,
                }}
            />
        );
    }

    //** สร้าง options สำหรับ Select */
    const selectOptions = LANGUAGE_OPTIONS.map((option) => ({
        label: (
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
                <span>{option.flag}</span>
                <span>{option.label}</span>
            </div>
        ),
        value: option.value,
    }));

    return (
        <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            options={selectOptions}
            size={size as any}
            disabled={disabled}
            suffixIcon={<GlobalOutlined/>}
            style={{minWidth: 120}}
            placeholder="เลือกภาษา"
            popupMatchSelectWidth={false}
        />
    );
};
