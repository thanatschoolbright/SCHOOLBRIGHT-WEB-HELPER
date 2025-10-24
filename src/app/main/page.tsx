"use client";

import React, { useState } from "react";
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

  // ตรวจสอบว่า i18n โหลดเสร็จแล้วหรือยัง
  const isI18nReady = i18n.isInitialized && i18n.hasResourceBundle(i18n.language, "menu");

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
      if (item.href.startsWith('http')) {
        window.open(item.href, '_blank');
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
    if (childItem.href.startsWith('http')) {
      window.open(childItem.href, '_blank');
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
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Title level={1} style={{ color: "#2c3e50", marginBottom: 8 }}>
            🚀 SchoolBright Helper
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            เลือกระบบที่ต้องการใช้งาน
          </Text>
        </div>

        {/* App Grid */}
        <Row gutter={[32, 40]} justify="center">
          {menuItems.map((item, index) => (
            <Col key={item.label} xs={12} sm={12} md={6} lg={6} xl={6}>
              <div style={{ position: "relative", textAlign: "center" }}>
                <Card
                  hoverable
                  onClick={() => handleAppClick(item)}
                  style={{
                    borderRadius: 28,
                    border: "none",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                    width: 256,
                    height: 256,
                    background: gradients[index % gradients.length],
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: "translateY(0)",
                    margin: "0 auto",
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
                      fontSize: 80,
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
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 1.4,
                    marginTop: 12,
                    display: "block",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
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
                      top: -8,
                      right: -8,
                      backgroundColor: "#ff4d4f",
                      boxShadow: "0 2px 8px rgba(255, 77, 79, 0.4)",
                      zIndex: 10,
                    }}
                  />
                )}

                {/* New Badge */}
                {item.children?.some((child: any) => child.news) && (
                  <div
                    style={{
                      position: "absolute",
                      top: -8,
                      left: -8,
                      backgroundColor: "#52c41a",
                      color: "white",
                      fontSize: 10,
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: 8,
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
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
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
        width={400}
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
          },
          content: {
            padding: 0,
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          },
        }}
        closeIcon={null}
      >
        {selectedApp && (
          <div style={{ padding: '24px' }}>
            {/* Header with App Info */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 24,
              position: 'relative'
            }}>
              {/* Close Button */}
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClosePopup}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  color: '#666',
                }}
              />
              
              {/* App Icon */}
              <div style={{ 
                fontSize: 48, 
                marginBottom: 12,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}>
                {selectedApp.icon}
              </div>
              
              {/* App Name */}
              <Title level={4} style={{ 
                margin: 0, 
                color: '#1f2937',
                fontSize: 18,
                fontWeight: 600
              }}>
                {selectedApp.label}
              </Title>
            </div>

            {/* Sub Menu Grid */}
            <Row gutter={[16, 16]}>
              {selectedApp.children?.map((child: any, index: number) => (
                <Col span={12} key={child.label}>
                  <Card
                    hoverable
                    onClick={() => handleSubMenuClick(child)}
                    style={{
                      borderRadius: 16,
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      height: 100,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'white',
                    }}
                    styles={{
                      body: {
                        padding: '12px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '8px',
                      },
                    }}
                  >
                    {/* Sub Menu Icon */}
                    {child.icon && (
                      <div
                        style={{
                          fontSize: 24,
                          color: '#6366f1',
                          marginBottom: 4,
                        }}
                      >
                        {child.icon}
                      </div>
                    )}
                    
                    <Text
                      strong
                      style={{
                        fontSize: 11,
                        color: '#374151',
                        lineHeight: 1.2,
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {child.label}
                    </Text>
                    
                    {/* New Badge for Sub Menu */}
                    {child.news && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: '#10b981',
                          color: 'white',
                          fontSize: 8,
                          fontWeight: 'bold',
                          padding: '1px 4px',
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
