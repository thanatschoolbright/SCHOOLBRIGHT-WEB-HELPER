"use client";

import { OT_STATUS } from "@/constants/overtime-status";
import {
  CameraOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Image,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React from "react";

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDetail: any;
}

/**
 * หน้าต่างแสดงรายละเอียดคำขอ OT
 * @param visible สถานะการแสดง Modal
 * @param onClose ฟังก์ชันปิด Modal
 * @param selectedDetail ข้อมูลคำขอที่เลือก
 */
const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  onClose,
  selectedDetail,
}) => {
  const { token } = theme.useToken();

  // คำนวณสรุปจำนวนชั่วโมงทำงานโดยรวมในคำขอที่ถูกเลือก
  const totalDurationSummaryValue = React.useMemo(() => {
    return (
      selectedDetail?.descriptions?.reduce(
        (sum: number, item: any) => sum + Number(item.duration || 0),
        0,
      ) || 0
    );
  }, [selectedDetail]);

  // รวบรวมรูปภาพหลักฐานทั้งหมดจากทุกรายการภาระงาน
  const proofImages = React.useMemo(() => {
    if (!selectedDetail?.descriptions) return {};
    return selectedDetail.descriptions.reduce(
      (acc: any, item: any) => ({
        ...acc,
        ...(item.proof || {}),
      }),
      {},
    );
  }, [selectedDetail]);

  const hasAnyProof = Object.keys(proofImages).length > 0;

  if (!selectedDetail) return null;

  return (
    <Modal
      title={
        <Flex align="center" gap={12}>
          <div
            style={{
              background: token.colorPrimaryBg,
              padding: 8,
              borderRadius: 10,
              display: "flex",
            }}
          >
            <FileSearchOutlined style={{ color: token.colorPrimary }} />
          </div>
          <Typography.Text strong style={{ fontSize: 16 }}>
            รายละเอียดคำขอ OT #{selectedDetail?.id}
          </Typography.Text>
        </Flex>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{ borderRadius: 10, height: 40, paddingInline: 32 }}
        >
          ตกลง
        </Button>,
      ]}
      width={900}
      centered
      styles={{ body: { padding: "0 24px 24px 24px" } }}
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      <Flex vertical gap={24} style={{ paddingTop: 16 }}>
        {/* ส่วนที่ 1: ข้อมูลพนักงานและสถานะ */}
        <Card
          variant="borderless"
          style={{
            background: token.colorFillQuaternary,
            borderRadius: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={14}>
              <Flex gap={16} align="center">
                <Avatar
                  size={64}
                  src={selectedDetail.requester_user?.profile_image}
                  icon={<UserOutlined />}
                  style={{
                    border: `2px solid #fff`,
                    boxShadow: token.boxShadowTertiary,
                  }}
                />
                <Flex vertical>
                  <Typography.Text strong style={{ fontSize: 18 }}>
                    {selectedDetail.requester_name ||
                      `${selectedDetail.requester_user?.firstname_th} ${selectedDetail.requester_user?.lastname_th}`}
                    {selectedDetail.requester_user?.nickname && (
                      <span
                        style={{
                          marginLeft: 4,
                          color: token.colorTextSecondary,
                          fontWeight: 400,
                        }}
                      >
                        ({selectedDetail.requester_user.nickname})
                      </span>
                    )}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {selectedDetail.requester_position ||
                      selectedDetail.requester_user?.position_th}{" "}
                    -{" "}
                    {selectedDetail.requester_employee_code ||
                      selectedDetail.requester_user?.employee_code}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Col>
            <Col xs={24} md={10}>
              <Flex vertical align="flex-end" gap={8}>
                <Tag
                  color={
                    OT_STATUS.find(
                      (item) => item.value === selectedDetail.status,
                    )?.color
                  }
                  style={{
                    fontSize: 14,
                    padding: "4px 16px",
                    borderRadius: 8,
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {OT_STATUS.find(
                    (item) => item.value === selectedDetail.status,
                  )?.text || selectedDetail.status}
                </Tag>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  วันที่ปฏิบัติงาน:{" "}
                  {dayjs(selectedDetail.request_date).format("DD/MM/YYYY")}
                </Typography.Text>
              </Flex>
            </Col>
          </Row>
        </Card>

        {/* ส่วนที่ 2: รายละเอียดเนื้องาน */}
        <Flex vertical gap={12}>
          <Divider orientation="left" style={{ margin: "8px 0" }}>
            <Space>
              <FileTextOutlined style={{ color: token.colorInfo }} />
              <Typography.Text strong>รายการภาระงานที่ปฏิบัติ</Typography.Text>
            </Space>
          </Divider>
          <Table
            dataSource={selectedDetail.descriptions}
            pagination={false}
            rowKey="id"
            size="middle"
            columns={[
              {
                title: "รายละเอียดเนื้องาน",
                dataIndex: "description",
                key: "desc",
                render: (text) => (
                  <Typography.Text style={{ fontSize: 14 }}>
                    {text}
                  </Typography.Text>
                ),
              },
              {
                title: "เวลาปฏิบัติงาน",
                key: "time",
                width: 220,
                render: (record) => (
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {record.start_date
                      ? dayjs(record.start_date).format("HH:mm")
                      : "-"}{" "}
                    -{" "}
                    {record.end_date
                      ? dayjs(record.end_date).format("HH:mm")
                      : "-"}{" "}
                    น.
                  </Typography.Text>
                ),
              },
              {
                title: "จำนวน (ชม.)",
                dataIndex: "duration",
                key: "dur",
                align: "center",
                width: 120,
                render: (value) => (
                  <Tag
                    color="blue"
                    style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}
                  >
                    {value} ชม.
                  </Tag>
                ),
              },
            ]}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Typography.Text strong>
                      รวมจำนวนชั่วโมงทั้งหมด
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Typography.Text
                      strong
                      style={{ color: token.colorError, fontSize: 16 }}
                    >
                      {totalDurationSummaryValue}
                    </Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          />
        </Flex>

        {/* ส่วนที่ 3: หลักฐานรูปภาพและลายเซ็น */}
        <Flex vertical gap={16}>
          <Divider orientation="left" style={{ margin: "8px 0" }}>
            <Space>
              <CameraOutlined style={{ color: token.colorWarning }} />
              <Typography.Text strong>หลักฐานการทำงาน</Typography.Text>
            </Space>
          </Divider>

          {hasAnyProof ? (
            <Card
              variant="borderless"
              style={{
                background: token.colorFillQuaternary,
                borderRadius: 16,
              }}
            >
              <Image.PreviewGroup>
                <Row gutter={[16, 24]}>
                  {[
                    { key: "image_1", label: "1. หลักฐานเข้าทำงาน" },
                    { key: "image_2", label: "2. หลักฐานออกทำงาน" },
                    { key: "image_3", label: "3. หลักฐานงานจริง #1" },
                    { key: "image_4", label: "4. หลักฐานงานจริง #2" },
                  ].map(
                    (item) =>
                      proofImages[item.key] && (
                        <Col xs={12} sm={6} md={4} key={item.key}>
                          <Flex vertical gap={8} align="flex-start">
                            <Image
                              src={proofImages[item.key]}
                              alt={item.label}
                              style={{
                                borderRadius: 12,
                                objectFit: "cover",
                                height: 100,
                                width: "100%",
                                cursor: "pointer",
                              }}
                              fallback="/photo/no-image.png"
                            />
                            <Typography.Text
                              type="secondary"
                              style={{ fontSize: 11, textAlign: "left" }}
                            >
                              {item.label}
                            </Typography.Text>
                          </Flex>
                        </Col>
                      ),
                  )}

                  {/* ช่องแสดงลายเซ็นแยกต่างหาก */}
                  {proofImages.signature_1 && (
                    <Col span={24}>
                      <Divider dashed style={{ margin: "16px 0" }} />
                      <Flex align="flex-start" vertical gap={12}>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          ลายเซ็นรับรองผู้ปฏิบัติงาน
                        </Typography.Text>
                        <div
                          style={{
                            padding: "16px 24px",
                            background: "#fff",
                            borderRadius: 12,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            display: "inline-flex",
                          }}
                        >
                          <Image
                            src={proofImages.signature_1}
                            width={180}
                            style={{ maxHeight: 80, objectFit: "contain" }}
                            alt="Signature"
                          />
                        </div>
                      </Flex>
                    </Col>
                  )}
                </Row>
              </Image.PreviewGroup>
            </Card>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="ไม่พบไฟล์ยอดหลักฐานรูปภาพในคำขอนี้"
              style={{ marginBlock: 20 }}
            />
          )}
        </Flex>
      </Flex>
    </Modal>
  );
};

export default DetailModal;
