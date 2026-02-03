"use client";

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  FileProtectOutlined,
  FireOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  ReadOutlined,
  RestOutlined,
  SmileOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Modal,
  Row,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import type { SchoolDetail } from "../types/bypass.types";
import { BYPASS_TARGETS } from "../utils/bypass-targets";

const { Text, Title } = Typography;

const TARGET_ICON_MAP: Record<string, React.ReactNode> = {
  system: <AppstoreOutlined />,
  academic: <ReadOutlined />,
  accounting: <WalletOutlined />,
  library: <BookOutlined />,
  canteen: <RestOutlined />,
  kindergarten: <SmileOutlined />,
  activity: <FireOutlined />,
  exam: <FileProtectOutlined />,
};

type BypassSelectionModalProps = {
  open: boolean;
  onClose: () => void;
  school: SchoolDetail | null;
  onSelect: (targetKey: string, envKey: string) => void;
};

export default function BypassSelectionModal({
  open,
  onClose,
  school,
  onSelect,
}: BypassSelectionModalProps) {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const isDarkMode = token.colorBgBase !== "#ffffff";

  if (!school) return null;

  const TARGET_DESC_MAP: Record<string, string> = {
    system: TRANSLATION("bypass_page.targets.system"),
    academic: TRANSLATION("bypass_page.targets.academic"),
    accounting: TRANSLATION("bypass_page.targets.accounting"),
    library: TRANSLATION("bypass_page.targets.library"),
    canteen: TRANSLATION("bypass_page.targets.canteen"),
    kindergarten: TRANSLATION("bypass_page.targets.kindergarten"),
    activity: TRANSLATION("bypass_page.targets.activity"),
    exam: TRANSLATION("bypass_page.targets.exam"),
  };

  const ENV_DESC_MAP: Record<string, string> = {
    production: TRANSLATION("bypass_page.environments.production_desc"),
    staging: TRANSLATION("bypass_page.environments.staging_desc"),
    development: TRANSLATION("bypass_page.environments.development_desc"),
    ui: TRANSLATION("bypass_page.environments.ui_desc"),
    legacy: TRANSLATION("bypass_page.environments.legacy_desc"),
  };

  const ENV_NAME_MAP: Record<string, string> = {
    production: TRANSLATION("bypass_page.environments.production"),
    staging: TRANSLATION("bypass_page.environments.staging"),
    development: TRANSLATION("bypass_page.environments.development"),
    ui: TRANSLATION("bypass_page.environments.ui"),
    legacy: TRANSLATION("bypass_page.environments.legacy"),
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1300}
      centered
      styles={{
        content: {
          borderRadius: 32,
          padding: 0,
          overflow: "hidden",
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
        },
        body: {
          padding: 0,
        },
      }}
      title={null}
      closable={false}
    >
      <Row gutter={0} style={{ minHeight: 600 }}>
        {/* Left Side: School Info */}
        <Col
          xs={24}
          md={8}
          style={{
            padding: 40,
            background: isDarkMode
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex
            vertical
            gap={40}
            justify="space-between"
            style={{ height: "100%" }}
          >
            <Flex vertical gap={24}>
              <Flex
                justify="center"
                align="center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  fontSize: 32,
                  color: "#fff",
                  boxShadow: `0 8px 16px ${token.colorPrimary}40`,
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                }}
              >
                <BankOutlined />
              </Flex>

              <Flex vertical gap={8}>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                  {TRANSLATION("bypass_page.selection_modal.access_title")}
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {TRANSLATION("bypass_page.selection_modal.access_subtitle")}
                </Text>
                <Text
                  strong
                  style={{
                    color: token.colorPrimary,
                    fontSize: 22,
                    marginTop: 8,
                  }}
                >
                  {school.company_name}
                </Text>
              </Flex>

              <Divider style={{ margin: "8px 0" }} />

              <Flex vertical gap={24}>
                <Flex vertical gap={4}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    {TRANSLATION("bypass_page.selection_modal.label_school_id")}
                  </Text>
                  <Text
                    strong
                    style={{ fontSize: 24, fontFamily: "monospace" }}
                  >
                    {school.school_id || "-"}
                  </Text>
                </Flex>
                <Flex vertical gap={4}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    {TRANSLATION("bypass_page.selection_modal.label_province")}
                  </Text>
                  <Text strong style={{ fontSize: 20 }}>
                    {school.province || "-"}
                  </Text>
                </Flex>
                <Flex vertical gap={4}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    {TRANSLATION("bypass_page.selection_modal.label_group")}
                  </Text>
                  <Tag
                    color="blue"
                    bordered={false}
                    style={{
                      fontSize: 16,
                      width: "fit-content",
                      padding: "4px 12px",
                    }}
                  >
                    {school.school_group ||
                      TRANSLATION("bypass_page.not_specified")}
                  </Tag>
                </Flex>
              </Flex>
            </Flex>

            <Button
              block
              size="large"
              onClick={onClose}
              style={{
                borderRadius: 16,
                height: 54,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {TRANSLATION("bypass_page.selection_modal.btn_cancel")}
            </Button>
          </Flex>
        </Col>

        {/* Right Side: Selection Grid */}
        <Col
          xs={24}
          md={16}
          style={{
            padding: 40,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Flex vertical gap={32}>
            {/* CS Guide Section */}
            <Alert
              message={
                <Text strong style={{ fontSize: 16 }}>
                  {TRANSLATION("bypass_page.selection_modal.guide_title")}
                </Text>
              }
              description={
                <Flex vertical gap={6} style={{ marginTop: 8 }}>
                  <Text>
                    {TRANSLATION("bypass_page.selection_modal.guide_1")}
                  </Text>
                  <Text>
                    {TRANSLATION("bypass_page.selection_modal.guide_2")}
                  </Text>
                  <Text>
                    {TRANSLATION("bypass_page.selection_modal.guide_3")}
                  </Text>
                </Flex>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ fontSize: 24 }} />}
              style={{ borderRadius: 20, padding: 20 }}
            />

            <Flex vertical gap={20}>
              {Object.entries(BYPASS_TARGETS).map(
                ([targetKey, targetConfig]) => {
                  const isExamDisabled = targetKey === "exam";

                  return (
                    <Card
                      key={targetKey}
                      variant="borderless"
                      style={{
                        background: isExamDisabled
                          ? token.colorFillTertiary
                          : token.colorFillAlter,
                        borderRadius: 24,
                        opacity: isExamDisabled ? 0.6 : 1,
                      }}
                      styles={{ body: { padding: 24 } }}
                    >
                      <Flex vertical gap={20}>
                        <Flex justify="space-between" align="start">
                          <Flex gap={16}>
                            <Flex
                              justify="center"
                              align="center"
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                fontSize: 24,
                                background: token.colorBgContainer,
                                color: isExamDisabled
                                  ? token.colorTextDisabled
                                  : token.colorPrimary,
                              }}
                            >
                              {TARGET_ICON_MAP[targetKey] || <GlobalOutlined />}
                            </Flex>
                            <Flex vertical gap={4}>
                              <Flex align="center" gap={8}>
                                <Title
                                  level={4}
                                  style={{ margin: 0, fontWeight: 700 }}
                                >
                                  {TRANSLATION(
                                    `bypass_page.target_labels.${targetKey}`,
                                  ) || targetConfig.label}
                                </Title>
                                {isExamDisabled && (
                                  <Tag color="warning" bordered={false}>
                                    {TRANSLATION(
                                      "bypass_page.selection_modal.maintenance",
                                    )}
                                  </Tag>
                                )}
                              </Flex>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {isExamDisabled
                                  ? TRANSLATION(
                                      "bypass_page.selection_modal.maintenance_desc",
                                    )
                                  : TARGET_DESC_MAP[targetKey]}
                              </Text>
                            </Flex>
                          </Flex>
                          <Tooltip title={TARGET_DESC_MAP[targetKey]}>
                            <InfoCircleOutlined
                              style={{ color: token.colorTextQuaternary }}
                            />
                          </Tooltip>
                        </Flex>

                        <Row gutter={[12, 12]}>
                          {Object.entries(targetConfig.environments).map(
                            ([environmentKey, environmentConfig]) => {
                              const isProduction =
                                environmentKey === "production";
                              return (
                                <Col xs={12} sm={8} key={environmentKey}>
                                  <Tooltip title={ENV_DESC_MAP[environmentKey]}>
                                    <Button
                                      block
                                      size="large"
                                      type={
                                        isProduction ? "primary" : "default"
                                      }
                                      icon={<ArrowRightOutlined />}
                                      iconPosition="end"
                                      onClick={() =>
                                        onSelect(targetKey, environmentKey)
                                      }
                                      disabled={isExamDisabled}
                                      style={{
                                        height: 50,
                                        borderRadius: 14,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontWeight: 800,
                                        fontSize: 13,
                                        letterSpacing: "0.5px",
                                        fontFamily:
                                          "'Segoe UI', Roboto, sans-serif",
                                        boxShadow: isProduction
                                          ? `0 4px 12px ${token.colorPrimary}40`
                                          : "none",
                                      }}
                                    >
                                      {ENV_NAME_MAP[environmentKey] ||
                                        environmentConfig.label}
                                    </Button>
                                  </Tooltip>
                                </Col>
                              );
                            },
                          )}
                        </Row>
                      </Flex>
                    </Card>
                  );
                },
              )}
            </Flex>
          </Flex>
        </Col>
      </Row>
    </Modal>
  );
}
