"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Space,
  Input,
  Button,
  theme,
  Empty,
  Tag,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  RightOutlined,
  FireFilled,
  ThunderboltFilled,
  CompassOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/backend-layout";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";

const { Title, Text } = Typography;

export default function MainDashboardPage() {
  const router = useRouter();
  const { token } = theme.useToken();
  const menuItems = useSidebarMenu();
  const [searchText, setSearchText] = useState("");

  const filteredMenu = useMemo(() => {
    if (!searchText) return menuItems;
    const lowerSearch = searchText.toLowerCase();
    return menuItems
      .map((group) => {
        const groupMatch = group.label.toLowerCase().includes(lowerSearch);
        const filteredChildren = group.children?.filter((child) =>
          child.label.toLowerCase().includes(lowerSearch)
        );
        if (groupMatch) {
          return group;
        } else if (filteredChildren && filteredChildren.length > 0) {
          return { ...group, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as typeof menuItems;
  }, [menuItems, searchText]);

  const handleNavigate = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px" }}>
        {/* --- Header Section (Redesigned - Thai) --- */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Tooltip title="คลิกเมนูด้านล่างเพื่อเริ่มใช้งานระบบ">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: token.colorPrimaryBg,
                padding: "12px 24px",
                borderRadius: 100,
                marginBottom: 24,
                cursor: "help",
              }}
            >
              <CompassOutlined
                style={{
                  fontSize: 24,
                  color: token.colorPrimary,
                  marginRight: 8,
                }}
              />
              <Text strong style={{ color: token.colorPrimary, fontSize: 16 }}>
                เมนูนำทางด่วน
              </Text>
            </div>
          </Tooltip>

          <Title
            level={1}
            style={{ marginBottom: 16, fontWeight: 800, fontSize: 42 }}
          >
            หน้าหลัก (Dashboard)
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: 18, maxWidth: 600, display: "inline-block" }}
          >
            ศูนย์รวมเมนูและเครื่องมือจัดการระบบทั้งหมด เข้าถึงง่ายในที่เดียว
            <Tooltip title="พิมพ์ชื่อเมนูในช่องค้นหาด้านล่างเพื่อหาเมนูที่ต้องการอย่างรวดเร็ว">
              <InfoCircleOutlined
                style={{
                  marginLeft: 8,
                  cursor: "help",
                  color: token.colorTextTertiary,
                }}
              />
            </Tooltip>
          </Text>

          <div
            style={{
              maxWidth: 600,
              margin: "40px auto 0",
              position: "relative",
            }}
          >
            <Input
              size="large"
              placeholder="ค้นหาเมนูที่ต้องการใช้งาน..."
              prefix={
                <SearchOutlined
                  style={{
                    color: token.colorTextPlaceholder,
                    fontSize: 20,
                    marginRight: 8,
                  }}
                />
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{
                borderRadius: 100,
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                height: 60,
                fontSize: 18,
                border: "none",
                paddingLeft: 24,
              }}
            />
          </div>
        </div>

        {/* --- Modern Masonry Grid --- */}
        {filteredMenu.length > 0 ? (
          <div className="masonry-grid">
            {filteredMenu.map((group, index) => (
              <div className="masonry-item" key={index}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 24,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    background: token.colorBgContainer,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  styles={{
                    body: { padding: 0 },
                  }}
                  className="dashboard-card"
                >
                  {/* Card Header with Gradient */}
                  <div
                    style={{
                      padding: "24px 24px 20px",
                      background: `linear-gradient(135deg, ${token.colorFillQuaternary} 0%, ${token.colorBgContainer} 100%)`,
                      borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: token.colorBgContainer,
                        color: token.colorPrimary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      {group.icon}
                    </div>
                    <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                      {group.label}
                    </Title>
                  </div>

                  {/* Sub Menu List */}
                  <div
                    style={{
                      padding: "16px 16px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {group.children?.map((child, childIndex) => (
                      <Tooltip
                        key={childIndex}
                        title={`คลิกเพื่อไปที่หน้า ${child.label}`}
                        placement="right"
                        mouseEnterDelay={0.5}
                      >
                        <Button
                          type="text"
                          style={{
                            height: "auto",
                            padding: "12px 16px",
                            borderRadius: 12,
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            background: "transparent",
                          }}
                          onClick={() => handleNavigate(child.href)}
                          className="menu-item-modern"
                        >
                          <Space
                            align="center"
                            style={{ flex: 1, overflow: "hidden" }}
                          >
                            {child.icon && (
                              <div
                                className="menu-icon-wrapper"
                                style={{
                                  color: token.colorTextSecondary,
                                  fontSize: 18,
                                  width: 24,
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                {child.icon}
                              </div>
                            )}
                            <Text
                              strong
                              style={{
                                fontSize: 15,
                                color: token.colorText,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {child.label}
                            </Text>
                          </Space>

                          <Space size={8}>
                            {child.news && (
                              <Tag
                                color="#ff4d4f"
                                style={{
                                  margin: 0,
                                  borderRadius: 100,
                                  fontSize: 10,
                                  padding: "0 8px",
                                  border: "none",
                                }}
                              >
                                ใหม่
                              </Tag>
                            )}
                            {child.revamp && (
                              <Tag
                                color="cyan"
                                style={{
                                  margin: 0,
                                  borderRadius: 100,
                                  fontSize: 10,
                                  padding: "0 8px",
                                  border: "none",
                                }}
                              >
                                ปรับปรุง
                              </Tag>
                            )}
                            <RightOutlined
                              className="arrow-icon"
                              style={{
                                fontSize: 12,
                                color: token.colorTextQuaternary,
                                opacity: 0,
                              }}
                            />
                          </Space>
                        </Button>
                      </Tooltip>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 18 }}>
                    ไม่พบเมนูที่คุณค้นหา
                  </Text>
                  <Text type="secondary">
                    ลองตรวจสอบคำค้นหา หรือใช้คำอื่นดูนะครับ
                  </Text>
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* Global CSS for Masonry & Animations */}
      <style jsx global>{`
        /* Masonry Layout */
        .masonry-grid {
          column-count: 3;
          column-gap: 24px;
        }
        @media (max-width: 1200px) {
          .masonry-grid {
            column-count: 2;
          }
        }
        @media (max-width: 768px) {
          .masonry-grid {
            column-count: 1;
          }
        }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 24px;
        }

        /* Card Hover Effect */
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
        }

        /* Menu Item Interaction */
        .menu-item-modern:hover {
          background: ${token.colorFillQuaternary} !important;
          transform: translateX(6px);
        }
        .menu-item-modern:hover .menu-icon-wrapper {
          color: ${token.colorPrimary} !important;
        }
        .menu-item-modern:hover .arrow-icon {
          opacity: 1 !important;
          transform: translateX(4px);
        }
      `}</style>
    </DashboardLayout>
  );
}
