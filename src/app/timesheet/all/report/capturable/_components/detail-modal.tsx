"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Flex,
  Modal,
  Progress,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";

import { ProjectStatDetail } from "../_api/capturable-api";
import { useCapturableStore } from "../_state/use-capturable-store";

const { Text } = Typography;

export const DetailModal: React.FC = () => {
  const { token } = theme.useToken();
  const [modal, contextHolder] = Modal.useModal();
  const {
    detailModalOpen,
    selectedProject,
    trackingData,
    trackingLoading,
    dateRange,
    closeDetailModal,
  } = useCapturableStore();

  return (
    <>
      {contextHolder}
      <Modal
        open={detailModalOpen}
        onCancel={closeDetailModal}
        width={1400}
        centered
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
        {selectedProject && (
          <Flex vertical style={{ minHeight: 400 }}>
            {/* ── Header ── */}
            <Flex
              align="center"
              justify="space-between"
              style={{
                padding: "20px 28px 18px",
                background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex align="center" gap={14}>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: token.borderRadiusLG,
                    background: token.colorPrimary,
                    flexShrink: 0,
                  }}
                >
                  <ProjectOutlined style={{ fontSize: 22, color: "#fff" }} />
                </Flex>
                <Flex vertical gap={2}>
                  <Text strong style={{ fontSize: 16, lineHeight: 1.3 }}>
                    รายละเอียดการวิเคราะห์รายโครงการ
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ตรวจสอบที่มาของชั่วโมงทำงานและผู้รับผิดชอบระดับรายกิจกรรม
                  </Text>
                </Flex>
              </Flex>
              <Button
                onClick={closeDetailModal}
                size="middle"
                style={{ borderRadius: token.borderRadius }}
              >
                ปิด
              </Button>
            </Flex>

            {/* ── Project Summary Bar ── */}
            <Flex
              wrap="wrap"
              gap={0}
              style={{
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
              }}
            >
              {/* โครงการ */}
              <Flex
                align="center"
                gap={10}
                style={{
                  flex: "1 1 260px",
                  padding: "14px 24px",
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: token.borderRadius,
                    background: token.colorInfoBg,
                    flexShrink: 0,
                  }}
                >
                  <ProjectOutlined
                    style={{ color: token.colorInfo, fontSize: 16 }}
                  />
                </Flex>
                <Flex vertical gap={1}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    โครงการที่วิเคราะห์
                  </Text>
                  <Flex align="center" gap={6}>
                    <Tag
                      color="blue"
                      bordered={false}
                      style={{ margin: 0, fontWeight: 700, fontSize: 11 }}
                    >
                      {selectedProject.project_code}
                    </Tag>
                    <Text strong style={{ fontSize: 13 }}>
                      {selectedProject.project_name}
                    </Text>
                    {selectedProject.is_deleted && (
                      <Tag
                        color="error"
                        bordered={false}
                        style={{ margin: 0, fontSize: 10 }}
                      >
                        ถูกลบ
                      </Tag>
                    )}
                  </Flex>
                </Flex>
              </Flex>

              {/* ชั่วโมงรวม */}
              <Flex
                align="center"
                gap={10}
                style={{
                  flex: "0 0 auto",
                  padding: "14px 28px",
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: token.borderRadius,
                    background: token.colorInfoBg,
                    flexShrink: 0,
                  }}
                >
                  <ClockCircleOutlined
                    style={{ color: token.colorInfo, fontSize: 16 }}
                  />
                </Flex>
                <Flex vertical gap={1}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ชั่วโมงรวม
                  </Text>
                  <Text
                    strong
                    style={{
                      fontSize: 18,
                      color: token.colorInfoText,
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedProject.hours.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, fontWeight: 400 }}
                    >
                      ชม.
                    </Text>
                  </Text>
                </Flex>
              </Flex>

              {/* Capturable */}
              <Flex
                align="center"
                gap={10}
                style={{
                  flex: "0 0 auto",
                  padding: "14px 28px",
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: token.borderRadius,
                    background: token.colorSuccessBg,
                    flexShrink: 0,
                  }}
                >
                  <CheckCircleOutlined
                    style={{ color: token.colorSuccess, fontSize: 16 }}
                  />
                </Flex>
                <Flex vertical gap={1}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Capitalization
                  </Text>
                  <Flex align="center" gap={6}>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        color: token.colorSuccess,
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedProject.capturable_percent.toFixed(1)}%
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({selectedProject.capturable_hours.toFixed(2)} ชม.)
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              {/* Expense */}
              <Flex
                align="center"
                gap={10}
                style={{
                  flex: "0 0 auto",
                  padding: "14px 28px",
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: token.borderRadius,
                    background: token.colorErrorBg,
                    flexShrink: 0,
                  }}
                >
                  <InfoCircleOutlined
                    style={{ color: token.colorError, fontSize: 16 }}
                  />
                </Flex>
                <Flex vertical gap={1}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Expense
                  </Text>
                  <Flex align="center" gap={6}>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        color: token.colorError,
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedProject.uncapturable_percent.toFixed(1)}%
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({selectedProject.uncapturable_hours.toFixed(2)} ชม.)
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              {/* ช่วงเวลา */}
              <Flex
                align="center"
                gap={10}
                style={{ flex: "0 0 auto", padding: "14px 28px" }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: token.borderRadius,
                    background: token.colorFillAlter,
                    flexShrink: 0,
                  }}
                >
                  <HistoryOutlined
                    style={{ color: token.colorTextSecondary, fontSize: 16 }}
                  />
                </Flex>
                <Flex vertical gap={1}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ช่วงเวลา
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    {dateRange[0].format("DD/MM/YYYY")} —{" "}
                    {dateRange[1].format("DD/MM/YYYY")}
                  </Text>
                </Flex>
              </Flex>
            </Flex>

            {/* ── Content ── */}
            <Flex
              vertical
              gap={16}
              style={{
                padding: "20px 24px 24px",
                background: token.colorBgLayout,
                overflowY: "auto",
                maxHeight: "65vh",
              }}
            >
              {/* ตารางหลัก */}
              <Card
                variant="borderless"
                styles={{ body: { padding: 0 } }}
                style={{
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <Flex
                  align="center"
                  gap={8}
                  style={{
                    padding: "14px 20px",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}
                >
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: token.borderRadius,
                      background: token.colorPrimaryBg,
                    }}
                  >
                    <HistoryOutlined
                      style={{ fontSize: 14, color: token.colorPrimary }}
                    />
                  </Flex>
                  <Text strong style={{ fontSize: 13 }}>
                    สรุปรายงานตามประเภทรายจ่าย
                  </Text>
                  <Tag
                    bordered={false}
                    style={{
                      marginLeft: "auto",
                      borderRadius: 99,
                      fontSize: 11,
                      padding: "0 10px",
                      background: token.colorPrimaryBg,
                      color: token.colorPrimary,
                    }}
                  >
                    {selectedProject.details.length} รายการ
                  </Tag>
                </Flex>

                <Table
                  dataSource={selectedProject.details}
                  rowKey={(record) =>
                    `${record.feature_id}-${record.asset_capture_type}`
                  }
                  pagination={false}
                  size="middle"
                  scroll={{ x: 1100 }}
                  style={{ borderRadius: 0 }}
                  expandable={{
                    expandedRowRender: (record) => {
                      const featureTracking = trackingData.filter(
                        (t) =>
                          t.feature_id === record.feature_id &&
                          t.asset_capture_type === record.asset_capture_type,
                      );
                      return (
                        <Card
                          variant="borderless"
                          styles={{ body: { padding: "16px 20px" } }}
                          style={{
                            margin: "8px 12px",
                            borderRadius: token.borderRadiusLG,
                            background: token.colorBgContainer,
                            border: `1px solid ${token.colorBorderSecondary}`,
                          }}
                        >
                          <Flex
                            align="center"
                            gap={8}
                            style={{ marginBottom: 14 }}
                          >
                            <Flex
                              align="center"
                              justify="center"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: token.borderRadiusSM,
                                background: token.colorPrimaryBg,
                              }}
                            >
                              <UserOutlined
                                style={{
                                  fontSize: 12,
                                  color: token.colorPrimary,
                                }}
                              />
                            </Flex>
                            <Text
                              strong
                              style={{
                                fontSize: 12,
                                color: token.colorPrimary,
                              }}
                            >
                              ประวัติการลงเวลารายบุคคล
                            </Text>
                          </Flex>

                          <Table
                            dataSource={featureTracking}
                            rowKey="entry_id"
                            loading={trackingLoading}
                            pagination={{
                              pageSize: 10,
                              size: "small",
                              showSizeChanger: true,
                              pageSizeOptions: ["10", "20", "50"],
                              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                            }}
                            size="small"
                            scroll={{ x: 900 }}
                            style={{ borderRadius: token.borderRadius }}
                            columns={[
                              {
                                title: "ผู้ลงเวลา",
                                key: "user",
                                width: 220,
                                sorter: (a: any, b: any) =>
                                  (a.user_name || "").localeCompare(
                                    b.user_name || "",
                                  ),
                                render: (_: any, t: any) => (
                                  <Flex align="center" gap={8}>
                                    <Avatar
                                      size={28}
                                      icon={<UserOutlined />}
                                      style={{
                                        backgroundColor: token.colorPrimary,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Flex vertical gap={0}>
                                      <Text
                                        strong
                                        style={{
                                          fontSize: 12,
                                          lineHeight: 1.3,
                                        }}
                                      >
                                        {t.user_name}
                                      </Text>
                                      {t.user_nickname && (
                                        <Text
                                          type="secondary"
                                          style={{ fontSize: 11 }}
                                        >
                                          @{t.user_nickname}
                                        </Text>
                                      )}
                                    </Flex>
                                  </Flex>
                                ),
                              },
                              {
                                title: "วันที่",
                                dataIndex: "date",
                                key: "date",
                                width: 110,
                                align: "center",
                                sorter: (a: any, b: any) =>
                                  dayjs(a.date).unix() - dayjs(b.date).unix(),
                                render: (d: string) => (
                                  <Tag
                                    bordered={false}
                                    color="default"
                                    style={{ fontSize: 11, borderRadius: 6 }}
                                  >
                                    {dayjs(d).format("DD/MM/YYYY")}
                                  </Tag>
                                ),
                              },
                              {
                                title: "รายละเอียดงาน",
                                dataIndex: "description",
                                key: "description",
                                render: (desc: string) => {
                                  if (!desc)
                                    return <Text type="secondary">-</Text>;
                                  const isLong = desc.length > 100;
                                  return (
                                    <Flex vertical align="start" gap={2}>
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          lineHeight: 1.6,
                                          color: token.colorText,
                                        }}
                                      >
                                        {isLong
                                          ? `${desc.slice(0, 100)}...`
                                          : desc}
                                      </Text>
                                      {isLong && (
                                        <Button
                                          type="link"
                                          size="small"
                                          style={{
                                            padding: 0,
                                            height: "auto",
                                            fontSize: 11,
                                            color: token.colorPrimary,
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            modal.info({
                                              title: "รายละเอียดงานฉบับเต็ม",
                                              content: (
                                                <div
                                                  style={{
                                                    paddingTop: 16,
                                                    whiteSpace: "pre-wrap",
                                                    fontSize: 14,
                                                    lineHeight: "1.6",
                                                  }}
                                                >
                                                  {desc}
                                                </div>
                                              ),
                                              centered: true,
                                              width: 600,
                                              maskClosable: true,
                                              okText: "ปิด",
                                            });
                                          }}
                                        >
                                          ดูเพิ่มเติม →
                                        </Button>
                                      )}
                                    </Flex>
                                  );
                                },
                              },
                              {
                                title: "ชั่วโมง",
                                dataIndex: "hours",
                                key: "hours",
                                width: 90,
                                align: "right",
                                sorter: (a: any, b: any) => a.hours - b.hours,
                                render: (h: number) => (
                                  <Text
                                    strong
                                    style={{
                                      color: token.colorInfoText,
                                      fontSize: 13,
                                    }}
                                  >
                                    {h.toFixed(2)}
                                  </Text>
                                ),
                              },
                            ]}
                            locale={{
                              emptyText: (
                                <Empty
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  description={
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      ไม่พบประวัติการลงเวลา
                                    </Text>
                                  }
                                />
                              ),
                            }}
                          />
                        </Card>
                      );
                    },
                    columnTitle: (
                      <Tooltip title="คลิกเพื่อดูรายละเอียดรายบุคคล">
                        <HistoryOutlined
                          style={{ color: token.colorTextSecondary }}
                        />
                      </Tooltip>
                    ),
                    expandRowByClick: true,
                  }}
                  columns={[
                    {
                      title: "โครงการย่อย / ฟีเจอร์",
                      dataIndex: "feature_name",
                      key: "feature_name",
                      width: 420,
                      sorter: (a: any, b: any) =>
                        (a.feature_name || "").localeCompare(
                          b.feature_name || "",
                        ),
                      render: (text: string, record: ProjectStatDetail) => (
                        <Flex vertical gap={2}>
                          <Text strong style={{ fontSize: 13 }}>
                            {text}
                          </Text>
                          {record.is_deleted && (
                            <Tag
                              color="error"
                              bordered={false}
                              style={{
                                fontSize: 10,
                                lineHeight: "14px",
                                width: "fit-content",
                              }}
                            >
                              ถูกลบ
                            </Tag>
                          )}
                        </Flex>
                      ),
                    },
                    {
                      title: "ประเภทรายจ่าย",
                      dataIndex: "asset_capture_type",
                      key: "asset_capture_type",
                      width: 220,
                      align: "center",
                      sorter: (a: any, b: any) =>
                        (a.asset_capture_type || "").localeCompare(
                          b.asset_capture_type || "",
                        ),
                      render: (type: string) => {
                        const isCapture = type === "CAPTUREABLE";
                        return (
                          <Flex align="center" justify="center" gap={6}>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: isCapture
                                  ? token.colorSuccess
                                  : token.colorError,
                                flexShrink: 0,
                              }}
                            />
                            <Text
                              strong
                              style={{
                                fontSize: 12,
                                color: isCapture
                                  ? token.colorSuccess
                                  : token.colorError,
                              }}
                            >
                              {isCapture ? "Capitalization" : "Expense"}
                            </Text>
                          </Flex>
                        );
                      },
                    },
                    {
                      title: "ชั่วโมงรวม",
                      dataIndex: "hours",
                      key: "hours",
                      width: 150,
                      align: "right",
                      sorter: (a: any, b: any) => a.hours - b.hours,
                      render: (val: number) => (
                        <Text
                          strong
                          style={{ color: token.colorInfoText, fontSize: 14 }}
                        >
                          {val.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                              fontWeight: 400,
                              marginLeft: 4,
                            }}
                          >
                            ชม.
                          </Text>
                        </Text>
                      ),
                    },
                    {
                      title: "สัดส่วน",
                      dataIndex: "percent",
                      key: "percent",
                      width: 180,
                      sorter: (a: any, b: any) => a.percent - b.percent,
                      render: (val: number, record: ProjectStatDetail) => {
                        const isCapture =
                          record.asset_capture_type === "CAPTUREABLE";
                        return (
                          <Flex align="center" gap={8}>
                            <Progress
                              percent={val}
                              strokeColor={
                                isCapture
                                  ? token.colorSuccess
                                  : token.colorError
                              }
                              trailColor={token.colorFillSecondary}
                              showInfo={false}
                              size="small"
                              style={{ flex: 1, margin: 0 }}
                            />
                            <Text
                              strong
                              style={{
                                width: 44,
                                textAlign: "right",
                                fontSize: 12,
                                color: isCapture
                                  ? token.colorSuccess
                                  : token.colorError,
                                flexShrink: 0,
                              }}
                            >
                              {val.toFixed(1)}%
                            </Text>
                          </Flex>
                        );
                      },
                    },
                  ]}
                  summary={(pageData) => (
                    <Table.Summary.Row
                      style={{ background: token.colorFillAlter }}
                    >
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, fontWeight: 600 }}
                        >
                          รวมสุทธิในโครงการนี้
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text
                          strong
                          style={{ fontSize: 15, color: token.colorInfoText }}
                        >
                          {pageData
                            .reduce((acc, curr) => acc + curr.hours, 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                              fontWeight: 400,
                              marginLeft: 4,
                            }}
                          >
                            ชม.
                          </Text>
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  )}
                />
              </Card>

              {/* ── IPO Note ── */}
              <Flex
                align="flex-start"
                gap={12}
                style={{
                  padding: "14px 18px",
                  borderRadius: token.borderRadiusLG,
                  background: token.colorInfoBg,
                  border: `1px solid ${token.colorInfoBorder}`,
                }}
              >
                <InfoCircleOutlined
                  style={{
                    color: token.colorInfo,
                    fontSize: 15,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <Flex vertical gap={2}>
                  <Text
                    strong
                    style={{ fontSize: 12, color: token.colorInfoText }}
                  >
                    มาตรฐานการตรวจสอบระบบ (IPO Traceability Protocol)
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, lineHeight: 1.7 }}
                  >
                    ข้อมูลการลงเวลาถูกแยกประเภทตาม Capitalization Rules
                    โดยระบบรองรับการ Audit รายบุคคล (User-level Drill down)
                    เพื่อใช้เป็นหลักฐานประกอบการลงบัญชี Capitalization ทรัพย์สิน
                    และ Expense รายจ่ายของบริษัท
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Modal>
    </>
  );
};
