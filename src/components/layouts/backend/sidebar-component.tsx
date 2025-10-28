"use client";

import {useSidebarMenu} from "@/constants/sidebar-menu-constant";
import {useEffect, useMemo, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {Menu, Tag, theme, Tooltip, Typography, Popover} from "antd";
import {
    RightOutlined,
    SettingOutlined,
    DashboardOutlined,
    FileTextOutlined,
    TeamOutlined,
    ToolOutlined,
    BugOutlined,
    MonitorOutlined,
    MessageOutlined,
    CloudOutlined,
    ExperimentOutlined,
    ClockCircleOutlined,
    UserOutlined,
    StarOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import "./sidebar-component.css";

//** [เพิ่ม] Key สำหรับบันทึกสถานะเมนูใน Local Storage */
const SIDEBAR_OPEN_KEYS_STORAGE_KEY = "sidebar_open_keys";

type SidebarContentProps = {
    collapsed?: boolean;
};

export default function SidebarContent({ collapsed = false }: SidebarContentProps) {
    const menu: {
        label: string;
        icon: JSX.Element;
        children?: { label: string; href: string; news?: boolean; icon?: JSX.Element }[];
        href?: string;
        tag?: string;
    }[] = useSidebarMenu();

    //** [แก้ไข] อ่านค่าเริ่มต้นของเมนูที่เปิดอยู่จาก Local Storage */
    const [openKeys, setOpenKeys] = useState<string[]>(() => {
        // โค้ดส่วนนี้จะทำงานแค่ครั้งแรกที่ Component ถูก Render
        if (typeof window !== "undefined") {
            try {
                const savedOpenKeys = window.localStorage.getItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY);
                // ถ้ามีค่าที่เคยบันทึกไว้ ให้ใช้ค่านั้น
                return savedOpenKeys ? JSON.parse(savedOpenKeys) : [];
            } catch (error) {
                console.error("Failed to parse sidebar open keys from localStorage", error);
                // หาก parse ไม่ได้ ให้กลับไปใช้ค่าเริ่มต้น (ว่าง)
                return [];
            }
        }
        return [];
    });

    const pathname = usePathname();
    const router = useRouter();
    const {token} = theme.useToken();

    // hover control for collapsed popovers
    const [hoveredParent, setHoveredParent] = useState<string | null>(null);
    const hoverTimerRef = useRef<number | null>(null);

    const clearHoverTimer = () => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current as any);
            hoverTimerRef.current = null;
        }
    };

    const scheduleClearHover = (delay = 120) => {
        clearHoverTimer();
        hoverTimerRef.current = window.setTimeout(() => setHoveredParent(null), delay) as unknown as number;
    };

    useEffect(() => {
        const activeParents = menu
            .filter((m) => m.children?.some((c) => c.href === pathname))
            .map((m) => m.label);

        //** [ปรับปรุง] ทำให้เมนูของหน้าปัจจุบันเปิดเสมอ โดยไม่ปิดเมนูอื่นที่ผู้ใช้เปิดไว้ */
        if (activeParents.length > 0) {
            setOpenKeys((currentKeys) => {
                // ใช้ Set เพื่อรวม keys เดิมกับ keys ของหน้าปัจจุบัน และป้องกันค่าซ้ำ
                const newKeys = new Set([...currentKeys, ...activeParents]);
                return Array.from(newKeys);
            });
        }
    }, [menu, pathname]);

    // 🎨 Function สำหรับเลือก icon ให้ submenu
    const getSubMenuIcon = (label: string, href: string) => {
        const iconProps = { style: { fontSize: '12px', opacity: 0.7 } };
        
        // Icon mapping based on menu content
        if (href.includes('/admin') || href.includes('/user')) return <UserOutlined {...iconProps} />;
        if (href.includes('/dashboard') || href.includes('/main')) return <DashboardOutlined {...iconProps} />;
        if (href.includes('/setting') || href.includes('/config')) return <SettingOutlined {...iconProps} />;
        if (href.includes('/log') || href.includes('/api-log')) return <FileTextOutlined {...iconProps} />;
        if (href.includes('/team') || href.includes('/support')) return <TeamOutlined {...iconProps} />;
        if (href.includes('/hardware') || href.includes('/tool')) return <ToolOutlined {...iconProps} />;
        if (href.includes('/bug') || href.includes('/backlog')) return <BugOutlined {...iconProps} />;
        if (href.includes('/health') || href.includes('/monitor')) return <MonitorOutlined {...iconProps} />;
        if (href.includes('/mobile') || href.includes('/notification')) return <MessageOutlined {...iconProps} />;
        if (href.includes('/cloud') || href.includes('/server')) return <CloudOutlined {...iconProps} />;
        if (href.includes('/test') || href.includes('/load')) return <ExperimentOutlined {...iconProps} />;
        if (href.includes('/timesheet') || href.includes('/entry')) return <ClockCircleOutlined {...iconProps} />;
        if (href.includes('/rank') || href.includes('/star')) return <StarOutlined {...iconProps} />;
        if (href.includes('/performance') || href.includes('/speed')) return <ThunderboltOutlined {...iconProps} />;
        
        // Default icon
        return <RightOutlined {...iconProps} />;
    };

    const items = useMemo(() => {
        return menu.map((m, index) => {
            if (m.children && m.children.length) {
                return {
                    key: m.label,
                    icon: (() => {
                        // control open state when collapsed to avoid relying solely on Popover's hover behavior
                        const popoverControlledProps = collapsed
                            ? { open: hoveredParent === m.label }
                            : {};

                        return (
                            <Popover
                                placement="rightTop"
                                overlayClassName="sidebar-collapsed-menu-popover"
                                // fully controlled open for collapsed mode (we handle hover/click)
                                // attach to body to avoid overflow/clipping when sidebar is collapsed
                                getPopupContainer={() => (typeof window !== 'undefined' ? document.body : (null as any)) as any}
                                // small enter/leave delays make hover feel smoother and avoid flicker
                                mouseEnterDelay={0.08}
                                mouseLeaveDelay={0.12}
                                {...popoverControlledProps}
                                onOpenChange={(open) => {
                                    // sync if popover toggles for any reason
                                    if (!collapsed) return;
                                    if (!open) scheduleClearHover(0);
                                    else {
                                        clearHoverTimer();
                                        setHoveredParent(m.label);
                                    }
                                }}
                                content={collapsed ? (
                                    <div
                                        className="sidebar-popover-content"
                                        onMouseEnter={() => {
                                            clearHoverTimer();
                                            setHoveredParent(m.label);
                                        }}
                                        onMouseLeave={() => scheduleClearHover(120)}
                                    >
                                        <div className="sidebar-popover-title">{m.label}</div>
                                        <div className="sidebar-popover-children">
                                            {m.children?.map((child, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="sidebar-popover-child"
                                                    onClick={() => router.push(child.href)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {child.icon && (
                                                        <span className="sidebar-popover-child-icon">
                                                            {child.icon}
                                                        </span>
                                                    )}
                                                    <span className="sidebar-popover-child-text">
                                                        {child.label}
                                                    </span>
                                                    {child.news && (
                                                        <Tag 
                                                            color="red" 
                                                            style={{
                                                                fontSize: '9px',
                                                                marginLeft: '4px',
                                                                transform: 'scale(0.8)',
                                                                height: '14px',
                                                                lineHeight: '14px',
                                                                padding: '0 3px'
                                                            }}
                                                        >
                                                            NEW
                                                        </Tag>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            >
                                <div
                                    className="sidebar-icon-wrapper"
                                    onMouseEnter={() => {
                                        clearHoverTimer();
                                        setHoveredParent(m.label);
                                    }}
                                    onMouseLeave={() => scheduleClearHover(80)}
                                    onFocus={() => {
                                        clearHoverTimer();
                                        setHoveredParent(m.label);
                                    }}
                                    onBlur={() => scheduleClearHover(80)}
                                    onClick={() => {
                                        // toggle on click for touch/click support when collapsed
                                        if (!collapsed) return;
                                        setHoveredParent((prev) => (prev === m.label ? null : m.label));
                                    }}
                                    role={collapsed ? "button" : undefined}
                                    tabIndex={0}
                                >
                                    {m.icon}
                                </div>
                            </Popover>
                        );
                    })(),
                    label: (
                        <div className="sidebar-parent-label">
                            <span style={{ fontSize: 16, fontWeight: 500 }}>{m.label}</span>
                        </div>
                    ),
                    children: m.children.map((c, childIndex) => ({
                        key: c.href,
                        icon: c.icon ? (
                            <div className="sidebar-child-icon-wrapper">
                                {c.icon}
                            </div>
                        ) : null,
                        label: (
                            <div className="sidebar-child-item">
                                <Tooltip title={c.label} placement="right">
                                    <Typography.Text
                                        className="sidebar-child-text"
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {c.label}
                                    </Typography.Text>
                                </Tooltip>
                                {c.news ? (
                                    <Tag 
                                        color="red" 
                                        className="sidebar-new-tag"
                                        style={{
                                            marginInlineStart: 8,
                                            fontSize: '10px',
                                            padding: '0 4px',
                                            height: '18px',
                                            lineHeight: '18px',
                                            borderRadius: '9px',
                                            animation: 'pulse 2s infinite'
                                        }}
                                    >
                                        NEW
                                    </Tag>
                                ) : null}
                            </div>
                        ),
                    })),
                } as const;
            }
            return {
                key: m.href || m.label,
                icon: (
                    <div className="sidebar-icon-wrapper">
                        {m.icon}
                    </div>
                ),
                label: (
                    <div className="sidebar-single-item">
                        <Typography.Text
                            className="sidebar-single-text"
                            style={{
                                whiteSpace: "normal", 
                                wordBreak: "break-word",
                                fontSize: 18,
                                fontWeight: 700
                            }}
                        >
                            {m.label}
                        </Typography.Text>
                        {m.tag ? (
                            <Tag 
                                color="purple" 
                                className="sidebar-tag"
                                style={{
                                    marginInlineStart: 8,
                                    fontSize: '10px',
                                    padding: '0 4px',
                                    height: '18px',
                                    lineHeight: '18px',
                                    borderRadius: '9px',
                                    background: 'linear-gradient(135deg, #722ed1, #b37feb)',
                                    border: 'none',
                                    color: 'white',
                                    boxShadow: '0 2px 4px rgba(114, 46, 209, 0.3)'
                                }}
                            >
                                {m.tag}
                            </Tag>
                        ) : null}
                    </div>
                ),
            } as const;
        });
    }, [menu]);

    //** [แก้ไข] เมื่อผู้ใช้เปิด/ปิดเมนู ให้บันทึกสถานะล่าสุดลง Local Storage */
    const onOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY, JSON.stringify(keys));
        }
    };

    const onClick: Parameters<typeof Menu>[0]["onClick"] = (info) => {
        const key = String(info.key);
        if (key.startsWith("/")) router.push(key);
    };

    return (
        <>
            {/* 🎨 Modern CSS Animations */}
            <style jsx>{`
                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 5px ${token.colorPrimary}30; }
                    50% { box-shadow: 0 0 15px ${token.colorPrimary}60; }
                }
                
                .sidebar-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: linear-gradient(135deg, ${token.colorPrimary}10, ${token.colorPrimary}05);
                }
                
                .sidebar-child-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: linear-gradient(135deg, ${token.colorPrimary}08, ${token.colorPrimary}03);
                    opacity: 0.8;
                }
                

                
                /* 🌟 Light/Dark Mode Transitions */
                .sidebar-title,
                .sidebar-parent-label,
                .sidebar-child-text,
                .sidebar-single-text {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                                color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                                background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .sidebar-parent-label {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    font-weight: 700;
                    font-size: 18px;
                }
                

                
                .sidebar-child-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 2px 0;
                    animation: slideInFromLeft 0.3s ease-out;
                }
                
                .sidebar-child-text {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .sidebar-single-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    width: 100%;
                }
                
                .sidebar-single-text {
                    font-weight: 700;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }
                
                .sidebar-new-tag {
                    animation: pulse 2s infinite;
                }
                
                .sidebar-tag {
                    animation: glow 3s ease-in-out infinite;
                }
            `}</style>
            
            <div
                className="flex flex-col h-full justify-between text-base overflow-visible sb-sidebar-wrap"
                style={{["--sb-primary" as any]: token.colorPrimary}}
            >
                <div>
                    <div
                        className={`mb-6 text-lg font-bold bg-clip-text text-transparent sidebar-title transition-all duration-300 ${
                            collapsed ? 'opacity-0 h-0 mb-2' : 'opacity-100 h-auto mb-6'
                        }`}
                        style={{
                            background: token.colorBgBase === '#ffffff' 
                                ? `linear-gradient(135deg, #ff6b35, #ff8c42)` 
                                : `linear-gradient(135deg, #ffab7a, #ffcc99)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: collapsed ? 'transparent' : 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.5px',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {!collapsed ? '✨ เมนู' : ''}
                    </div>
                    <Menu
                        mode="inline"
                        inlineCollapsed={collapsed}
                        selectedKeys={[pathname]}
                        openKeys={collapsed ? [] : openKeys}
                        onOpenChange={onOpenChange}
                        onClick={onClick}
                        items={items as any}
                        style={{
                            borderInlineEnd: "none",
                            background: 'transparent',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        className="sb-sidebar-menu modern-sidebar"
                    />
                </div>
            </div>
        </>
    );
}
