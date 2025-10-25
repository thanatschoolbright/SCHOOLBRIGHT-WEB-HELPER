"use client";

/**
 * 👤 UserDropdown: Dropdown เมนูผู้ใช้
 * ใช้ Ant Design สำหรับ UI minimal, รองรับ Dark Mode
 */

import {useEffect, useState} from "react";
import {Avatar, Button, Divider, Popover, Segmented, Spin, theme, Typography, Badge, Progress} from "antd";
import {DownOutlined, LogoutOutlined, TranslationOutlined, TrophyOutlined, StarOutlined, FireOutlined} from "@ant-design/icons";
import i18n from "@/i18n";
import {useAppSelector} from "@stores/store";
import {toast} from "sonner";
import {getUserRankFromStorage, getDisciplineLevel} from "@/helpers/user-rank.helper";

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
    const [userRank, setUserRank] = useState<any>(null);

    const userData = AUTHENTICATION?.response?.data?.user_data || {};

    // โหลดข้อมูล rank เมื่อ component mount
    useEffect(() => {
        const rankData = getUserRankFromStorage();
        setUserRank(rankData);
    }, []);



    /**
     * 🏆 แปลง rank letter เป็น display info
     */
    const getRankGrade = (rankLetter: string): { 
        grade: string, 
        color: string, 
        bgColor: string, 
        description: string
    } => {
        switch (rankLetter?.toUpperCase()) {
            case 'S':
                return {
                    grade: 'S',
                    color: '#FFD700',
                    bgColor: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    description: 'ระดับเทพ'
                };
            case 'A':
                return {
                    grade: 'A',
                    color: '#52C41A',
                    bgColor: 'linear-gradient(135deg, #52C41A, #389E0D)',
                    description: 'ระดับเยี่ยม'
                };
            case 'B':
                return {
                    grade: 'B',
                    color: '#1890FF',
                    bgColor: 'linear-gradient(135deg, #1890FF, #096DD9)',
                    description: 'ระดับดี'
                };
            case 'C':
                return {
                    grade: 'C',
                    color: '#FAAD14',
                    bgColor: 'linear-gradient(135deg, #FAAD14, #D48806)',
                    description: 'ระดับปานกลาง'
                };
            case 'D':
                return {
                    grade: 'D',
                    color: '#FA8C16',
                    bgColor: 'linear-gradient(135deg, #FA8C16, #D46B08)',
                    description: 'ระดับพอใช้'
                };
            case 'E':
                return {
                    grade: 'E',
                    color: '#FF7875',
                    bgColor: 'linear-gradient(135deg, #FF7875, #F5222D)',
                    description: 'ต้องปรับปรุง'
                };
            default: // 'F' or anything else
                return {
                    grade: 'F',
                    color: '#CF1322',
                    bgColor: 'linear-gradient(135deg, #CF1322, #A8071A)',
                    description: 'ต้องเร่งด่วน'
                };
        }
    };

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
        <div style={{padding: 12, minWidth: 280}}>
            {/* 🏆 แสดง User Rank - กระชับ */}
            {userRank && (
                <>
                    <div style={{marginBottom: 12}}>
                        {(() => {
                            const rankInfo = getRankGrade(userRank.rankLetter || 'F');
                            const currentDate = new Date();
                            const currentMonth = currentDate.getMonth() + 1;
                            const currentYear = currentDate.getFullYear();
                            
                            return (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '8px 12px',
                                    background: `linear-gradient(135deg, ${rankInfo.color}15, ${rankInfo.color}05)`,
                                    borderRadius: 8,
                                    border: `1px solid ${rankInfo.color}30`
                                }}>
                                    {/* RANK Badge - เด่น */}
                                    <div style={{
                                        background: rankInfo.bgColor,
                                        color: 'white',
                                        borderRadius: 6,
                                        padding: '6px 10px',
                                        fontWeight: 'bold',
                                        fontSize: 18,
                                        textAlign: 'center',
                                        minWidth: 45,
                                        boxShadow: `0 2px 8px ${rankInfo.color}40`
                                    }}>
                                        {rankInfo.grade}
                                    </div>
                                    
                                    {/* ข้อมูลส่วนเสริม */}
                                    <div style={{flex: 1}}>
                                        <div style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: token.colorText,
                                            marginBottom: 2
                                        }}>
                                            {rankInfo.description}
                                        </div>
                                        <div style={{
                                            fontSize: 11,
                                            color: token.colorTextSecondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <span>อันดับ {userRank.rank}</span>
                                            <span>•</span>
                                            <span>{currentMonth}/{currentYear}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    <Divider style={{margin: "12px 0"}}/>
                </>
            )}

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
        <>
            
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
                    
                    {/* Avatar พร้อม Rank Badge */}
                    <div style={{ position: 'relative' }}>
                        <Avatar
                            src="/photo/profile.png"
                            alt="Avatar"
                            size={36}
                            style={{border: `1px solid ${token.colorBorder}`}}
                        />
                        
                        {/* Rank Badge */}
                        {userRank && (
                            <Badge
                                count={(() => {
                                    const rankInfo = getRankGrade(userRank.rankLetter || 'F');
                                    return (
                                        <div 
                                            className="rank-badge"
                                            style={{
                                                background: rankInfo.bgColor,
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                minWidth: '20px',
                                                height: '20px',
                                                lineHeight: '20px',
                                                borderRadius: '10px',
                                                textAlign: 'center',
                                                boxShadow: `0 2px 8px ${rankInfo.color}40`,
                                                border: '2px solid white',
                                            }}
                                        >
                                            {rankInfo.grade}
                                        </div>
                                    );
                                })()}
                                offset={[-8, -8]}
                                style={{ 
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                }}
                            />
                        )}
                    </div>
                    
                    <DownOutlined style={{color: token.colorTextSecondary}}/>
                </div>
            </Popover>
        </>
    );
}
