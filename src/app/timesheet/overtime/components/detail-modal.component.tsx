"use client";

import React, { useMemo } from "react";
import {
  Modal,
  Descriptions,
  Card,
  Tag,
  Typography,
  Space,
  Skeleton,
  theme,
  Avatar,
  Timeline,
  Divider,
  Badge,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/th";
import type { OvertimeRecord } from "../types/overtime.types";
import { OT_STATUS } from "../types/overtime.types";
import { getUserById } from "@helpers/local_storage/user.storage";

const { Title, Text } = Typography;

interface DetailModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedDetail: OvertimeRecord | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  setVisible,
  selectedDetail,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  // ดึงข้อมูลผู้ใช้จริง
  const requesterUser = useMemo(() => {
    if (!selectedDetail?.requester_id) return null;
    return getUserById(selectedDetail.requester_id);
  }, [selectedDetail?.requester_id]);

  const creatorUser = useMemo(() => {
    if (!selectedDetail?.created_by) return null;
    return getUserById(selectedDetail.created_by);
  }, [selectedDetail?.created_by]);

  // คำนวณรวมชั่วโมง
  const totalHours = useMemo(() => {
    if (!selectedDetail?.descriptions) return 0;
    return selectedDetail.descriptions.reduce(
      (sum, item) => sum + Number(item.duration || 0),
      0,
    );
  }, [selectedDetail?.descriptions]);

  // หาสถานะ
  const statusConfig = useMemo(() => {
    return OT_STATUS.find((s) => s.value === selectedDetail?.status);
  }, [selectedDetail?.status]);

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-3 p-4 rounded-t-2xl"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            margin: "-20px -24px 0",
            padding: "24px",
          }}
        >
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <FileTextOutlined style={{ color: "#fff", fontSize: "24px" }} />
          </div>
          <div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
              รายละเอียดคำขอทำงานล่วงเวลา
            </span>
            <div
              style={{
                fontSize: "13px",
                color: "#fff",
                opacity: 0.9,
                marginTop: 4,
              }}
            >
              ข้อมูลคำขอ OT ฉบับเต็ม
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={900}
      centered
      closeIcon={<span style={{ color: "#fff", fontSize: "20px" }}>✕</span>}
    >
      {selectedDetail ? (
        <div className="pt-4 space-y-6">
          {/* Status and Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card
                className="text-center"
                style={{
                  background: token.colorPrimaryBg,
                  border: `2px solid ${token.colorPrimaryBorder}`,
                  borderRadius: 16,
                }}
              >
                <Statistic
                  title={
                    <Text strong style={{ color: token.colorPrimary }}>
                      เลขที่เอกสาร
                    </Text>
                  }
                  value={selectedDetail.id}
                  prefix={
                    <FileTextOutlined style={{ color: token.colorPrimary }} />
                  }
                  valueStyle={{
                    color: token.colorPrimary,
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="text-center"
                style={{
                  background:
                    statusConfig?.color === "gold"
                      ? token.colorWarningBg
                      : statusConfig?.color === "green"
                        ? token.colorSuccessBg
                        : token.colorErrorBg,
                  border: `2px solid ${
                    statusConfig?.color === "gold"
                      ? token.colorWarningBorder
                      : statusConfig?.color === "green"
                        ? token.colorSuccessBorder
                        : token.colorErrorBorder
                  }`,
                  borderRadius: 16,
                }}
              >
                <div className="mb-2">
                  <Text strong style={{ fontSize: 14 }}>
                    สถานะ
                  </Text>
                </div>
                <Tag
                  color={statusConfig?.color}
                  style={{
                    fontSize: 16,
                    padding: "8px 24px",
                    borderRadius: 20,
                    fontWeight: 600,
                  }}
                >
                  {statusConfig?.text || selectedDetail.status}
                </Tag>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="text-center"
                style={{
                  background: token.colorErrorBg,
                  border: `2px solid ${token.colorErrorBorder}`,
                  borderRadius: 16,
                }}
              >
                <Statistic
                  title={
                    <Text strong style={{ color: token.colorError }}>
                      รวมชั่วโมง
                    </Text>
                  }
                  value={totalHours.toFixed(2)}
                  suffix="ชม."
                  prefix={
                    <ClockCircleOutlined style={{ color: token.colorError }} />
                  }
                  valueStyle={{
                    color: token.colorError,
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* User Information */}
          <Card
            title={
              <Space>
                <TeamOutlined
                  style={{ color: token.colorPrimary, fontSize: 18 }}
                />
                <Text strong style={{ fontSize: 16 }}>
                  ข้อมูลผู้เกี่ยวข้อง
                </Text>
              </Space>
            }
            style={{
              borderRadius: 16,
              border: `2px solid ${token.colorPrimaryBorder}`,
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div
                  className="flex items-start gap-4 p-4 rounded-xl"
                  style={{
                    background: token.colorPrimaryBg,
                  }}
                >
                  <Avatar
                    size={64}
                    src={
                      requesterUser?.profile_image ||
                      requesterUser?.image_profile
                    }
                    icon={<UserOutlined />}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                    }}
                  />
                  <div className="flex-1">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ผู้ยื่นคำขอ
                    </Text>
                    <div>
                      <Text
                        strong
                        style={{ fontSize: 16, color: token.colorPrimary }}
                      >
                        {requesterUser
                          ? `${requesterUser.firstname} ${requesterUser.lastname}`
                          : selectedDetail.requester_name ||
                            selectedDetail.requester_id}
                      </Text>
                    </div>
                    {(requesterUser || selectedDetail.requester_id) && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        รหัส: {selectedDetail.requester_id}
                      </Text>
                    )}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div
                  className="flex items-start gap-4 p-4 rounded-xl"
                  style={{
                    background: token.colorErrorBg,
                  }}
                >
                  <Avatar
                    size={64}
                    src={
                      creatorUser?.profile_image || creatorUser?.image_profile
                    }
                    icon={<UserOutlined />}
                    style={{
                      background:
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      boxShadow: "0 4px 12px rgba(240, 147, 251, 0.3)",
                    }}
                  />
                  <div className="flex-1">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ผู้สร้างรายการ
                    </Text>
                    <div>
                      <Text
                        strong
                        style={{ fontSize: 16, color: token.colorError }}
                      >
                        {creatorUser
                          ? `${creatorUser.firstname} ${creatorUser.lastname}`
                          : selectedDetail.creator_name ||
                            selectedDetail.created_by}
                      </Text>
                    </div>
                    {(creatorUser || selectedDetail.created_by) && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        รหัส: {selectedDetail.created_by}
                      </Text>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Date Information */}
          <Card
            title={
              <Space>
                <CalendarOutlined
                  style={{ color: token.colorSuccess, fontSize: 18 }}
                />
                <Text strong style={{ fontSize: 16 }}>
                  วันที่และเวลา
                </Text>
              </Space>
            }
            style={{
              borderRadius: 16,
              border: `2px solid ${token.colorSuccessBorder}`,
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: token.colorSuccessBg,
                  }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      วันที่ยื่นคำขอ
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: 16, color: token.colorSuccess }}
                    >
                      {selectedDetail.request_date
                        ? dayjs(selectedDetail.request_date)
                            .locale("th")
                            .format("DD MMMM YYYY")
                        : "-"}
                    </Text>
                  </Space>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: token.colorInfoBg,
                  }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      สร้างเมื่อ
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: 16, color: token.colorInfo }}
                    >
                      {selectedDetail.created_at
                        ? dayjs(selectedDetail.created_at)
                            .locale("th")
                            .format("DD MMM YYYY HH:mm")
                        : "-"}
                    </Text>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Work Details Timeline */}
          <Card
            title={
              <Space>
                <FieldTimeOutlined
                  style={{ color: token.colorError, fontSize: 18 }}
                />
                <Text strong style={{ fontSize: 16 }}>
                  รายละเอียดงานที่ทำล่วงเวลา
                </Text>
                <Badge
                  count={selectedDetail.descriptions?.length || 0}
                  style={{
                    background:
                      "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
                  }}
                />
              </Space>
            }
            style={{
              borderRadius: 16,
              border: `2px solid ${token.colorErrorBorder}`,
            }}
          >
            <Timeline
              mode="left"
              items={selectedDetail.descriptions?.map((item, idx) => {
                const assigneeUser = item.assignee
                  ? getUserById(item.assignee)
                  : null;
                return {
                  color: token.colorPrimary,
                  label: (
                    <div className="text-right pr-4">
                      <Text
                        strong
                        style={{ color: token.colorPrimary, fontSize: 14 }}
                      >
                        งานที่ {idx + 1}
                      </Text>
                      {item.date && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8c8c8c",
                            marginTop: 4,
                          }}
                        >
                          <CalendarOutlined />{" "}
                          {dayjs(item.date).locale("th").format("DD MMM YYYY")}
                        </div>
                      )}
                    </div>
                  ),
                  children: (
                    <Card
                      size="small"
                      className="shadow-sm"
                      style={{
                        borderRadius: 12,
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorder}`,
                      }}
                    >
                      <Space
                        direction="vertical"
                        size={12}
                        style={{ width: "100%" }}
                      >
                        {/* Time Range */}
                        {item.startDate && item.endDate && (
                          <div
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{
                              background: token.colorPrimaryBg,
                            }}
                          >
                            <Space>
                              <ClockCircleOutlined
                                style={{ color: token.colorPrimary }}
                              />
                              <Text
                                strong
                                style={{ color: token.colorPrimary }}
                              >
                                ช่วงเวลา
                              </Text>
                            </Space>
                            <Text strong>
                              {dayjs(item.startDate).format("HH:mm")} -{" "}
                              {dayjs(item.endDate).format("HH:mm")}
                            </Text>
                          </div>
                        )}

                        {/* Description */}
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            background: token.colorWarningBg,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            รายละเอียดงาน
                          </Text>
                          <div className="mt-1">
                            <Text strong style={{ fontSize: 14 }}>
                              {item.description || "ไม่ได้ระบุ"}
                            </Text>
                          </div>
                        </div>

                        {/* Duration and Assignee */}
                        <Row gutter={[12, 12]}>
                          <Col span={12}>
                            <div
                              className="p-3 rounded-lg text-center"
                              style={{
                                background: token.colorSuccessBg,
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 12, display: "block" }}
                              >
                                ระยะเวลา
                              </Text>
                              <Tag
                                color="success"
                                style={{
                                  marginTop: 8,
                                  fontSize: 16,
                                  padding: "4px 16px",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                {Number(item.duration || 0).toFixed(2)} ชม.
                              </Tag>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div
                              className="p-3 rounded-lg"
                              style={{
                                background: token.colorPrimaryBg,
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 12,
                                  display: "block",
                                  marginBottom: 8,
                                }}
                              >
                                ผู้รับมอบหมาย
                              </Text>
                              <Space>
                                <Avatar
                                  size="small"
                                  src={
                                    assigneeUser?.profile_image ||
                                    assigneeUser?.image_profile
                                  }
                                  icon={<UserOutlined />}
                                  style={{ background: token.colorPrimary }}
                                />
                                <Text strong style={{ fontSize: 13 }}>
                                  {assigneeUser
                                    ? `${assigneeUser.firstname} ${assigneeUser.lastname}`
                                    : item.assignee_name ||
                                      item.assignee ||
                                      "-"}
                                </Text>
                              </Space>
                            </div>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  ),
                };
              })}
            />
          </Card>
        </div>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
};
