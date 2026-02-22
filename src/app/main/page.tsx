"use client";

import DashboardLayout from "@/components/layouts/backend-layout";
import { useSidebarMenu } from "@/constants/sidebar-menu-constant";
import {
  CompassOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
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
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import axios from "axios";

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
      <Flex
        vertical
        align="center"
        style={{ padding: "80px 24px", minHeight: "100%" }}
      >
        <Flex
          vertical
          align="center"
          gap={24}
          style={{ marginBottom: 80, textAlign: "center", width: "100%" }}
        >
          <Flex
            align="center"
            gap={12}
            style={{
              background: themeToken.colorPrimaryBg,
              padding: "10px 24px",
              borderRadius: 50,
              border: `1px solid ${themeToken.colorPrimaryBorder}`,
            }}
          >
            <CompassOutlined
              style={{ color: themeToken.colorPrimary, fontSize: 20 }}
            />
            <Text
              strong
              style={{ color: themeToken.colorPrimary, fontSize: 16 }}
            >
              Navigation Hub
            </Text>
          </Flex>

          <Flex vertical gap={8}>
            <Title
              level={1}
              style={{
                margin: 0,
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              Web Helper Central
            </Title>
            <Flex align="center" justify="center" gap={8}>
              <Text type="secondary" style={{ fontSize: 20 }}>
                ศูนย์รวมเครื่องมือและระบบจัดการทั้งหมดที่คุณต้องการ
              </Text>
              <Tooltip title="ค้นหาเมนูได้ทั้งชื่อกลุ่มและชื่อระบบย่อย">
                <InfoCircleOutlined
                  style={{
                    color: themeToken.colorTextQuaternary,
                    cursor: "help",
                  }}
                />
              </Tooltip>
            </Flex>
          </Flex>

          <Flex style={{ width: "100%", maxWidth: 720, marginTop: 40 }}>
            <Input
              size="large"
              placeholder="ค้นหาระบบที่ต้องการใช้งาน..."
              prefix={
                <SearchOutlined
                  style={{
                    color: themeToken.colorTextPlaceholder,
                    fontSize: 22,
                    marginRight: 8,
                  }}
                />
              }
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              allowClear
              style={{
                height: 72,
                borderRadius: 36,
                fontSize: 20,
                paddingInlineStart: 32,
                boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
                border: "none",
              }}
            />
          </Flex>
        </Flex>

        {filteredNavigationGroups.length > 0 ? (
          <Row gutter={[40, 40]} style={{ width: "100%", maxWidth: 1600 }}>
            {[
              menuColumns.listAlpha,
              menuColumns.listBeta,
              menuColumns.listGamma,
            ].map((columnList, colIndex) => (
              <Col xs={24} md={colIndex === 2 ? 0 : 12} lg={8} key={colIndex}>
                <Flex vertical gap={40}>
                  {columnList.map((navigationGroup, groupIndex) => (
                    <Card
                      key={groupIndex}
                      hoverable
                      style={{
                        borderRadius: 32,
                        border: `1px solid ${themeToken.colorBorderSecondary}`,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                        overflow: "hidden",
                      }}
                      styles={{
                        body: {
                          padding: 0,
                          display: "flex",
                          flexDirection: "column",
                        },
                      }}
                    >
                      <Flex
                        vertical
                        gap={12}
                        style={{
                          padding: "32px 32px 24px",
                          background: `linear-gradient(145deg, ${themeToken.colorFillQuaternary} 0%, transparent 100%)`,
                          borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
                        }}
                      >
                        <Flex align="center" gap={20}>
                          <Flex
                            align="center"
                            justify="center"
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 20,
                              background: themeToken.colorBgContainer,
                              boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
                              fontSize: 32,
                              color: themeToken.colorPrimary,
                            }}
                          >
                            {navigationGroup.icon}
                          </Flex>
                          <Title
                            level={3}
                            style={{ margin: 0, fontWeight: 800 }}
                          >
                            {navigationGroup.label}
                          </Title>
                        </Flex>
                      </Flex>

                      <Flex vertical gap={24} style={{ padding: 24 }}>
                        {navigationGroup.children?.map(
                          (childCategory, categoryIndex) => (
                            <Flex vertical key={categoryIndex} gap={12}>
                              {childCategory.children ? (
                                <Flex vertical gap={12}>
                                  <Flex
                                    align="center"
                                    gap={8}
                                    style={{ paddingLeft: 8 }}
                                  >
                                    <Text
                                      strong
                                      style={{
                                        fontSize: 13,
                                        color: themeToken.colorPrimary,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      {childCategory.label}
                                    </Text>
                                  </Flex>
                                  <Flex vertical gap={4}>
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
                                            height: "auto",
                                            padding: "16px 20px",
                                            borderRadius: 16,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            textAlign: "left",
                                          }}
                                        >
                                          <Flex
                                            align="center"
                                            gap={16}
                                            style={{
                                              flex: 1,
                                              overflow: "hidden",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 20,
                                                color:
                                                  themeToken.colorTextSecondary,
                                                display: "flex",
                                              }}
                                            >
                                              {leafItem.icon}
                                            </Text>
                                            <Text
                                              strong
                                              style={{
                                                fontSize: 16,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {leafItem.label}
                                            </Text>
                                          </Flex>
                                          <Flex align="center" gap={8}>
                                            {leafItem.news && (
                                              <Tag
                                                color="error"
                                                style={{ borderRadius: 10 }}
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
                                            />
                                          </Flex>
                                        </Button>
                                      ),
                                    )}
                                  </Flex>
                                </Flex>
                              ) : (
                                <Button
                                  type="text"
                                  onClick={() =>
                                    handleNavigationRedirect(childCategory.href)
                                  }
                                  style={{
                                    height: "auto",
                                    padding: "16px 20px",
                                    borderRadius: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    textAlign: "left",
                                  }}
                                >
                                  <Flex
                                    align="center"
                                    gap={16}
                                    style={{ flex: 1, overflow: "hidden" }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 20,
                                        color: themeToken.colorTextSecondary,
                                        display: "flex",
                                      }}
                                    >
                                      {childCategory.icon}
                                    </Text>
                                    <Text
                                      strong
                                      style={{
                                        fontSize: 16,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {childCategory.label}
                                    </Text>
                                  </Flex>
                                  <Flex align="center" gap={8}>
                                    {childCategory.news && (
                                      <Tag
                                        color="error"
                                        style={{ borderRadius: 10 }}
                                      >
                                        NEW
                                      </Tag>
                                    )}
                                    <ArrowRightOutlined
                                      style={{
                                        fontSize: 12,
                                        color: themeToken.colorTextQuaternary,
                                      }}
                                    />
                                  </Flex>
                                </Button>
                              )}
                            </Flex>
                          ),
                        )}
                      </Flex>
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
            style={{ padding: "120px 0" }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Flex vertical gap={12}>
                  <Text
                    style={{
                      fontSize: 24,
                      color: themeToken.colorTextSecondary,
                      fontWeight: 600,
                    }}
                  >
                    ไม่พบข้อมูลที่ค้นหา
                  </Text>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    ลองตรวจสอบคำค้นหา หรือพิมพ์คำอื่นแทนนะครับ
                  </Text>
                </Flex>
              }
            />
          </Flex>
        )}
      </Flex>
    </DashboardLayout>
  );
}
