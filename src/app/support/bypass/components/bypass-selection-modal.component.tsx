"use client";

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  CarOutlined,
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
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SchoolDetail } from "../types/bypass.types";
import { BYPASS_TARGETS } from "../utils/bypass-targets";

const { Text, Title } = Typography;

type BypassSelectionModalProps = {
  open: boolean;
  onClose: () => void;
  school: SchoolDetail | null;
  onSelect: (targetKey: string, environmentKey: string) => void;
};

export default function BypassSelectionModal({
  open,
  onClose,
  school,
  onSelect,
}: BypassSelectionModalProps) {
  const { t: translate } = useTranslation("translate");
  const { token } = theme.useToken();

  const isDarkModeActive = useMemo(
    () => token.colorBgBase !== "#ffffff",
    [token.colorBgBase],
  );

  const targetIconMap: Record<string, React.ReactNode> = useMemo(
    () => ({
      system: <AppstoreOutlined />,
      academic: <ReadOutlined />,
      accounting: <WalletOutlined />,
      library: <BookOutlined />,
      canteen: <RestOutlined />,
      kindergarten: <SmileOutlined />,
      activity: <FireOutlined />,
      exam: <FileProtectOutlined />,
      bus: <CarOutlined />,
    }),
    [],
  );

  const targetDescriptionMap: Record<string, string> = useMemo(
    () => ({
      system: translate("bypass_page.targets.system"),
      academic: translate("bypass_page.targets.academic"),
      accounting: translate("bypass_page.targets.accounting"),
      library: translate("bypass_page.targets.library"),
      canteen: translate("bypass_page.targets.canteen"),
      kindergarten: translate("bypass_page.targets.kindergarten"),
      activity: translate("bypass_page.targets.activity"),
      exam: translate("bypass_page.targets.exam"),
      bus: translate("bypass_page.targets.bus"),
    }),
    [translate],
  );

  const environmentDescriptionMap: Record<string, string> = useMemo(
    () => ({
      production: translate("bypass_page.environments.production_desc"),
      staging: translate("bypass_page.environments.staging_desc"),
      development: translate("bypass_page.environments.development_desc"),
      ui: translate("bypass_page.environments.ui_desc"),
      legacy: translate("bypass_page.environments.legacy_desc"),
    }),
    [translate],
  );

  const environmentNameMap: Record<string, string> = useMemo(
    () => ({
      production: translate("bypass_page.environments.production"),
      staging: translate("bypass_page.environments.staging"),
      development: translate("bypass_page.environments.development"),
      ui: translate("bypass_page.environments.ui"),
      legacy: translate("bypass_page.environments.legacy"),
    }),
    [translate],
  );

  if (!school) {
    return null;
  }

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
        <Col
          xs={24}
          md={8}
          style={{
            padding: 40,
            background: isDarkModeActive
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
                  {translate("bypass_page.selection_modal.access_title")}
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {translate("bypass_page.selection_modal.access_subtitle")}
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
                    {translate("bypass_page.selection_modal.label_school_id")}
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
                    {translate("bypass_page.selection_modal.label_province")}
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
                    {translate("bypass_page.selection_modal.label_group")}
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
                      translate("bypass_page.not_specified")}
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
              {translate("bypass_page.selection_modal.btn_cancel")}
            </Button>
          </Flex>
        </Col>

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
            <Alert
              message={
                <Text strong style={{ fontSize: 16 }}>
                  {translate("bypass_page.selection_modal.guide_title")}
                </Text>
              }
              description={
                <Flex vertical gap={6} style={{ marginTop: 8 }}>
                  <Text>
                    {translate("bypass_page.selection_modal.guide_1")}
                  </Text>
                  <Text>
                    {translate("bypass_page.selection_modal.guide_2")}
                  </Text>
                  <Text>
                    {translate("bypass_page.selection_modal.guide_3")}
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
                ([targetKey, targetConfiguration]) => {
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
                              {targetIconMap[targetKey] || <GlobalOutlined />}
                            </Flex>
                            <Flex vertical gap={4}>
                              <Flex align="center" gap={8}>
                                <Title
                                  level={4}
                                  style={{ margin: 0, fontWeight: 700 }}
                                >
                                  {translate(
                                    `bypass_page.target_labels.${targetKey}`,
                                  ) || targetConfiguration.label}
                                </Title>
                                {targetKey === "bus" && (
                                  <Tag color="cyan" bordered={false}>
                                    {translate(
                                      "bypass_page.selection_modal.new_system",
                                    )}
                                  </Tag>
                                )}
                                {isExamDisabled && (
                                  <Tag color="warning" bordered={false}>
                                    {translate(
                                      "bypass_page.selection_modal.maintenance",
                                    )}
                                  </Tag>
                                )}
                              </Flex>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {isExamDisabled
                                  ? translate(
                                      "bypass_page.selection_modal.maintenance_desc",
                                    )
                                  : targetDescriptionMap[targetKey]}
                              </Text>
                            </Flex>
                          </Flex>
                          <Tooltip title={targetDescriptionMap[targetKey]}>
                            <InfoCircleOutlined
                              style={{ color: token.colorTextQuaternary }}
                            />
                          </Tooltip>
                        </Flex>

                        <Row gutter={[12, 12]}>
                          {Object.entries(targetConfiguration.environments).map(
                            ([environmentKey, environmentConfiguration]) => {
                              const isProductionEnvironment =
                                environmentKey === "production";
                              return (
                                <Col xs={12} sm={8} key={environmentKey}>
                                  <Tooltip
                                    title={
                                      environmentDescriptionMap[environmentKey]
                                    }
                                  >
                                    <Button
                                      block
                                      size="large"
                                      type={
                                        isProductionEnvironment
                                          ? "primary"
                                          : "default"
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
                                        boxShadow: isProductionEnvironment
                                          ? `0 4px 12px ${token.colorPrimary}40`
                                          : "none",
                                      }}
                                    >
                                      {environmentNameMap[environmentKey] ||
                                        environmentConfiguration.label}
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
