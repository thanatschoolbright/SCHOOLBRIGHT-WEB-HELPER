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
} from "antd";
import {
  SettingOutlined,
  FontSizeOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useFont } from "../providers/font-provider";

const { Text, Title } = Typography;

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const { fontFamily, setFontFamily } = useFont();

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24, width: 56, height: 56 }}
        onClick={showDrawer}
        tooltip={<div>ปรับแต่งเว็บไซต์</div>}
      />

      <Drawer
        title={
          <Space>
            <SettingOutlined />
            <span>ปรับแต่งหน้าเว็บไซต์</span>
          </Space>
        }
        placement="right"
        onClose={onClose}
        open={open}
        width={320}
        closeIcon={null}
        extra={
          <Text
            type="secondary"
            style={{ cursor: "pointer" }}
            onClick={onClose}
          >
            ปิด
          </Text>
        }
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <section>
            <Title level={5}>
              <FontSizeOutlined style={{ marginRight: 8 }} />
              เปลี่ยน Font
            </Title>
            <Text type="secondary">เลือกรูปแบบตัวอักษรที่ต้องการใช้งาน</Text>

            <div style={{ marginTop: 16 }}>
              <Radio.Group
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => setFontFamily("google-sans")}
                    style={{
                      borderColor:
                        fontFamily === "google-sans" ? "#FF8C00" : undefined,
                      backgroundColor:
                        fontFamily === "google-sans"
                          ? "rgba(255, 140, 0, 0.05)"
                          : undefined,
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
                        style={{ width: "100%" }}
                      >
                        <span>Google Sans</span>
                        {fontFamily === "google-sans" && (
                          <CheckCircleFilled style={{ color: "#FF8C00" }} />
                        )}
                      </Flex>
                    </Radio>
                  </Card>

                  <Card
                    hoverable
                    size="small"
                    onClick={() => setFontFamily("sukhumvit")}
                    style={{
                      borderColor:
                        fontFamily === "sukhumvit" ? "#FF8C00" : undefined,
                      backgroundColor:
                        fontFamily === "sukhumvit"
                          ? "rgba(255, 140, 0, 0.05)"
                          : undefined,
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
                        style={{ width: "100%" }}
                      >
                        <span>Sukhumvit Set</span>
                        {fontFamily === "sukhumvit" && (
                          <CheckCircleFilled style={{ color: "#FF8C00" }} />
                        )}
                      </Flex>
                    </Radio>
                  </Card>
                </Space>
              </Radio.Group>
            </div>
          </section>

          <Divider />

          <section style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              SchoolBright Web Helper Customizer v1.0
            </Text>
          </section>
        </Space>
      </Drawer>
    </>
  );
}
