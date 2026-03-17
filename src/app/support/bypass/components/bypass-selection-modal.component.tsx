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
  App,
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

const PostgresElephantIcon = () => (
  <svg
    viewBox="0 0 128 128"
    width="1em"
    height="1em"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M125.102 65.82c-.012-3.864-.523-7.712-1.522-11.458-1.517-5.713-3.999-11.127-7.38-16.096-3.327-4.887-7.46-9.157-12.28-12.695-4.722-3.468-10.04-6.17-15.795-8.025C62.464 15.652 50.145 15 41.677 15.004c-3.155.105-6.287.412-9.394.922-4.544.755-8.995 1.956-13.275 3.58a52.531 52.531 0 0 0-11.854 6.136c-2.85 1.93-5.46 4.14-7.794 6.61-2.158 2.274-3.977 4.793-5.41 7.49-1.393 2.616-2.427 5.372-3.078 8.212-.66 2.87-.992 5.804-.99 8.746.035 5.8 1.417 11.516 4.026 16.632.744 1.454 1.583 2.862 2.508 4.212-.516 1.492-.93 3.016-1.242 4.56-.474 2.336-.713 4.71-.715 7.086 0 2.37.234 4.734.7 7.058.462 2.31.144 4.67-.936 6.784-1.126 2.21-2.784 4.092-4.848 5.48-1.296.88-2.316 2.064-2.952 3.456-.632 1.392-.816 2.94-.528 4.416.29 1.472 1.054 2.8 2.184 3.79s2.556 1.54 4.056 1.56c3.24.032 6.48-.124 9.696-.464 4.688-.508 9.324-1.396 13.848-2.656 4.5-.184 8.976-.684 13.392-1.496 4.96-.912 9.872-2.108 14.688-3.584 4.88-.04 9.712-.628 14.448-1.752 4.59.04 9.144-.456 13.608-1.48 4.63-.588 9.18-1.576 13.608-2.952 4.31.136 8.576-.256 12.744-1.168.104-3.88.24-7.76.408-11.64.448 0 .896-.008 1.344-.024 1.12-.04 2.24-.04 3.36 0 1.152.04 2.304.032 3.44.024a13.9 13.9 0 0 0 3.36-.504c1.072-.32 2.048-.928 2.808-1.76a5.55 5.55 0 0 0 1.464-2.744c.264-1.12.184-2.304-.232-3.36-.424-1.056-1.168-1.936-2.12-2.52a8.88 8.88 0 0 0-2.488-.936c-1.344-.312-2.736-.36-4.104-.144-1.312.232-2.576.656-3.752 1.256-.44-.808-.832-1.648-1.176-2.52l-.432-1.128c-.144-.376-.28-.76-.408-1.144-.12-.392-.232-.784-.336-1.184-.104-.4-.2-.8-.288-1.208-.088-.408-.168-.824-.224-1.24-.064-.416-.112-.84-.136-1.264-.032-.424-.04-.848-.04-1.28l-.008-.664.008-.624.016-1.256c.032-.424.08-.848.144-1.272.064-.424.144-.84.248-1.256.096-.4.208-.8.336-1.2.12-.392.256-.784.408-1.168l.448-1.12a20.06 20.06 0 0 0 1.016-2.224 9.17 9.17 0 0 0 2.216-1.04 5.37 5.37 0 0 0 2.032-2.424c.448-1.04.568-2.216.344-3.328-.216-1.112-.76-2.136-1.568-2.912a5.45 5.45 0 0 0-2.616-1.44 8.78 8.78 0 0 0-3.12-.136 12.03 12.03 0 0 0-4.04 1.256c1.072-4.048 1.488-8.216 1.208-12.4zm-75.786-21.6c6.208-.432 12.44-.112 18.576.952 5.056.88 10.032 2.144 14.864 3.784 4.544 1.536 8.928 3.568 13.08 6.064s7.96 5.488 11.36 8.944c3.416 3.448 6.368 7.296 8.8 11.456 2.456 4.144 4.416 8.56 5.8 13.176 1.4 4.608 2.232 9.368 2.464 14.184.24 4.808-.032 9.632-.808 14.368.104.992.176 1.992.208 3 0 1.2-.08 2.4-.24 3.6a24.18 24.18 0 0 1-1.04 5.04c-.328.912-.76 1.784-1.28 2.6a11.96 11.96 0 0 1-.952 1.344c.48.048.96.088 1.44.112.96.056 1.92.056 2.88 0 .968-.056 1.928-.152 2.872-.28.936-.144 1.864-.32 2.768-.536.88-.232 1.736-.504 2.576-.816.824-.312 1.632-.664 2.4-.184a4.4 4.4 0 0 1 1.76 1.8 2.82 2.82 0 0 1 .152 2.264 2.88 2.88 0 0 1-1.224 1.608 7.07 7.07 0 0 1-2.48.96 17.5 17.5 0 0 1-3.648.512l-1.68.04H114.3c-2-.024-4 .024-5.992.144l-.24.016a24.6 24.6 0 0 1 .016-3.864c.032-1.288.136-2.576.312-3.856l1.376 2.16c.112.184.24.36.384.52.136.168.288.32.448.464.168.128.344.24.528.328a1.69 1.69 0 0 0 .688.16l2.12.04h1.056a2.62 2.62 0 0 0 .544-.064c.184-.048.352-.128.496-.24a1.44 1.44 0 0 0 .384-1.392 2.12 2.12 0 0 0-.616-.944 5.61 5.61 0 0 0-1.872-1.008c-.736-.24-1.504-.392-2.28-.456l-5.696-.336-.36-.024c.056-.472.104-.944.152-1.416l.168-1.584c.064-.52.12-.112.16.296.048.4.104.8.16 1.2.064.4.128.792.208 1.192.072.392.16.784.256 1.176.088.384.192.768.304 1.144.112.376.24.744.376 1.112.136.368.288.728.448 1.08.152.344.32.688.504 1.024.176.336.368.656.568.968l.064.08c-.28.168-.568.336-.872.488-.304.144-.616.28-.936.4-.328.12-.656.232-.992.32-.344.096-.696.176-1.048.24-.36.064-.72.112-1.088.152-.368.032-.736.056-1.112.072-.184 2.808-.432 5.616-.736 8.416-.304 2.8-.664 5.592-1.088 8.368-.216.032-.432.064-.648.096-.104.016-.216.032-.32.04h-.232c-3.568.512-7.184.776-10.824.776s-7.256-.264-10.816-.776h-.376c-.344.032-.696.064-1.04.096-.168-.008-.344-.016-.512-.016a282.85 282.85 0 0 1-10.376.992c-3.464.28-6.936.472-10.416.584-3.48.112-6.968.144-10.456.096l-.88-.016-1.12.024-3.856.128c-3.488.112-6.976.136-10.472.08-.344-.032-.696-.064-1.032-.096l-.52.016c-.08-.008-.16-.016-.24-.016-.232.008-.464.008-.696 0-3.512.44-7.064.656-10.616.632-1.504-.008-3.008-.112-4.432-.36-.456-.056-.912-.136-1.352-.24-.872-.256-1.4-.76-1.552-1.488-.16-.76.016-1.576.472-2.184.456-.608 1.136-.968 1.904-1.016 1.832-.072 3.664-.176 5.488-.304 2.368-.128 4.736-.344 7.08-.664 4.544-1.224 8.232-2.88 10.744-4.816h.048c2.472-1.896 4.416-4.528 5.632-7.6l2.352-6 2.368-6.176c1.152.024 2.304.016 3.44-.04 1.144-.056 2.272-.16 3.4-.304 2.224-.312 4.416-.8 6.544-1.464l.08.016.032.008c2.192.488 4.432.792 6.688.92s4.52.072 6.776-.144l2.216-.232 2.184.232c3.48.336 6.992.384 10.512.16.88-.04 1.76-.096 2.632-.168a23.9 23.9 0 0 1-5.12 1.936c-2.312.632-4.664 1.08-7.056 1.344a142.12 142.12 0 0 1-13.88 1.008c-9.288-.008-18.4-.784-27.424-2.32h-.032c-3.016-.512-5.992-1.184-8.888-2s-5.696-1.864-8.384-3.152l-2.024-1c-.672-.344-1.32-.712-1.952-1.104l-.944-.616c-.304-.216-.608-.432-.904-.664-.064-.048-.128-.096-.192-.144-1.616-1.368-3.048-2.904-4.288-4.584a28.44 28.44 0 0 1-2.928-5l-2.528-5.32c-.8-1.848-1.504-3.744-2.096-5.696-2.312-7.536-3.16-15.424-2.48-23.272.344-4.04 1.024-8.032 2.048-11.96 1.016-3.928 2.368-7.752 4.04-11.456 1.688-3.696 3.736-7.224 6.136-10.544 2.4-3.328 5.16-6.4 8.248-9.192 3.08-2.8 6.464-5.304 10.112-7.48a52.66 52.66 0 0 1 11.664-5.464c4.088-1.408 8.352-2.432 12.68-3.056 4.32-.632 8.704-.888 13.08-.76" />
  </svg>
);

const { Text, Title } = Typography;

type BypassSelectionModalProps = {
  open: boolean;
  onClose: () => void;
  school: SchoolDetail | null;
  onSelect: (targetKey: string, environmentKey: string) => void;
};

const BypassSelectionModal = ({
  open,
  onClose,
  school,
  onSelect,
}: BypassSelectionModalProps) => {
  const { t: translate } = useTranslation("translate");
  const { token } = theme.useToken();
  const { modal } = App.useApp();

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
      postgresql: translate("bypass_page.environments.postgresql_desc"),
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
      postgresql: translate("bypass_page.environments.postgresql"),
    }),
    [translate],
  );

  const coreSystemKeys = useMemo(
    () => ["system", "academic", "accounting", "canteen"],
    [],
  );

  const secondarySystemKeys = useMemo(
    () => ["bus", "kindergarten", "activity", "exam", "library"],
    [],
  );

  const renderBypassCards = (targetKeys: string[]) => (
    <Flex vertical gap={24}>
      {targetKeys.map((targetKey) => {
        const targetConfiguration = BYPASS_TARGETS[targetKey];
        if (!targetConfiguration) {
          return null;
        }

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
            styles={{ body: { padding: 32 } }}
          >
            <Flex vertical gap={24}>
              <Flex justify="space-between" align="start">
                <Flex gap={20}>
                  <Flex
                    justify="center"
                    align="center"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      fontSize: 28,
                      background: token.colorBgContainer,
                      color: isExamDisabled
                        ? token.colorTextDisabled
                        : token.colorPrimary,
                    }}
                  >
                    {targetIconMap[targetKey] || <GlobalOutlined />}
                  </Flex>
                  <Flex vertical gap={6}>
                    <Flex align="center" gap={12}>
                      <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                        {translate(`bypass_page.target_labels.${targetKey}`) ||
                          targetConfiguration.label}
                      </Title>
                      {targetKey === "bus" && (
                        <Tag color="cyan" bordered={false}>
                          {translate("bypass_page.selection_modal.new_system")}
                        </Tag>
                      )}
                      {isExamDisabled && (
                        <Tag color="warning" bordered={false}>
                          {translate("bypass_page.selection_modal.maintenance")}
                        </Tag>
                      )}
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 14 }}>
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

              <Row gutter={[16, 16]}>
                {Object.entries(targetConfiguration.environments).map(
                  ([environmentKey, environmentConfiguration]) => {
                    const isProductionEnvironment =
                      environmentKey === "production";
                    const isPostgresEnvironment =
                      environmentKey === "postgresql";

                    return (
                      <Col xs={12} sm={8} key={environmentKey}>
                        <Tooltip
                          title={environmentDescriptionMap[environmentKey]}
                        >
                          <Button
                            block
                            size="large"
                            type={
                              isProductionEnvironment
                                ? "primary"
                                : isPostgresEnvironment
                                  ? "default"
                                  : "default"
                            }
                            icon={
                              isPostgresEnvironment ? (
                                <PostgresElephantIcon />
                              ) : (
                                <ArrowRightOutlined />
                              )
                            }
                            iconPosition="end"
                            onClick={() => onSelect(targetKey, environmentKey)}
                            disabled={isExamDisabled}
                            style={{
                              height: 54,
                              borderRadius: 16,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontWeight: 800,
                              fontSize: 14,
                              letterSpacing: "0.5px",
                              fontFamily: "'Segoe UI', Roboto, sans-serif",
                              boxShadow: isProductionEnvironment
                                ? `0 4px 12px ${token.colorPrimary}40`
                                : isPostgresEnvironment
                                  ? "0 4px 12px rgba(51, 103, 145, 0.3)"
                                  : "none",
                              backgroundColor: isPostgresEnvironment
                                ? "#336791"
                                : undefined,
                              color: isPostgresEnvironment ? "#fff" : undefined,
                              border: isPostgresEnvironment
                                ? "none"
                                : undefined,
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
      })}
    </Flex>
  );

  if (!school) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1400}
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
      <Row gutter={0} style={{ minHeight: 700 }}>
        <Col
          xs={24}
          md={8}
          style={{
            padding: 48,
            background: isDarkModeActive
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex
            vertical
            gap={48}
            justify="space-between"
            style={{ height: "100%" }}
          >
            <Flex vertical gap={32}>
              <Flex
                justify="center"
                align="center"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  fontSize: 36,
                  color: "#fff",
                  boxShadow: `0 8px 16px ${token.colorPrimary}40`,
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                }}
              >
                <BankOutlined />
              </Flex>

              <Flex vertical gap={12}>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                  {translate("bypass_page.selection_modal.access_title")}
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {translate("bypass_page.selection_modal.access_subtitle")}
                </Text>
                <Text
                  strong
                  style={{
                    color: token.colorPrimary,
                    fontSize: 24,
                    marginTop: 12,
                  }}
                >
                  {school.company_name}
                </Text>
              </Flex>

              <Divider style={{ margin: "12px 0" }} />

              <Flex vertical gap={32}>
                <Flex vertical gap={8}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      fontWeight: 700,
                    }}
                  >
                    {translate("bypass_page.selection_modal.label_school_id")}
                  </Text>
                  <Text
                    strong
                    style={{ fontSize: 28, fontFamily: "monospace" }}
                  >
                    {school.school_id || "-"}
                  </Text>
                </Flex>
                <Flex vertical gap={8}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      fontWeight: 700,
                    }}
                  >
                    {translate("bypass_page.selection_modal.label_province")}
                  </Text>
                  <Text strong style={{ fontSize: 22 }}>
                    {school.province || "-"}
                  </Text>
                </Flex>
                <Flex vertical gap={8}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
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
                      padding: "6px 16px",
                      borderRadius: 10,
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
                borderRadius: 18,
                height: 60,
                fontWeight: 700,
                fontSize: 18,
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
            padding: 48,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Flex vertical gap={48}>
            <Alert
              message={
                <Text strong style={{ fontSize: 18 }}>
                  {translate("bypass_page.selection_modal.guide_title")}
                </Text>
              }
              description={
                <Flex vertical gap={10} style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 15 }}>
                    {translate("bypass_page.selection_modal.guide_1")}
                  </Text>
                  <Text style={{ fontSize: 15 }}>
                    {translate("bypass_page.selection_modal.guide_2")}
                  </Text>
                  <Text style={{ fontSize: 15 }}>
                    {translate("bypass_page.selection_modal.guide_3")}
                  </Text>
                </Flex>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ fontSize: 28 }} />}
              style={{ borderRadius: 24, padding: 24 }}
            />

            <Flex vertical gap={56}>
              <Flex vertical gap={24}>
                <Divider orientation="left" style={{ margin: 0 }}>
                  <Flex align="center" gap={12}>
                    <Flex
                      style={{
                        width: 10,
                        height: 28,
                        borderRadius: 5,
                        background: token.colorPrimary,
                      }}
                    />
                    <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                      {translate("bypass_page.selection_modal.group_core")}
                    </Title>
                  </Flex>
                </Divider>
                {renderBypassCards(coreSystemKeys)}
              </Flex>

              <Flex vertical gap={24}>
                <Divider orientation="left" style={{ margin: 0 }}>
                  <Flex align="center" gap={12}>
                    <Flex
                      style={{
                        width: 10,
                        height: 28,
                        borderRadius: 5,
                        background: token.colorWarning,
                      }}
                    />
                    <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                      {translate("bypass_page.selection_modal.group_secondary")}
                    </Title>
                  </Flex>
                </Divider>
                {renderBypassCards(secondarySystemKeys)}
              </Flex>
            </Flex>
          </Flex>
        </Col>
      </Row>
    </Modal>
  );
};

export default BypassSelectionModal;
