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
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        fontWeight: 'bold',
                                        fontSize: 20,
                                        textAlign: 'center',
                                        minWidth: 50,
                                        boxShadow: ['S', 'A'].includes(rankInfo.grade) ? 
                                            `0 4px 16px ${rankInfo.color}60, inset 0 1px 0 rgba(255,255,255,0.3)` :
                                            `0 2px 8px ${rankInfo.color}40`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        animation: ['S', 'A'].includes(rankInfo.grade) ? 'rankGlow 3s ease-in-out infinite' : 'none'
                                    }}>
                                        {/* เอฟเฟกต์แสงสำหรับ S/A */}
                                        {['S', 'A'].includes(rankInfo.grade) && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '100%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                                animation: 'shimmer 2s infinite'
                                            }} />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            {rankInfo.grade}
                                        </span>
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
                                            {['S', 'A'].includes(rankInfo.grade) && (
                                                <span style={{
                                                    marginLeft: 6,
                                                    fontSize: 12,
                                                    background: rankInfo.bgColor,
                                                    color: 'white',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    fontWeight: 'bold'
                                                }}>
                                                    {rankInfo.grade === 'S' ? '🔥 LEGEND' : '⭐ ELITE'}
                                                </span>
                                            )}
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
                                            {['S', 'A'].includes(rankInfo.grade) && (
                                                <span style={{ 
                                                    color: rankInfo.color,
                                                    fontWeight: 'bold',
                                                    animation: 'sparkle 2s ease-in-out infinite'
                                                }}>
                                                    ✨
                                                </span>
                                            )}
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
            {/* 🎨 CSS Animations สำหรับ Rank A/S */}
            <style jsx>{`
                /*
                 1) ปรับให้ 'rankGlow' ไม่หมุนอีกต่อไป (ไม่มี rotate)
                 2) ใช้การขยายเล็ก ๆ และเพิ่มความสว่างเพียงพอเป็น glow
                 3) 'sparkle' เปลี่ยนให้ส่อง/ขยายเล็ก ๆ โดยไม่หมุน
                */
                @keyframes rankGlow {
                    0%, 100% {
                        transform: scale(1);
                        filter: brightness(1);
                        box-shadow: 0 0 0 rgba(0,0,0,0);
                    }
                    50% {
                        transform: scale(1.03);
                        filter: brightness(1.12);
                        box-shadow: 0 6px 18px rgba(0,0,0,0.06);
                    }
                }

                @keyframes rankPulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 2px 12px rgba(255, 215, 0, 0.6);
                    }
                    50% {
                        transform: scale(1.08);
                        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.8);
                    }
                }

                @keyframes sparkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0.6);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.08);
                    }
                }

                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .rank-badge:hover {
                    transform: scale(1.06) !important;
                    transition: all 0.26s ease;
                }
            `}</style>
            
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{fontSize: 14, fontWeight: 500}}>
                            สวัสดีคุณ {`${userData.firstname ?? "Name"} ${userData.lastname ?? ""}`}
                        </span>
                        
                        {/* Rank Badge หลังชื่อ */}
                        {userRank && (() => {
                            const rankInfo = getRankGrade(userRank.rankLetter || 'F');
                            const isHighRank = ['S', 'A'].includes(rankInfo.grade);
                            
                            return (
                                <div 
                                    className="rank-badge"
                                    style={{
                                        background: rankInfo.bgColor,
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        boxShadow: `0 2px 8px ${rankInfo.color}40`,
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        animation: isHighRank ? 'rankPulse 2s ease-in-out infinite' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        marginLeft: 4
                                    }}
                                >
                                    {/* เอฟเฟกต์แสงสำหรับ S/A */}
                                    {isHighRank && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                            animation: 'shimmer 2s infinite'
                                        }} />
                                    )}
                                    <span style={{ position: 'relative', zIndex: 1 }}>
                                        {rankInfo.grade}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                    
                    {/* Avatar สะอาด ไม่มี badge */}
                    <div style={{ position: 'relative' }}>
                        {(() => {
                            const rankInfo = userRank ? getRankGrade(userRank.rankLetter || 'F') : null;
                            const isHighRank = rankInfo && ['S', 'A'].includes(rankInfo.grade);
                            
                            // สร้าง unique avatar สำหรับแต่ละคน
                            const getAvatarUrl = () => {
                                const adminId = userData.admin_id || 1;
                                const avatarSeed = `${userData.firstname}_${userData.lastname}_${adminId}`;
                                return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
                            };

                            return (
                                <div 
                                    style={{
                                        position: 'relative',
                                        borderRadius: '50%',
                                        padding: isHighRank ? '2px' : '0',
                                        background: isHighRank ? 
                                            (rankInfo.grade === 'S' ? 
                                                'conic-gradient(from 0deg, #FFD700, #FF6B6B, #4ECDC4, #FFD700)' :
                                                'conic-gradient(from 0deg, #52C41A, #13C2C2, #52C41A)'
                                            ) : 'transparent',
                                        animation: isHighRank ? 'rankGlow 3s ease-in-out infinite' : 'none',
                                    }}
                                >
                                    <Avatar
                                        src={getAvatarUrl()}
                                        alt={`${userData.firstname} ${userData.lastname}`}
                                        size={36}
                                        style={{
                                            border: isHighRank ? '2px solid white' : `1px solid ${token.colorBorder}`,
                                            boxShadow: isHighRank ? `0 0 15px ${rankInfo.color}50` : 'none',
                                        }}
                                    />

                                    {/* Sparkles สำหรับ S/A Rank - เบาลง */}
                                    {isHighRank && rankInfo && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -8,
                                            left: -8,
                                            right: -8,
                                            bottom: -8,
                                            pointerEvents: 'none',
                                            zIndex: -1
                                        }}>
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        position: 'absolute',
                                                        width: '3px',
                                                        height: '3px',
                                                        background: rankInfo.color,
                                                        borderRadius: '50%',
                                                        top: `${Math.random() * 100}%`,
                                                        left: `${Math.random() * 100}%`,
                                                        animation: `sparkle 2s ease-in-out infinite ${i * 0.5}s`,
                                                        opacity: 0.6
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    
                    <DownOutlined style={{color: token.colorTextSecondary}}/>
                </div>
            </Popover>
        </>
    );
}
