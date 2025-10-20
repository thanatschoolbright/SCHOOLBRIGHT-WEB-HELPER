"use client";

/**
 * 🧭 MainHeader: Header หลักของ backend layout
 * ใช้ Ant Design สำหรับ UI minimal, รองรับ Dark Mode
 */

import {useRouter} from "next/navigation";
import {Card, Flex, Space, theme, Typography} from "antd";
import UserDropdown from "@components/layouts/backend/user-dropdown";

/**
 * 📦 MainHeader: Component Header สำหรับแสดงโลโก้และเมนูผู้ใช้
 * - โลโก้คลิกได้เพื่อกลับหน้า backend
 * - เมนูผู้ใช้ด้านขวา
 */
export default function MainHeader(): JSX.Element {
    const router = useRouter();
    const {token} = theme.useToken();

    return (
        <Card
            variant="borderless"
            styles={{
                body: {
                    paddingBlock: 14,
                    paddingInline: 24,
                },
            }}
            style={{
                borderRadius: 0,
                marginBottom: 12,
                background: token.colorBgContainer, // รองรับ Dark Mode
            }}
        >
            <Flex align="center" justify="space-between">
                {/* 🔸 โลโก้ */}
                <Typography.Title
                    level={4}
                    onClick={() => router.push("/main")}
                    style={{
                        margin: 0,
                        cursor: "pointer",
                        fontWeight: 700,
                        color: token.colorPrimary, // รองรับ Dark Mode
                    }}
                >
                    สคูลไบรท์
                </Typography.Title>

                {/* 🔹 เมนูผู้ใช้ */}
                <Space>
                    <UserDropdown/>
                </Space>
            </Flex>
        </Card>
    );
}
