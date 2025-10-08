// src/app/not-found.tsx
"use client";

import {Button, Card, Result, theme, Typography} from "antd";

//** หน้า 404: แสดงเมื่อไม่พบหน้าเว็บ (Apple Minimal Style + Ant Design) */
export default function NotFound() {
    const {token} = theme.useToken();

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: token.colorBgBase,
            }}
        >
            <Card
                style={{
                    maxWidth: 480,
                    width: "100%",
                    textAlign: "center",
                    borderRadius: 16,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                }}
                styles={{
                    body: {padding: 24},
                }}

            >
                <Result
                    status="404"
                    title={
                        <Typography.Title level={2} style={{color: token.colorText}}>
                            404 - ไม่พบหน้านี้
                        </Typography.Title>
                    }
                    subTitle={
                        <Typography.Text type="secondary">
                            ขอโทษค่ะ ไม่พบหน้าที่คุณพยายามเข้าถึง หรืออาจถูกลบไปแล้ว
                        </Typography.Text>
                    }
                    extra={
                        <Button
                            type="primary"
                            size="large"
                            href="/"
                            style={{
                                borderRadius: 24,
                                paddingInline: 28,
                                background: token.colorPrimary,
                            }}
                        >
                            กลับไปหน้าแรก
                        </Button>
                    }
                />
            </Card>
        </div>
    );
}
