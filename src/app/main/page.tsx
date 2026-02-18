"use client";

import DashboardLayout from "@/components/layouts/backend-layout";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  CompassOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const { Title, Text } = Typography;

export default function MainDashboardPage() {
  const navigationRouter = useRouter();
  const { token: themeToken } = theme.useToken();
  const sidebarMenuItems = useSidebarMenu();
  const [filterSearchTextValue, setFilterSearchTextValue] = useState("");

  const filteredSidebarMenuItems = useMemo(() => {
    if (!filterSearchTextValue) return sidebarMenuItems;
    const lowerCaseSearchValue = filterSearchTextValue.toLowerCase();
    return sidebarMenuItems
      .map((group) => {
        const groupLabelMatches = group.label
          .toLowerCase()
          .includes(lowerCaseSearchValue);
        const filteredChildrenItems = group.children?.filter((child) =>
          child.label.toLowerCase().includes(lowerCaseSearchValue),
        );
        if (groupLabelMatches) {
          return group;
        } else if (filteredChildrenItems && filteredChildrenItems.length > 0) {
          return { ...group, children: filteredChildrenItems };
        }
        return null;
      })
      .filter(Boolean) as typeof sidebarMenuItems;
  }, [sidebarMenuItems, filterSearchTextValue]);

  const handleNavigationAction = (href?: string) => {
    if (href?.startsWith("http")) {
      window.open(href, "_blank");
    } else if (href) {
      navigationRouter.push(href);
    }
  };

  return (
    <DashboardLayout>
      <Flex
        vertical
        style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px" }}
      >
        <Flex vertical align="center" style={{ marginBottom: 64 }}>
          <Tooltip title="คลิกเมนูด้านล่างเพื่อเริ่มใช้งานระบบ">
            <Flex
              align="center"
              justify="center"
              style={{
                background: themeToken.colorPrimaryBg,
                padding: "12px 24px",
                borderRadius: 100,
                marginBottom: 24,
                cursor: "help",
              }}
            >
              <CompassOutlined
                style={{
                  fontSize: 24,
                  color: themeToken.colorPrimary,
                  marginRight: 8,
                }}
              />
              <Text
                strong
                style={{ color: themeToken.colorPrimary, fontSize: 16 }}
              >
                เมนูนำทางด่วน
              </Text>
            </Flex>
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
                  color: themeToken.colorTextTertiary,
                }}
              />
            </Tooltip>
          </Text>

          <Flex
            style={{
              width: "100%",
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
                    color: themeToken.colorTextPlaceholder,
                    fontSize: 20,
                    marginRight: 8,
                  }}
                />
              }
              value={filterSearchTextValue}
              onChange={(e) => setFilterSearchTextValue(e.target.value)}
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
          </Flex>
        </Flex>

        {filteredSidebarMenuItems.length > 0 ? (
          <div className="masonry-grid">
            {filteredSidebarMenuItems.map((group, index) => (
              <Flex vertical className="masonry-item" key={index}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 24,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    background: themeToken.colorBgContainer,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  styles={{
                    body: { padding: 0 },
                  }}
                  className="dashboard-card"
                >
                  <Flex
                    align="center"
                    gap={16}
                    style={{
                      padding: "24px 24px 20px",
                      background: `linear-gradient(135deg, ${themeToken.colorFillQuaternary} 0%, ${themeToken.colorBgContainer} 100%)`,
                      borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
                    }}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: themeToken.colorBgContainer,
                        color: themeToken.colorPrimary,
                        fontSize: 28,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      {group.icon}
                    </Flex>
                    <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                      {group.label}
                    </Title>
                  </Flex>

                  <Flex
                    vertical
                    gap={8}
                    style={{
                      padding: "16px 16px 24px",
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
                          onClick={() => handleNavigationAction(child.href)}
                          className="menu-item-modern"
                        >
                          <Space
                            align="center"
                            style={{ flex: 1, overflow: "hidden" }}
                          >
                            {child.icon && (
                              <Flex
                                align="center"
                                justify="center"
                                className="menu-icon-wrapper"
                                style={{
                                  color: themeToken.colorTextSecondary,
                                  fontSize: 18,
                                  width: 24,
                                }}
                              >
                                {child.icon}
                              </Flex>
                            )}
                            <Text
                              strong
                              style={{
                                fontSize: 15,
                                color: themeToken.colorText,
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
                                color: themeToken.colorTextQuaternary,
                                opacity: 0,
                              }}
                            />
                          </Space>
                        </Button>
                      </Tooltip>
                    ))}
                  </Flex>
                </Card>
              </Flex>
            ))}
          </div>
        ) : (
          <Flex
            vertical
            align="center"
            justify="center"
            style={{ padding: "80px 0" }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Flex vertical align="center" gap={8}>
                  <Text type="secondary" style={{ fontSize: 18 }}>
                    ไม่พบเมนูที่คุณค้นหา
                  </Text>
                  <Text type="secondary">
                    ลองตรวจสอบคำค้นหา หรือใช้คำอื่นดูนะครับ
                  </Text>
                </Flex>
              }
            />
          </Flex>
        )}
      </Flex>

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
          background: ${themeToken.colorFillQuaternary} !important;
          transform: translateX(6px);
        }
        .menu-item-modern:hover .menu-icon-wrapper {
          color: ${themeToken.colorPrimary} !important;
        }
        .menu-item-modern:hover .arrow-icon {
          opacity: 1 !important;
          transform: translateX(4px);
        }
      `}</style>
    </DashboardLayout>
  );
}
