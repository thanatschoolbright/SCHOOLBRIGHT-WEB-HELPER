"use client";

import {
  AppstoreOutlined,
  BranchesOutlined,
  CloseOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Modal,
  Row,
  Skeleton,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface MyWorkItem {
  id: number;
  projectId: number;
  featureId: number | null;
  userId: number;
  position: string | null;
  project: {
    id: number;
    name: string;
    name_en: string | null;
    status: string;
  };
  feature: {
    id: number;
    name: string;
    name_en: string | null;
    status: string;
    ticket_number?: string | null;
  } | null;
}

interface MyWorkModalProps {
  open: boolean;
  onCancel: () => void;
  userId?: number;
}

// แมป status → สี Badge
const statusColor: Record<string, string> = {
  open: "processing",
  active: "success",
  closed: "default",
  done: "success",
};

/**
 * Modal แสดงรายการงานที่ได้รับมอบหมาย (My Work) — Modern Card Layout
 */
export const MyWorkModal: React.FC<MyWorkModalProps> = ({
  open,
  onCancel,
  userId,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MyWorkItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/timesheet/my-work?user_id=${String(userId)}`,
      );
      setData(response.data?.data ?? []);
    } catch (_error) {
      console.error("Fetch my-work failed:", _error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      void fetchData();
    }
  }, [open, fetchData]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={900}
      centered
      closeIcon={<CloseOutlined style={{ color: token.colorTextSecondary }} />}
      footer={null}
      styles={{
        content: {
          padding: 0,
          borderRadius: token.borderRadiusLG,
          overflow: "hidden",
        },
        body: { padding: 0 },
        header: { display: "none" },
      }}
    >
      {/* ── Header ── */}
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
        }}
      >
        <Flex align="center" gap={12}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: 44,
              height: 44,
              borderRadius: token.borderRadiusLG,
              background: token.colorPrimary,
              flexShrink: 0,
            }}
          >
            <UserOutlined style={{ fontSize: 20, color: "#fff" }} />
          </Flex>
          <Flex vertical gap={2}>
            <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
              {t("timesheet_entry_page.my_work", "งานของฉัน")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t(
                "timesheet_entry_page.my_work_description",
                "รายการโครงการและฟีเจอร์ที่คุณได้รับมอบหมาย",
              )}
            </Text>
          </Flex>
        </Flex>

        {!loading && data.length > 0 && (
          <Tag
            style={{
              borderRadius: 99,
              padding: "2px 12px",
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${token.colorPrimaryBorder}`,
              color: token.colorPrimary,
              background: token.colorPrimaryBg,
            }}
          >
            {data.length} รายการ
          </Tag>
        )}
      </Flex>

      {/* ── Content ── */}
      <div
        style={{
          padding: "20px 24px 24px",
          maxHeight: "65vh",
          overflowY: "auto",
          background: token.colorBgLayout,
        }}
      >
        {loading ? (
          // skeleton cards
          <Row gutter={[12, 12]}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Col key={i} span={24}>
                <Card
                  size="small"
                  styles={{ body: { padding: "14px 16px" } }}
                  style={{ borderRadius: token.borderRadiusLG }}
                >
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                {t(
                  "timesheet_entry_page.no_assigned_work",
                  "ไม่พบข้อมูลงานที่ได้รับมอบหมาย",
                )}
              </Text>
            }
            style={{ margin: "40px 0" }}
          />
        ) : (
          <Row gutter={[10, 10]}>
            {data.map((item) => (
              <Col key={item.id} span={24}>
                <Card
                  size="small"
                  hoverable
                  styles={{ body: { padding: "14px 16px" } }}
                  style={{
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                    transition: "all 0.2s",
                  }}
                >
                  <Row gutter={[12, 8]} align="middle">
                    {/* ── Project ── */}
                    <Col xs={24} sm={10}>
                      <Flex align="flex-start" gap={10}>
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: token.borderRadius,
                            background: token.colorPrimaryBg,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <AppstoreOutlined
                            style={{ fontSize: 15, color: token.colorPrimary }}
                          />
                        </Flex>
                        <Flex vertical gap={1} style={{ minWidth: 0 }}>
                          <Text
                            strong
                            style={{ fontSize: 13, lineHeight: 1.4 }}
                            ellipsis={{ tooltip: item.project.name }}
                          >
                            {item.project.name}
                          </Text>
                          {item.project.name_en && (
                            <Text
                              type="secondary"
                              style={{ fontSize: 11 }}
                              ellipsis={{ tooltip: item.project.name_en }}
                            >
                              {item.project.name_en}
                            </Text>
                          )}
                          <Badge
                            status={
                              (statusColor[item.project.status] as
                                | "processing"
                                | "success"
                                | "default") ?? "default"
                            }
                            text={
                              <Text style={{ fontSize: 11 }}>
                                {item.project.status.toUpperCase()}
                              </Text>
                            }
                          />
                        </Flex>
                      </Flex>
                    </Col>

                    {/* ── Feature ── */}
                    <Col xs={24} sm={9}>
                      {item.feature ? (
                        <Flex align="flex-start" gap={10}>
                          <Flex
                            align="center"
                            justify="center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: token.borderRadius,
                              background: token.colorInfoBg,
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            <BranchesOutlined
                              style={{ fontSize: 15, color: token.colorInfo }}
                            />
                          </Flex>
                          <Flex vertical gap={1} style={{ minWidth: 0 }}>
                            <Flex align="center" gap={6} wrap="wrap">
                              {item.feature.ticket_number && (
                                <Tag
                                  color="processing"
                                  bordered={false}
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    padding: "0 6px",
                                    lineHeight: "18px",
                                    borderRadius: 99,
                                  }}
                                >
                                  {item.feature.ticket_number}
                                </Tag>
                              )}
                              <Text
                                style={{ fontSize: 13, lineHeight: 1.4 }}
                                ellipsis={{ tooltip: item.feature.name }}
                              >
                                {item.feature.name}
                              </Text>
                            </Flex>
                            {item.feature.name_en && (
                              <Text
                                type="secondary"
                                style={{ fontSize: 11 }}
                                ellipsis={{ tooltip: item.feature.name_en }}
                              >
                                {item.feature.name_en}
                              </Text>
                            )}
                            <Badge
                              status={
                                (statusColor[item.feature.status] as
                                  | "processing"
                                  | "success"
                                  | "default") ?? "default"
                              }
                              text={
                                <Text style={{ fontSize: 11 }}>
                                  {item.feature.status.toUpperCase()}
                                </Text>
                              }
                            />
                          </Flex>
                        </Flex>
                      ) : (
                        <Flex align="center" gap={6}>
                          <FolderOpenOutlined
                            style={{
                              fontSize: 14,
                              color: token.colorTextQuaternary,
                            }}
                          />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t(
                              "timesheet_entry_page.no_feature",
                              "ไม่มีฟีเจอร์",
                            )}
                          </Text>
                        </Flex>
                      )}
                    </Col>

                    {/* ── Position ── */}
                    <Col xs={24} sm={5}>
                      <Flex align="center" justify="flex-end">
                        {item.position ? (
                          <Tooltip title={item.position}>
                            <Tag
                              icon={<CodeOutlined />}
                              style={{
                                borderRadius: 99,
                                fontSize: 11,
                                padding: "2px 10px",
                                maxWidth: 140,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.position}
                            </Tag>
                          </Tooltip>
                        ) : (
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, fontStyle: "italic" }}
                          >
                            {t(
                              "timesheet_entry_page.not_specified",
                              "ไม่ได้ระบุ",
                            )}
                          </Text>
                        )}
                      </Flex>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* ── Footer ── */}
      <Flex
        justify="flex-end"
        style={{
          padding: "12px 24px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        }}
      >
        <Button onClick={onCancel}>ปิด</Button>
      </Flex>
    </Modal>
  );
};
