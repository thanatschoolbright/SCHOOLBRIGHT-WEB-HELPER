"use client";

/**
 * 👤 UserDropdown: Dropdown เมนูผู้ใช้
 * ใช้ Ant Design สำหรับ UI minimal, รองรับ Dark Mode
 */

import {useEffect, useState} from "react";
import {Avatar, Button, Divider, Popover, Segmented, Spin, theme, Typography} from "antd";
import {DownOutlined, LogoutOutlined, TranslationOutlined} from "@ant-design/icons";
import i18n from "@/i18n";
import {useAppSelector} from "@stores/store";
import {toast} from "sonner";

/**
 * 📦 UserDropdown: Component Dropdown สำหรับเมนูผู้ใช้
 * - แสดงชื่อและรูปโปรไฟล์
 * - เมนูเปลี่ยนภาษาและออกจากระบบ
 * - ใช้ Toast สำหรับสถานะ logout
 */
export default function UserDropdown(): JSX.Element {
    const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
    const {token} = theme.useToken();
    const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);
    const [isChangingLanguage, setIsChangingLanguage] = useState<boolean>(false);

    const userData = AUTHENTICATION?.response?.data?.user_data || {};

    /**
     * 🌐 เปลี่ยนภาษา
     */
    const changeLanguage = async (lng: string): Promise<void> => {
        if (lng === currentLanguage) return; // ไม่เปลี่ยนถ้าเป็นภาษาเดียวกัน
        setIsChangingLanguage(true);
        const toastId = toast.loading(`กำลังเปลี่ยนภาษาเป็น ${lng === 'th' ? 'ไทย' : 'English'}...`);
        try {
            await i18n.changeLanguage(lng);
            setCurrentLanguage(lng);
            toast.success(`เปลี่ยนภาษาเป็น ${lng === 'th' ? 'ไทย' : 'English'} สำเร็จ`, {id: toastId});
        } catch (error) {
            toast.error("เปลี่ยนภาษาไม่สำเร็จ", {id: toastId});
        } finally {
            setIsChangingLanguage(false);
        }
    };

    /**
     * ⏳ Sleep function สำหรับ delay
     */
    const sleep = (ms: number): Promise<void> =>
        new Promise((resolve) => setTimeout(resolve, ms));

    /**
     * 🗑️ ลบข้อมูลใน Storage
     */
    const clearStorage = (): void => {
        try {
            localStorage.clear();
        } catch {
        }
        try {
            sessionStorage.clear();
        } catch {
        }
    };

    /**
     * 🚪 จัดการการออกจากระบบ
     */
    const handleLogout = async (): Promise<void> => {
        const toastId = toast.loading("1/2 กำลังโหลด...", {duration: Infinity});
        try {
            await sleep(400);
            toast.loading("2/2 กำลังลบข้อมูล...", {
                id: toastId,
                duration: Infinity,
            });
            clearStorage();
            await sleep(300);
            toast.success("ออกจากระบบสำเร็จ", {id: toastId, duration: 2000});
            setTimeout(() => {
                window.location.href = "/";
            }, 400);
        } catch {
            toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", {
                id: toastId,
                duration: 4000,
            });
        }
    };

    /**
     * 📋 Overlay สำหรับ Dropdown Menu
     */
    const dropdownOverlay = (
        <div style={{padding: 8, minWidth: 200}}>
            {/* 🌐 เลือกภาษา */}
            <div style={{marginBottom: 8}}>
                <Typography.Text strong style={{fontSize: 12, color: token.colorTextSecondary}}>
                    เปลี่ยนภาษา {isChangingLanguage && <Spin size="small" style={{marginLeft: 8}}/>}
                </Typography.Text>
                <Segmented
                    options={[
                        {label: "ไทย", value: "th", icon: <TranslationOutlined/>},
                        {label: "English", value: "en", icon: <TranslationOutlined/>},
                    ]}
                    value={currentLanguage}
                    onChange={(value) => changeLanguage(value as string)}
                    disabled={isChangingLanguage}
                    style={{marginTop: 4}}
                />
            </div>
            <Divider style={{margin: "8px 0"}}/>
            {/* 🚪 ออกจากระบบ */}
            <Button
                type="text"
                danger
                icon={<LogoutOutlined/>}
                onClick={handleLogout}
                style={{width: "100%"}}
            >
                ออกจากระบบ
            </Button>
        </div>
    );

    useEffect(() => {
        console.log("AUTHENTICATION", AUTHENTICATION);
    }, [AUTHENTICATION]);

    //** 🔄 Listen สำหรับการเปลี่ยนภาษา
    useEffect(() => {
        const handleLanguageChange = (lng: string) => {
            setCurrentLanguage(lng);
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);

    return (
        <Popover content={dropdownOverlay} trigger={["click"]}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    color: token.colorText, // รองรับ Dark Mode
                }}
            >
                <span style={{fontSize: 14, fontWeight: 500}}>
                    สวัสดีคุณ {`${userData.firstname ?? "Name"} ${userData.lastname ?? ""}`}
                </span>
                <Avatar
                    src="/photo/profile.png"
                    alt="Avatar"
                    size={36}
                    style={{border: `1px solid ${token.colorBorder}`}}
                />
                <DownOutlined style={{color: token.colorTextSecondary}}/>
            </div>
        </Popover>
    );
}
