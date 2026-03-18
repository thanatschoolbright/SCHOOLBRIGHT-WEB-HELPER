"use client";

import DashboardLayout from "@/components/layouts/backend-layout";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  ArrowRightOutlined,
  CompassOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Tag,
  theme,
  Typography,
} from "antd";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const { Title, Text } = Typography;

export default function MainDashboardPage() {
  const navigationRouter = useRouter();
  const navigationParams = useParams();
  const { data: sessionData, status: sessionStatus } = useSession();
  const { token: themeToken } = theme.useToken();
  const { modal: appModal } = App.useApp();
  const sidebarMenuItems = useSidebarMenu();

  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredNavigationGroups = useMemo(() => {
    if (!searchKeyword) return sidebarMenuItems;
    const lowerKeyword = searchKeyword.toLowerCase();

    return sidebarMenuItems
      .map((group) => {
        const isGroupMatched = group.label.toLowerCase().includes(lowerKeyword);

        const filteredChildren = group.children
          ?.map((child) => {
            const isChildMatched = child.label
              .toLowerCase()
              .includes(lowerKeyword);
            const filteredSubChildren = child.children?.filter((subChild) =>
              subChild.label.toLowerCase().includes(lowerKeyword),
            );

            if (
              isChildMatched ||
              (filteredSubChildren && filteredSubChildren.length > 0)
            ) {
              return {
                ...child,
                children:
                  filteredSubChildren && filteredSubChildren.length > 0
                    ? filteredSubChildren
                    : child.children,
              };
            }
            return null;
          })
          .filter(
            (child): child is NonNullable<typeof child> => child !== null,
          );

        if (isGroupMatched) return group;
        if (filteredChildren && filteredChildren.length > 0) {
          return { ...group, children: filteredChildren };
        }
        return null;
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
  }, [sidebarMenuItems, searchKeyword]);

  const handleNavigationRedirect = (targetUrl?: string) => {
    if (!targetUrl) return;
    if (targetUrl.startsWith("http")) {
      window.open(targetUrl, "_blank");
    } else {
      navigationRouter.push(targetUrl);
    }
  };

  const menuColumns = useMemo(() => {
    const listAlpha = filteredNavigationGroups.filter(
      (_, index) => index % 3 === 0,
    );
    const listBeta = filteredNavigationGroups.filter(
      (_, index) => index % 3 === 1,
    );
    const listGamma = filteredNavigationGroups.filter(
      (_, index) => index % 3 === 2,
    );
    return { listAlpha, listBeta, listGamma };
  }, [filteredNavigationGroups]);

  return (
    <DashboardLayout>
      <div
        style={{
          padding: "64px 32px",
          minHeight: "100%",
        }}
      >
        <Row gutter={[64, 64]} align="middle" style={{ marginBottom: 100 }}>
          <Col xs={24} lg={12}>
            <Flex vertical gap={24}>
              <Flex
                align="center"
                gap={12}
                style={{
                  background: themeToken.colorBgContainer,
                  padding: "8px 20px",
                  borderRadius: 50,
                  width: "fit-content",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: `1px solid ${themeToken.colorBorderSecondary}`,
                }}
              >
                <CompassOutlined
                  style={{ color: themeToken.colorPrimary, fontSize: 18 }}
                />
                <Text
                  strong
                  style={{
                    color: themeToken.colorPrimary,
                    fontSize: 14,
                    letterSpacing: "0.05em",
                  }}
                >
                  SYSTEM NAVIGATION HUB
                </Text>
              </Flex>

              <Title
                level={1}
                style={{
                  margin: 0,
                  fontSize: "clamp(48px, 5vw, 72px)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                }}
              >
                Web Helper <br />
                <span style={{ color: themeToken.colorPrimary }}>Central</span>
              </Title>

              <Text
                style={{
                  fontSize: 22,
                  color: themeToken.colorTextSecondary,
                  maxWidth: 600,
                  lineHeight: 1.6,
                }}
              >
                แหล่งรวมเครื่องมือและระบบจัดการทั้งหมดที่คุณต้องการ
                เข้าถึงทุกฟีเจอร์ได้ในที่เดียว
                เพื่อความสะดวกและรวดเร็วในการทำงาน
              </Text>

              <div style={{ maxWidth: 580, marginTop: 24 }}>
                <Input
                  size="large"
                  placeholder="ค้นหาระบบที่คุณต้องการใช้งาน..."
                  prefix={
                    <SearchOutlined
                      style={{
                        color: themeToken.colorTextPlaceholder,
                        fontSize: 22,
                        marginRight: 12,
                      }}
                    />
                  }
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  allowClear
                  style={{
                    height: 72,
                    borderRadius: 24,
                    fontSize: 18,
                    paddingInlineStart: 24,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
                    border: `1px solid ${themeToken.colorBorderSecondary}`,
                    background: themeToken.colorBgContainer,
                  }}
                />
              </div>
            </Flex>
          </Col>

          <Col xs={0} lg={12}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 480,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "120%",
                  height: "120%",
                  background: `radial-gradient(circle, ${themeToken.colorPrimaryBg} 0%, transparent 70%)`,
                  borderRadius: "50%",
                  zIndex: 0,
                  opacity: 0.6,
                }}
              />
              <Image
                src="/photo/undraw/undraw_login_weas.svg"
                alt="Navigation Illustration"
                width={560}
                height={420}
                style={{
                  objectFit: "contain",
                  zIndex: 1,
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))",
                }}
                priority
              />
            </div>
          </Col>
        </Row>

        {filteredNavigationGroups.length > 0 ? (
          <Row gutter={[32, 32]}>
            {[
              menuColumns.listAlpha,
              menuColumns.listBeta,
              menuColumns.listGamma,
            ].map((columnList, colIndex) => (
              <Col xs={24} md={12} lg={8} key={colIndex}>
                <Flex vertical gap={32}>
                  {columnList.map((navigationGroup, groupIndex) => (
                    <Card
                      key={groupIndex}
                      style={{
                        borderRadius: 28,
                        border: `1px solid ${themeToken.colorBorderSecondary}`,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      styles={{
                        body: {
                          padding: 0,
                        },
                      }}
                      className="menu-group-card"
                    >
                      <Flex
                        align="center"
                        gap={16}
                        style={{
                          padding: "24px 28px",
                          borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
                        }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            background: themeToken.colorPrimary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            color: "#FFF",
                            boxShadow: `0 8px 16px ${themeToken.colorPrimary}33`,
                          }}
                        >
                          {navigationGroup.icon}
                        </div>
                        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                          {navigationGroup.label}
                        </Title>
                      </Flex>

                      <div style={{ padding: 12 }}>
                        {navigationGroup.children?.map(
                          (childCategory, categoryIndex) => (
                            <Flex
                              vertical
                              key={categoryIndex}
                              style={{ marginBottom: 8 }}
                            >
                              {childCategory.children ? (
                                <Flex vertical>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 12,
                                      color: themeToken.colorTextQuaternary,
                                      padding: "12px 16px 8px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.1em",
                                    }}
                                  >
                                    {childCategory.label}
                                  </Text>
                                  {childCategory.children.map(
                                    (leafItem, leafIndex) => (
                                      <Button
                                        key={leafIndex}
                                        type="text"
                                        onClick={() =>
                                          handleNavigationRedirect(
                                            leafItem.href,
                                          )
                                        }
                                        style={{
                                          height: 56,
                                          padding: "0 16px",
                                          borderRadius: 12,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          marginBottom: 4,
                                          width: "100%",
                                        }}
                                        className="menu-item-btn"
                                      >
                                        <Flex
                                          align="center"
                                          gap={12}
                                          style={{ flex: 1, minWidth: 0 }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 20,
                                              color:
                                                themeToken.colorTextSecondary,
                                              width: 32,
                                              height: 32,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              background:
                                                themeToken.colorFillAlter,
                                              borderRadius: 8,
                                              flexShrink: 0,
                                            }}
                                          >
                                            {leafItem.icon}
                                          </div>
                                          <Text
                                            strong
                                            style={{
                                              fontSize: 15,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {leafItem.label}
                                          </Text>
                                        </Flex>
                                        <Flex
                                          align="center"
                                          gap={8}
                                          style={{ flexShrink: 0 }}
                                        >
                                          {leafItem.news && (
                                            <Tag
                                              color="error"
                                              style={{
                                                borderRadius: 6,
                                                fontSize: 10,
                                                fontWeight: 800,
                                                margin: 0,
                                                paddingInline: 6,
                                              }}
                                            >
                                              NEW
                                            </Tag>
                                          )}
                                          <ArrowRightOutlined
                                            style={{
                                              fontSize: 12,
                                              color:
                                                themeToken.colorTextQuaternary,
                                            }}
                                            className="arrow-icon"
                                          />
                                        </Flex>
                                      </Button>
                                    ),
                                  )}
                                </Flex>
                              ) : (
                                <Button
                                  type="text"
                                  onClick={() =>
                                    handleNavigationRedirect(childCategory.href)
                                  }
                                  style={{
                                    height: 56,
                                    padding: "0 16px",
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 4,
                                    width: "100%",
                                  }}
                                  className="menu-item-btn"
                                >
                                  <Flex
                                    align="center"
                                    gap={12}
                                    style={{ flex: 1, minWidth: 0 }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 20,
                                        color: themeToken.colorTextSecondary,
                                        width: 32,
                                        height: 32,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: themeToken.colorFillAlter,
                                        borderRadius: 8,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {childCategory.icon}
                                    </div>
                                    <Text
                                      strong
                                      style={{
                                        fontSize: 15,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {childCategory.label}
                                    </Text>
                                  </Flex>
                                  <Flex
                                    align="center"
                                    gap={8}
                                    style={{ flexShrink: 0 }}
                                  >
                                    {childCategory.news && (
                                      <Tag
                                        color="error"
                                        style={{
                                          borderRadius: 6,
                                          fontSize: 10,
                                          fontWeight: 800,
                                          margin: 0,
                                          paddingInline: 6,
                                        }}
                                      >
                                        NEW
                                      </Tag>
                                    )}
                                    <ArrowRightOutlined
                                      style={{
                                        fontSize: 12,
                                        color: themeToken.colorTextQuaternary,
                                      }}
                                      className="arrow-icon"
                                    />
                                  </Flex>
                                </Button>
                              )}
                            </Flex>
                          ),
                        )}
                      </div>
                    </Card>
                  ))}
                </Flex>
              </Col>
            ))}
          </Row>
        ) : (
          <Flex
            vertical
            align="center"
            justify="center"
            style={{
              padding: "100px 0",
              borderRadius: 40,
            }}
          >
            <Empty
              description={
                <Flex vertical gap={8}>
                  <Text strong style={{ fontSize: 20 }}>
                    ไม่พบบทความหรือเครื่องมือที่ระบุ
                  </Text>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    ลองค้นหาด้วยคำสำคัญอื่น หรือตรวจสอบตัวสะกดอีกครั้ง
                  </Text>
                </Flex>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Button
              size="large"
              type="primary"
              onClick={() => setSearchKeyword("")}
              style={{
                marginTop: 24,
                borderRadius: 12,
                height: 48,
                paddingInline: 32,
              }}
            >
              แสดงเมนูทั้งหมด
            </Button>
          </Flex>
        )}

        <style jsx global>{`
          .menu-group-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
            background: ${themeToken.colorBgElevated} !important;
          }
          .menu-item-btn:hover {
            background: ${themeToken.colorPrimary}0A !important;
          }
          .menu-item-btn:hover .arrow-icon {
            color: ${themeToken.colorPrimary} !important;
            transform: translateX(4px);
          }
          .menu-item-btn .arrow-icon {
            transition: all 0.3s ease;
          }
          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
            100% {
              transform: translateY(0px);
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
