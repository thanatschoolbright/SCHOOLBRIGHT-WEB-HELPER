"use client";

/**
 * 🧭 MainHeader: Header หลักของ backend layout
 * ใช้ Ant Design สำหรับ UI minimal, รองรับ Dark Mode
 */

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Badge, Button, Card, Divider, Flex, Space, Tag, Tooltip, theme, Typography} from "antd";
import {BellOutlined, CompassOutlined, HomeOutlined, PlusOutlined, ThunderboltFilled} from "@ant-design/icons";
import UserDropdown from "@components/layouts/backend/user-dropdown";

/**
 * 📦 MainHeader: Component Header สำหรับแสดงโลโก้และเมนูผู้ใช้
 * - โลโก้คลิกได้เพื่อกลับหน้า backend
 * - เมนูผู้ใช้ด้านขวา
 */
export default function MainHeader(): JSX.Element {
    const router = useRouter();
    const {token} = theme.useToken();
    const [brandHover, setBrandHover] = useState(false);

    return (
        <Card
            variant="borderless"
            styles={{
                body: {
                  
                },
            }}
            style={{
                borderRadius: 14,
                marginBottom: 12,
                background: `linear-gradient(120deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 55%)`,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: token.boxShadowSecondary,
            }}
        >
            <Flex align="center" justify="space-between">
                {/* 🔸 โลโก้ */}
                <Flex
                    align="center"
                    gap={12}
                    onClick={() => router.push("/main")}
                    style={{
                        paddingInline: 12,
                        paddingBlock: 8,
                        borderRadius: 12,
                        cursor: "pointer",
                        transition: "transform 160ms ease, background 200ms ease, box-shadow 200ms ease",
                        background: brandHover ? token.colorFillSecondary : token.colorFillTertiary,
                        transform: brandHover ? "translateY(-1px)" : "translateY(0)",
                        boxShadow: brandHover ? token.boxShadowSecondary : "none",
                    }}
                    onMouseEnter={() => setBrandHover(true)}
                    onMouseLeave={() => setBrandHover(false)}
                >
                    <CompassOutlined style={{fontSize: 22, color: token.colorPrimary}}/>
                    <div style={{display: "flex", flexDirection: "column", gap: 2}}>
                        <Typography.Title
                            level={5}
                            style={{
                                margin: 0,
                                fontWeight: 800,
                                color: token.colorText,
                                letterSpacing: 0.1,
                            }}
                        >
                            สคูลไบรท์
                        </Typography.Title>
                        
                    </div>
                </Flex>

                {/* 🔹 เมนูผู้ใช้ */}
                <Space size={10} align="center">
                    <Button
                        type="primary"
                        icon={<HomeOutlined/>}
                        shape="round"
                        onClick={() => router.push("/main")}
                        style={{boxShadow: token.boxShadowSecondary}}
                    >
                        กลับหน้าหลัก
                    </Button>
                    <Divider type="vertical" style={{height: 32, marginInline: 4}}/>
                    <Tooltip title="แจ้งเตือนล่าสุด">
                        <Badge dot color={token.colorWarning} offset={[-2, 2]}>
                            <Button
                                type="text"
                                shape="circle"
                                icon={<BellOutlined style={{fontSize: 18}}/>}
                                style={{color: token.colorTextSecondary}}
                            />
                        </Badge>
                    </Tooltip>
                    <UserDropdown/>
                </Space>
            </Flex>
        </Card>
    );
}
