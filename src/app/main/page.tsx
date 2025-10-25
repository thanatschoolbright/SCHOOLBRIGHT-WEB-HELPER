"use client";

import React, { useState, useEffect } from "react";
import { Card, Typography, Badge, Row, Col, Spin, Modal, Button } from "antd";
import { useRouter } from "next/navigation";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import { useTranslation } from "react-i18next";
import { CloseOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Page() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const menuItems = useSidebarMenu();

  // State สำหรับ iOS-style popup
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  // State สำหรับ responsive
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [gridCols, setGridCols] = useState<number>(4);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        // Mobile: 2x2 grid
        setScreenSize("mobile");
        setIsMobile(true);
        setGridCols(2);
      } else if (width <= 1200) {
        // Tablet/iPad/MacBook Air: 3x3 grid
        setScreenSize("tablet");
        setIsMobile(false);
        setGridCols(3);
      } else {
        // Desktop/Large screens: 4x4 grid
        setScreenSize("desktop");
        setIsMobile(false);
        setGridCols(4);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // ตรวจสอบว่า i18n โหลดเสร็จแล้วหรือยัง
  const isI18nReady =
    i18n.isInitialized && i18n.hasResourceBundle(i18n.language, "menu");

  // แสดง loading ระหว่างรอ translation โหลด
  if (!isI18nReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // นับจำนวน children ทั้งหมดของแต่ละ menu
  const getChildrenCount = (children?: any[]) => {
    if (!children) return 0;
    return children.length;
  };

  // การจัดการการคลิก
  const handleAppClick = (item: any) => {
    // หากมี children ให้แสดง popup แบบ iOS
    if (item.children && item.children.length > 0) {
      setSelectedApp(item);
      setIsPopupVisible(true);
    }
    // หากมี href ตรงให้ไปตาม href
    else if (item.href) {
      // ตรวจสอบว่าเป็น external link หรือไม่
      if (item.href.startsWith("http")) {
        window.open(item.href, "_blank");
      } else {
        router.push(item.href);
      }
    }
  };

  // การจัดการการคลิกใน sub menu
  const handleSubMenuClick = (childItem: any) => {
    setIsPopupVisible(false);
    setSelectedApp(null);

    // ตรวจสอบว่าเป็น external link หรือไม่
    if (childItem.href.startsWith("http")) {
      window.open(childItem.href, "_blank");
    } else {
      router.push(childItem.href);
    }
  };

  // ปิด popup
  const handleClosePopup = () => {
    setIsPopupVisible(false);
    setSelectedApp(null);
  };

  // สี gradient แต่ละแถว
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: isMobile
          ? "20px 12px"
          : screenSize === "desktop"
          ? "60px 40px"
          : "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth:
            screenSize === "mobile"
              ? "100%"
              : screenSize === "tablet"
              ? 900
              : screenSize === "desktop"
              ? 1200
              : "100%",
          margin: "0 auto",
          paddingLeft: isMobile ? "8px" : screenSize === "desktop" ? "40px" : 0,
          paddingRight: isMobile
            ? "8px"
            : screenSize === "desktop"
            ? "40px"
            : 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: isMobile ? 24 : screenSize === "desktop" ? 60 : 40,
          }}
        >
          <Title
            level={isMobile ? 2 : 1}
            style={{
              color: "#2c3e50",
              marginBottom: 8,
              fontSize: isMobile
                ? "24px"
                : screenSize === "desktop"
                ? "48px"
                : screenSize === "tablet"
                ? "36px"
                : undefined,
              lineHeight: isMobile ? "1.2" : undefined,
            }}
          >
            🚀 SchoolBright Helper
          </Title>
          <Text
            type="secondary"
            style={{
              fontSize: isMobile
                ? 14
                : screenSize === "desktop"
                ? 20
                : screenSize === "tablet"
                ? 18
                : 16,
            }}
          >
            เลือกระบบที่ต้องการใช้งาน
          </Text>
        </div>

        {/* App Grid */}
        <Row
          gutter={
            isMobile
              ? [16, 20]
              : screenSize === "desktop"
              ? [40, 50]
              : screenSize === "tablet"
              ? [32, 40]
              : [24, 30]
          }
          justify="center"
          style={{
            margin: isMobile
              ? "0 -8px"
              : screenSize === "desktop"
              ? "0 -20px"
              : screenSize === "tablet"
              ? "0 -16px"
              : "0 -12px",
          }}
        >
          {menuItems.slice(0, gridCols * gridCols).map((item, index) => (
            <Col key={item.label} span={24 / gridCols}>
              <div style={{ position: "relative", textAlign: "center" }}>
                <Card
                  hoverable
                  onClick={() => handleAppClick(item)}
                  style={{
                    borderRadius: isMobile
                      ? 20
                      : screenSize === "desktop"
                      ? 32
                      : screenSize === "tablet"
                      ? 28
                      : 24,
                    border: "none",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                    width: "100%",
                    height:
                      screenSize === "mobile"
                        ? 140
                        : screenSize === "tablet"
                        ? 180
                        : screenSize === "desktop"
                        ? 220
                        : 180,
                    background: gradients[index % gradients.length],
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: "translateY(0)",
                    margin: "0 auto",
                    maxWidth:
                      screenSize === "mobile"
                        ? "180px"
                        : screenSize === "tablet"
                        ? "220px"
                        : screenSize === "desktop"
                        ? "280px"
                        : "220px",
                  }}
                  styles={{
                    body: {
                      padding: 0,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                    },
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 48px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(0, 0, 0, 0.12)";
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        screenSize === "mobile"
                          ? 40
                          : screenSize === "tablet"
                          ? 60
                          : screenSize === "desktop"
                          ? 80
                          : 60,
                      color: "white",
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    }}
                  >
                    {item.icon}
                  </div>
                </Card>

                {/* App Name - ย้ายออกมาข้างนอก Card */}
                <Text
                  strong
                  style={{
                    color: "#2c3e50",
                    fontSize:
                      screenSize === "mobile"
                        ? 12
                        : screenSize === "tablet"
                        ? 14
                        : screenSize === "desktop"
                        ? 16
                        : 14,
                    textAlign: "center",
                    lineHeight: 1.4,
                    marginTop: isMobile
                      ? 8
                      : screenSize === "desktop"
                      ? 16
                      : screenSize === "tablet"
                      ? 14
                      : 12,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: isMobile ? "normal" : "nowrap",
                    height: isMobile ? "auto" : "auto",
                    WebkitLineClamp: isMobile ? 2 : undefined,
                    WebkitBoxOrient: isMobile ? "vertical" : undefined,
                    display: isMobile ? "-webkit-box" : "block",
                  }}
                >
                  {item.label}
                </Text>

                {/* Badge สำหรับจำนวน features */}
                {getChildrenCount(item.children) > 0 && (
                  <Badge
                    count={getChildrenCount(item.children)}
                    style={{
                      position: "absolute",
                      top: isMobile
                        ? -6
                        : screenSize === "desktop"
                        ? -12
                        : screenSize === "tablet"
                        ? -10
                        : -8,
                      right: isMobile
                        ? -6
                        : screenSize === "desktop"
                        ? -12
                        : screenSize === "tablet"
                        ? -10
                        : -8,
                      backgroundColor: "#ff4d4f",
                      boxShadow: "0 2px 8px rgba(255, 77, 79, 0.4)",
                      zIndex: 10,
                      transform:
                        screenSize === "desktop"
                          ? "scale(1.2)"
                          : screenSize === "tablet"
                          ? "scale(1.1)"
                          : "scale(1)",
                    }}
                  />
                )}

                {/* New Badge */}
                {item.children?.some((child: any) => child.news) && (
                  <div
                    style={{
                      position: "absolute",
                      top: isMobile
                        ? -6
                        : screenSize === "desktop"
                        ? -12
                        : screenSize === "tablet"
                        ? -10
                        : -8,
                      left: isMobile
                        ? -6
                        : screenSize === "desktop"
                        ? -12
                        : screenSize === "tablet"
                        ? -10
                        : -8,
                      backgroundColor: "#52c41a",
                      color: "white",
                      fontSize: isMobile
                        ? 8
                        : screenSize === "desktop"
                        ? 12
                        : screenSize === "tablet"
                        ? 11
                        : 10,
                      fontWeight: "bold",
                      padding: isMobile
                        ? "1px 4px"
                        : screenSize === "desktop"
                        ? "3px 8px"
                        : screenSize === "tablet"
                        ? "2px 7px"
                        : "2px 6px",
                      borderRadius: isMobile
                        ? 6
                        : screenSize === "desktop"
                        ? 10
                        : screenSize === "tablet"
                        ? 9
                        : 8,
                      boxShadow: "0 2px 8px rgba(82, 196, 26, 0.4)",
                      zIndex: 10,
                    }}
                  >
                    NEW
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: isMobile
              ? 40
              : screenSize === "desktop"
              ? 80
              : screenSize === "tablet"
              ? 70
              : 60,
          }}
        >
          <Text
            type="secondary"
            style={{
              fontSize: isMobile
                ? 12
                : screenSize === "desktop"
                ? 18
                : screenSize === "tablet"
                ? 16
                : 14,
            }}
          >
            พัฒนาโดย SchoolBright Team 💙
          </Text>
        </div>
      </div>

      {/* iOS-Style Popup Modal */}
      <Modal
        open={isPopupVisible}
        onCancel={handleClosePopup}
        footer={null}
        centered
        width={
          isMobile
            ? "95vw"
            : screenSize === "mobile"
            ? "95vw"
            : screenSize === "tablet"
            ? 600
            : screenSize === "desktop"
            ? 800
            : 600
        }
        styles={{
          mask: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
          },
          content: {
            padding: 0,
            borderRadius: isMobile
              ? 16
              : screenSize === "desktop"
              ? 32
              : screenSize === "tablet"
              ? 28
              : 24,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            margin: isMobile ? "16px" : "auto",
            maxHeight: isMobile
              ? "90vh"
              : screenSize === "desktop"
              ? "85vh"
              : "auto",
            overflow: isMobile || screenSize === "desktop" ? "auto" : "visible",
          },
        }}
        closeIcon={null}
      >
        {selectedApp && (
          <div
            style={{
              padding: isMobile
                ? "16px"
                : screenSize === "desktop"
                ? "40px"
                : screenSize === "tablet"
                ? "32px"
                : "24px",
            }}
          >
            {/* Header with App Info */}
            <div
              style={{
                textAlign: "center",
                marginBottom: isMobile
                  ? 16
                  : screenSize === "desktop"
                  ? 32
                  : screenSize === "tablet"
                  ? 28
                  : 24,
                position: "relative",
              }}
            >
              {/* Close Button */}
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClosePopup}
                style={{
                  position: "absolute",
                  top: isMobile
                    ? -6
                    : screenSize === "desktop"
                    ? -12
                    : screenSize === "tablet"
                    ? -10
                    : -8,
                  right: isMobile
                    ? -6
                    : screenSize === "desktop"
                    ? -12
                    : screenSize === "tablet"
                    ? -10
                    : -8,
                  width: isMobile
                    ? 28
                    : screenSize === "desktop"
                    ? 40
                    : screenSize === "tablet"
                    ? 36
                    : 32,
                  height: isMobile
                    ? 28
                    : screenSize === "desktop"
                    ? 40
                    : screenSize === "tablet"
                    ? 36
                    : 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  border: "none",
                  color: "#666",
                  fontSize:
                    screenSize === "desktop"
                      ? "18px"
                      : screenSize === "tablet"
                      ? "16px"
                      : "14px",
                }}
              />

              {/* App Icon */}
              <div
                style={{
                  fontSize: isMobile
                    ? 36
                    : screenSize === "desktop"
                    ? 64
                    : screenSize === "tablet"
                    ? 56
                    : 48,
                  marginBottom: isMobile
                    ? 8
                    : screenSize === "desktop"
                    ? 16
                    : screenSize === "tablet"
                    ? 14
                    : 12,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              >
                {selectedApp.icon}
              </div>

              {/* App Name */}
              <Title
                level={isMobile ? 5 : 4}
                style={{
                  margin: 0,
                  color: "#1f2937",
                  fontSize: isMobile
                    ? 16
                    : screenSize === "desktop"
                    ? 24
                    : screenSize === "tablet"
                    ? 22
                    : 18,
                  fontWeight: 600,
                }}
              >
                {selectedApp.label}
              </Title>
            </div>

            {/* Sub Menu Grid */}
            <Row
              gutter={
                isMobile
                  ? [8, 8]
                  : screenSize === "desktop"
                  ? [24, 24]
                  : screenSize === "tablet"
                  ? [20, 20]
                  : [16, 16]
              }
            >
              {selectedApp.children?.map((child: any, index: number) => (
                <Col
                  span={
                    isMobile
                      ? 24
                      : screenSize === "desktop"
                      ? 8
                      : screenSize === "tablet"
                      ? 8
                      : 12
                  }
                  key={child.label}
                >
                  <Card
                    hoverable
                    onClick={() => handleSubMenuClick(child)}
                    style={{
                      borderRadius: isMobile
                        ? 12
                        : screenSize === "desktop"
                        ? 20
                        : screenSize === "tablet"
                        ? 18
                        : 16,
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                      height: isMobile
                        ? 60
                        : screenSize === "desktop"
                        ? 120
                        : screenSize === "tablet"
                        ? 110
                        : 100,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      background: "white",
                    }}
                    styles={{
                      body: {
                        padding: isMobile
                          ? "8px 12px"
                          : screenSize === "desktop"
                          ? "20px"
                          : screenSize === "tablet"
                          ? "16px"
                          : "12px",
                        height: "100%",
                        display: "flex",
                        flexDirection: isMobile ? "row" : "column",
                        justifyContent: isMobile ? "flex-start" : "center",
                        alignItems: "center",
                        textAlign: isMobile ? "left" : "center",
                        gap: isMobile
                          ? "12px"
                          : screenSize === "desktop"
                          ? "12px"
                          : screenSize === "tablet"
                          ? "10px"
                          : "8px",
                      },
                    }}
                  >
                    {/* Sub Menu Icon */}
                    {child.icon && (
                      <div
                        style={{
                          fontSize: isMobile
                            ? 20
                            : screenSize === "desktop"
                            ? 32
                            : screenSize === "tablet"
                            ? 28
                            : 24,
                          color: "#6366f1",
                          marginBottom: isMobile ? 0 : 4,
                          flexShrink: 0,
                        }}
                      >
                        {child.icon}
                      </div>
                    )}

                    <Text
                      strong
                      style={{
                        fontSize: isMobile
                          ? 12
                          : screenSize === "desktop"
                          ? 14
                          : screenSize === "tablet"
                          ? 13
                          : 11,
                        color: "#374151",
                        lineHeight: 1.2,
                        textAlign: isMobile ? "left" : "center",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        flex: isMobile ? 1 : "none",
                      }}
                    >
                      {child.label}
                    </Text>

                    {/* New Badge for Sub Menu */}
                    {child.news && (
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          backgroundColor: "#10b981",
                          color: "white",
                          fontSize: 8,
                          fontWeight: "bold",
                          padding: "1px 4px",
                          borderRadius: 4,
                          lineHeight: 1,
                        }}
                      >
                        NEW
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
