"use client";

import React, { useState } from "react";
import {
  FloatButton,
  Drawer,
  Radio,
  Typography,
  Card,
  Divider,
  Flex,
  theme,
  Button,
} from "antd";
import type { RadioChangeEvent } from "antd";
import {
  SettingOutlined,
  FontSizeOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useFont } from "../providers/font-provider";

const { Text, Title } = Typography;

export default function ThemeCustomizer() {
  const { token } = theme.useToken();
  const { fontFamily, setFontFamily } = useFont();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleChangeFont = (event: RadioChangeEvent) => {
    setFontFamily(event.target.value as "google-sans" | "sukhumvit");
  };

  const fonts = [
    {
      value: "google-sans",
      label: "Google Sans",
      cssVar: "var(--font-google-sans)",
    },
    {
      value: "sukhumvit",
      label: "Sukhumvit Set",
      cssVar: "var(--font-sukhumvit)",
    },
  ];

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        style={{
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderStartEndRadius: 0,
          borderEndEndRadius: 0,
        }}
        onClick={handleOpenDrawer}
        tooltip="ปรับแต่งเว็บไซต์"
      />

      <Drawer
        title={
          <Flex align="center" gap={8} style={{ color: token.colorText }}>
            <SettingOutlined
              style={{ color: token.colorPrimary, fontSize: 20 }}
            />
            <Text strong style={{ fontSize: 16 }}>
              ปรับแต่งหน้าเว็บไซต์
            </Text>
          </Flex>
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={isDrawerOpen}
        width={420}
        closeIcon={null}
        extra={
          <Button
            type="text"
            onClick={handleCloseDrawer}
            style={{ padding: "4px 8px" }}
          >
            <Text type="secondary">ปิด</Text>
          </Button>
        }
      >
        <Flex vertical gap={32}>
          <Flex vertical gap={16}>
            <Flex align="center" gap={8}>
              <FontSizeOutlined
                style={{ fontSize: 18, color: token.colorPrimary }}
              />
              <Title level={5} style={{ margin: 0 }}>
                รูปแบบตัวอักษร
              </Title>
            </Flex>
            <Text type="secondary">
              เลือกรูปแบบตัวอักษรที่ต้องการใช้งานสำหรับแพลตฟอร์มของคุณ
            </Text>

            <Radio.Group
              value={fontFamily}
              onChange={handleChangeFont}
              style={{ width: "100%", marginTop: 24 }}
            >
              <Flex vertical gap={24}>
                {fonts.map((font) => (
                  <Card
                    key={font.value}
                    hoverable
                    onClick={() => {
                      setFontFamily(font.value as "google-sans" | "sukhumvit");
                    }}
                    styles={{
                      body: {
                        padding: token.paddingLG,
                        borderColor:
                          fontFamily === font.value
                            ? token.colorPrimary
                            : token.colorBorderSecondary,
                        backgroundColor:
                          fontFamily === font.value
                            ? token.colorPrimaryBg
                            : token.colorBgContainer,
                        borderWidth: 2,
                        borderStyle: "solid",
                        borderRadius: token.borderRadiusLG,
                        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                        cursor: "pointer",
                      },
                    }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ width: "100%" }}
                    >
                      <Radio
                        value={font.value}
                        style={{ fontFamily: font.cssVar }}
                      >
                        <Text
                          strong={fontFamily === font.value}
                          style={{ fontSize: 16 }}
                        >
                          {font.label}
                        </Text>
                      </Radio>
                      {fontFamily === font.value && (
                        <CheckCircleFilled
                          style={{ color: token.colorPrimary, fontSize: 18 }}
                        />
                      )}
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </Radio.Group>
          </Flex>

          <Divider style={{ margin: 0 }} />

          <Flex vertical align="center">
            <Text type="secondary" style={{ fontSize: 12 }}>
              SchoolBright Web Helper Customizer v1.0
            </Text>
          </Flex>
        </Flex>
      </Drawer>
    </>
  );
}
