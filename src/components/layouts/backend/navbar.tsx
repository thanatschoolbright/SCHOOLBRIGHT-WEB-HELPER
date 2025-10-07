"use client";

import {useRouter} from "next/navigation";
import {Card, Flex, Space, theme, Typography} from "antd";
import UserDropdown from "@components/layouts/backend/user-dropdown";

export default function MainHeader() {
    const router = useRouter();
    const {token} = theme.useToken();

    return (
        <Card
            variant={"borderless"}
            loading={false}
            styles={{
                body: {
                    paddingBlock: 14,
                    paddingInline: 24,
                }
            }}
            style={{
                borderRadius: 0,
                marginBottom: 12,
            }}
        >
            <Flex align="center" justify="space-between">
                {/* โลโก้ */}
                <Typography.Title
                    level={4}
                    onClick={() => router.push("/backend")}
                    style={{
                        margin: 0,
                        cursor: "pointer",
                        fontWeight: 700,
                        color: "orange"
                    }}
                >
                    สคูลไบรท์
                </Typography.Title>

                {/* เมนูผู้ใช้ */}
                <Space>
                    <UserDropdown/>
                </Space>
            </Flex>
        </Card>
    );
}
