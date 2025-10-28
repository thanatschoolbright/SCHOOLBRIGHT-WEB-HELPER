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
  // hovered submenu index for subtle icon shadow on hover/focus
  const [hoveredSubIndex, setHoveredSubIndex] = useState<number | null>(null);

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

  // สี gradient สำหรับวงกลม icon (ทิศทางเดียวกัน เพื่อความเป็น iOS-like minimal)
  // เก็บเป็นคู่สี แล้วใส่ `linear-gradient(135deg, ...)` ทุกชิ้นเพื่อความสม่ำเสมอ
  const gradients = [
    ["#667eea", "#764ba2"],
    ["#f093fb", "#f5576c"],
    ["#4facfe", "#00f2fe"],
    ["#43e97b", "#38f9d7"],
    ["#fa709a", "#fee140"],
    ["#a8edea", "#fed6e3"],
    ["#ffecd2", "#fcb69f"],
    ["#ff8a80", "#ea80fc"],
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
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                    width: "100%",
                    height:
                      screenSize === "mobile"
                        ? 140
                        : screenSize === "tablet"
                        ? 180
                        : screenSize === "desktop"
                        ? 220
                        : 180,
                    background: "rgba(255,255,255,0.9)",
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
                  {/* Icon circle (consistent gradient direction) with badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    {(() => {
                      const [c1, c2] = gradients[index % gradients.length];
                      const circleSize =
                        screenSize === "mobile"
                          ? 72
                          : screenSize === "tablet"
                          ? 96
                          : screenSize === "desktop"
                          ? 120
                          : 96;
                      // increased icon sizes for stronger visual presence (mobile/tablet/desktop)
                      const iconFontSize =
                        screenSize === "mobile"
                          ? 44
                          : screenSize === "tablet"
                          ? 68
                          : screenSize === "desktop"
                          ? 96
                          : 68;

                      return (
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          {/* Numeric badge on top-right of icon (custom, avoids AntD offset quirks) */}
                          {getChildrenCount(item.children) > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                zIndex: 15,
                                minWidth: 20,
                                height: 20,
                                padding: "0 6px",
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#ff4d4f",
                                color: "white",
                                fontSize: 12,
                                fontWeight: 700,
                                boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
                              }}
                            >
                              {getChildrenCount(item.children)}
                            </div>
                          )}

                          {/* NEW flag top-left */}
                          {item.children?.some((child: any) => child.news) && (
                            <div
                              style={{
                                position: "absolute",
                                left: -6,
                                top: -6,
                                zIndex: 14,
                              }}
                            >
                              <div
                                style={{
                                  backgroundColor: "#10b981",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "1px 6px",
                                  borderRadius: 8,
                                  boxShadow: "0 6px 18px rgba(16,185,129,0.12)",
                                  transform: "translate(-30%, -30%)",
                                }}
                              >
                                NEW
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              width: circleSize,
                              height: circleSize,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: c2,
                              background: "transparent",
                              boxShadow: "none",
                            }}
                          >
                            <div
                              style={{
                                fontSize: iconFontSize,
                                lineHeight: 1,
                                color: "#000",
                                opacity: 0.9,
                                // SVG hint: prefer thinner strokes where icons support currentColor/strokeWidth
                                strokeWidth: 1,
                                vectorEffect: "non-scaling-stroke",
                              }}
                            >
                              {item.icon}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>

                {/* App Name - ย้ายออกมาข้างนอก Card */}
                <Text
                  style={{
                    fontWeight: 400,
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
              overflow:
                isMobile || screenSize === "desktop" ? "auto" : "visible",
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
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSubMenuClick(child)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleSubMenuClick(child);
                      }}
                      style={{
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: "transparent",
                        display: "flex",
                        padding: isMobile ? "8px 12px" : screenSize === "desktop" ? "20px" : screenSize === "tablet" ? "16px" : "12px",
                        
                        borderRadius: 16,
                        
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        gap: isMobile ? "8px" : "12px",
                      }}
                    >

                        {/* Sub Menu Icon: separated into its own rounded square container */}
                        {child.icon && (
                          <div
                            onMouseEnter={() => setHoveredSubIndex(index)}
                            onMouseLeave={() => setHoveredSubIndex(null)}
                            onFocus={() => setHoveredSubIndex(index)}
                            onBlur={() => setHoveredSubIndex(null)}
                            style={{
                              width: isMobile ? 44 : screenSize === "desktop" ? 64 : 56,
                              height: isMobile ? 44 : screenSize === "desktop" ? 64 : 56,
                              borderRadius: 12,
                              background: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 8,
                              flexShrink: 0,
                              transition: "box-shadow 160ms ease, transform 160ms ease",
                              boxShadow:
                                hoveredSubIndex === index
                                  ? "0 6px 18px rgba(0,0,0,0.12)"
                                  : "0 2px 6px rgba(0,0,0,0.04)",
                              transform: hoveredSubIndex === index ? "translateY(-3px)" : "none",
                            }}
                          >
                            <div
                              style={{
                                fontSize: isMobile
                                  ? Math.round(20 * 1.2)
                                  : screenSize === "desktop"
                                  ? Math.round(32 * 1.2)
                                  : screenSize === "tablet"
                                  ? Math.round(28 * 1.2)
                                  : Math.round(24 * 1.2),
                                color: "#0f1724",
                                opacity: 0.85,
                                // hint to SVG icons to use thinner strokes where possible
                                strokeWidth: 1,
                                vectorEffect: "non-scaling-stroke",
                                lineHeight: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {child.icon}
                            </div>
                          </div>
                        )}

                        <Text
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
                            textAlign: "center",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            flex: "none",
                            fontWeight: 400,
                          }}
                        >
                          {child.label}
                           {/* New Badge for Sub Menu */}
                      {child.news && (
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 64,
                            zIndex: 15,
                            backgroundColor: "#10b981",
                            color: "white",
                            fontSize: 12,
                            fontWeight: "bold",
                            padding: "1px 4px",
                            borderRadius: 4,
                            lineHeight: 1,
                          }}
                        >
                          NEW
                        </div>
                      )}
                          
                        </Text>

                     
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
