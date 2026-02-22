"use client";

import React, { useState } from "react";
import {
  FloatButton,
  Drawer,
  Radio,
  Space,
  Typography,
  Card,
  Divider,
  Flex,
  theme,
  App,
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
  const { token: themeToken } = theme.useToken();
  const { modal: appModal } = App.useApp();
  const { fontFamily, setFontFamily } = useFont();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleChangeFont = (event: RadioChangeEvent) => {
    setFontFamily(event.target.value);
  };

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24, width: 56, height: 56 }}
        onClick={handleOpenDrawer}
        tooltip={
          <Text style={{ color: themeToken.colorWhite }}>ปรับแต่งเว็บไซต์</Text>
        }
      />

      <Drawer
        title={
          <Space>
            <SettingOutlined />
            <Text strong>ปรับแต่งหน้าเว็บไซต์</Text>
          </Space>
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={isDrawerOpen}
        width={320}
        closeIcon={null}
        extra={
          <Button type="text" onClick={handleCloseDrawer}>
            <Text type="secondary">ปิด</Text>
          </Button>
        }
      >
        <Flex vertical gap={24}>
          <Flex vertical gap={8}>
            <Title level={5} style={{ margin: 0 }}>
              <FontSizeOutlined style={{ marginRight: 8 }} />
              เปลี่ยน Font
            </Title>
            <Text type="secondary">เลือกรูปแบบตัวอักษรที่ต้องการใช้งาน</Text>

            <Radio.Group
              value={fontFamily}
              onChange={handleChangeFont}
              style={{ width: "100%", marginTop: 16 }}
            >
              <Flex vertical gap={12}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setFontFamily("google-sans")}
                  styles={{
                    body: {
                      borderColor:
                        fontFamily === "google-sans"
                          ? themeToken.colorPrimary
                          : themeToken.colorBorderSecondary,
                      backgroundColor:
                        fontFamily === "google-sans"
                          ? themeToken.colorPrimaryBg
                          : themeToken.colorBgContainer,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderRadius: 12,
                      padding: "12px",
                    },
                  }}
                >
                  <Radio
                    value="google-sans"
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-google-sans)",
                    }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ width: "100%", minWidth: 200 }}
                    >
                      <Text strong={fontFamily === "google-sans"}>
                        Google Sans
                      </Text>
                      {fontFamily === "google-sans" && (
                        <CheckCircleFilled
                          style={{ color: themeToken.colorPrimary }}
                        />
                      )}
                    </Flex>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  size="small"
                  onClick={() => setFontFamily("sukhumvit")}
                  styles={{
                    body: {
                      borderColor:
                        fontFamily === "sukhumvit"
                          ? themeToken.colorPrimary
                          : themeToken.colorBorderSecondary,
                      backgroundColor:
                        fontFamily === "sukhumvit"
                          ? themeToken.colorPrimaryBg
                          : themeToken.colorBgContainer,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderRadius: 12,
                      padding: "12px",
                    },
                  }}
                >
                  <Radio
                    value="sukhumvit"
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-sukhumvit)",
                    }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ width: "100%", minWidth: 200 }}
                    >
                      <Text strong={fontFamily === "sukhumvit"}>
                        Sukhumvit Set
                      </Text>
                      {fontFamily === "sukhumvit" && (
                        <CheckCircleFilled
                          style={{ color: themeToken.colorPrimary }}
                        />
                      )}
                    </Flex>
                  </Radio>
                </Card>
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
