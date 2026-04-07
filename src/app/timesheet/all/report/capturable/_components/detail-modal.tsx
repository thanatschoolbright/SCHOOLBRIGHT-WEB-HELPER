"use client";

import {
  HistoryOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Modal,
  Progress,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";

import { ProjectStatDetail } from "../_api/capturable-api";
import { useCapturableStore } from "../_state/use-capturable-store";

const { Text, Title } = Typography;

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
        title={
          <Space size={12}>
            <Badge style={{ backgroundColor: token.colorPrimary }}>
              <Avatar
                shape="square"
                size="large"
                style={{
                  backgroundColor: token.colorPrimaryBg,
                  color: token.colorPrimary,
                  borderRadius: 8,
                }}
                icon={<ProjectOutlined />}
              />
            </Badge>
            <Flex vertical gap={2}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                รายละเอียดการวิเคราะห์รายโครงการ
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                ตรวจสอบที่มาของชั่วโมงทำงานและผู้รับผิดชอบระดับรายกิจกรรม
              </Text>
            </Flex>
          </Space>
        }
        open={detailModalOpen}
        onCancel={closeDetailModal}
        width={1400}
        centered
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={closeDetailModal}
            style={{ fontWeight: 600 }}
            size="large"
          >
            ปิดหน้าต่าง
          </Button>,
        ]}
      >
        {selectedProject && (
          <Flex vertical gap={24} style={{ paddingTop: 8, paddingBottom: 8 }}>
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              items={[
                {
                  label: "โครงการที่ตรวจสอบ",
                  children: (
                    <Space>
                      <Tag color="blue" bordered={false}>
                        {selectedProject.project_code}
                      </Tag>
                      <Text strong>{selectedProject.project_name}</Text>
                    </Space>
                  ),
                },
                {
                  label: "ชั่วโมงรวมทั้งหมด",
                  children: (
                    <Statistic
                      value={selectedProject.hours}
                      suffix="ชม."
                      valueStyle={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: token.colorInfoText,
                      }}
                    />
                  ),
                },
                {
                  label: "ช่วงเวลาที่วิเคราะห์",
                  children: (
                    <Space>
                      <HistoryOutlined style={{ color: token.colorTextSecondary }} />
                      <Text strong>
                        {dateRange[0].format("DD/MM/YYYY")} -{" "}
                        {dateRange[1].format("DD/MM/YYYY")}
                      </Text>
                    </Space>
                  ),
                },
              ]}
            />

            <Table
              dataSource={selectedProject.details}
              rowKey={(record) =>
                `${record.feature_id}-${record.asset_capture_type}`
              }
              pagination={false}
              size="middle"
              bordered
              scroll={{ x: 1200 }}
              expandable={{
                expandedRowRender: (record) => {
                  const featureTracking = trackingData.filter(
                    (t) =>
                      t.feature_id === record.feature_id &&
                      t.asset_capture_type === record.asset_capture_type,
                  );
                  return (
                    <Card
                      size="small"
                      variant="borderless"
                      styles={{ body: { padding: "16px 24px" } }}
                      style={{
                        backgroundColor: token.colorFillAlter,
                        margin: 8,
                        borderRadius: 12,
                      }}
                    >
                      <Text strong style={{ color: token.colorPrimary, display: "block", marginBottom: 12 }}>
                        ประวัติการลงเวลารายบุคคลสำหรับงานนี้
                      </Text>
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
                        bordered
                        scroll={{ x: 1000 }}
                        columns={[
                          {
                            title: "ผู้ลงเวลา",
                            key: "user",
                            width: 240,
                            sorter: (a: any, b: any) =>
                              (a.user_name || "").localeCompare(b.user_name || ""),
                            render: (_: any, t: any) => (
                              <Space>
                                <Avatar
                                  size="small"
                                  icon={<UserOutlined />}
                                  style={{ backgroundColor: token.colorPrimary }}
                                />
                                <Text strong style={{ fontSize: 13 }}>
                                  {t.user_name}
                                </Text>
                                {t.user_nickname && (
                                  <Tag color="blue" bordered={false} style={{ fontSize: 11 }}>
                                    {t.user_nickname}
                                  </Tag>
                                )}
                              </Space>
                            ),
                          },
                          {
                            title: "วันที่",
                            dataIndex: "date",
                            key: "date",
                            width: 130,
                            align: "center",
                            sorter: (a: any, b: any) =>
                              dayjs(a.date).unix() - dayjs(b.date).unix(),
                            render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
                          },
                          {
                            title: "รายละเอียดงาน",
                            dataIndex: "description",
                            key: "description",
                            width: 600,
                            render: (desc: string) => {
                              if (!desc) return <Text type="secondary">-</Text>;
                              const isLong = desc.length > 100;
                              return (
                                <Flex vertical align="start" gap={4}>
                                  <Text style={{ fontSize: 13, lineHeight: "1.5" }}>
                                    {isLong ? `${desc.slice(0, 100)}...` : desc}
                                  </Text>
                                  {isLong && (
                                    <Button
                                      type="link"
                                      size="small"
                                      style={{ padding: 0, height: "auto", fontSize: 12 }}
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
                                      ดูรายละเอียดเพิ่มเติม
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
                            width: 100,
                            align: "right",
                            sorter: (a: any, b: any) => a.hours - b.hours,
                            render: (h: number) => (
                              <Text strong style={{ color: token.colorInfoText, fontSize: 14 }}>
                                {h.toFixed(2)}
                              </Text>
                            ),
                          },
                        ]}
                        locale={{
                          emptyText: (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="ไม่พบประวัติการลงเวลา"
                            />
                          ),
                        }}
                      />
                    </Card>
                  );
                },
                columnTitle: (
                  <Tooltip title="คลิกเพื่อดูรายละเอียดรายบุคคล">
                    <HistoryOutlined />
                  </Tooltip>
                ),
                expandRowByClick: true,
              }}
              columns={[
                {
                  title: "โครงการย่อย / ฟีเจอร์",
                  dataIndex: "feature_name",
                  key: "feature_name",
                  width: 500,
                  sorter: (a: any, b: any) =>
                    (a.feature_name || "").localeCompare(b.feature_name || ""),
                  render: (text: string, record: ProjectStatDetail) => (
                    <Space direction="vertical" size={0}>
                      <Text strong style={{ fontSize: 14 }}>
                        {text}
                      </Text>
                      {record.is_deleted && (
                        <Tag
                          color="error"
                          bordered={false}
                          style={{ fontSize: 10, lineHeight: "14px" }}
                        >
                          ถูกลบ
                        </Tag>
                      )}
                    </Space>
                  ),
                },
                {
                  title: "ประเภทรายจ่าย",
                  dataIndex: "asset_capture_type",
                  key: "asset_capture_type",
                  width: 240,
                  align: "center",
                  sorter: (a: any, b: any) =>
                    (a.asset_capture_type || "").localeCompare(
                      b.asset_capture_type || "",
                    ),
                  render: (type: string) => (
                    <Tag
                      color={type === "CAPTUREABLE" ? "success" : "default"}
                      bordered={false}
                      style={{ fontWeight: 600, padding: "4px 12px", borderRadius: 6 }}
                    >
                      {type === "CAPTUREABLE"
                        ? "Capitalization ทรัพย์สิน"
                        : "Expense รายจ่าย"}
                    </Tag>
                  ),
                },
                {
                  title: "ชั่วโมงรวม",
                  dataIndex: "hours",
                  key: "hours",
                  width: 180,
                  align: "right",
                  sorter: (a: any, b: any) => a.hours - b.hours,
                  render: (val: number) => (
                    <Text strong style={{ color: token.colorInfoText, fontSize: 15 }}>
                      {val.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  ),
                },
                {
                  title: "สัดส่วนงาน (%)",
                  dataIndex: "percent",
                  key: "percent",
                  width: 200,
                  sorter: (a: any, b: any) => a.percent - b.percent,
                  render: (val: number) => (
                    <Tooltip title={`${val}% ของโครงการนี้`}>
                      <Flex align="center" gap={12} style={{ width: "100%" }}>
                        <Progress
                          percent={val}
                          strokeColor={token.colorPrimary}
                          trailColor={token.colorFillQuaternary}
                          showInfo={false}
                          size="small"
                          style={{ flex: 1, margin: 0 }}
                        />
                        <Text
                          strong
                          style={{
                            width: 55,
                            whiteSpace: "nowrap",
                            textAlign: "right",
                            fontSize: 13,
                          }}
                        >
                          {val}%
                        </Text>
                      </Flex>
                    </Tooltip>
                  ),
                },
              ]}
              summary={(pageData) => (
                <Table.Summary.Row
                  style={{ backgroundColor: token.colorFillQuaternary }}
                >
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text strong>รวมสุทธิในโครงการนี้</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ fontSize: 16, color: token.colorInfoText }}>
                      {pageData
                        .reduce((acc, curr) => acc + curr.hours, 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              )}
            />

            <Alert
              message="มาตรฐานการตรวจสอบระบบ (IPO Traceability Protocol)"
              description="ข้อมูลการลงเวลาถูกแยกประเภทตาม Capitalization Rules โดยระบบรองรับการ Audit รายบุคคล (User-level Drill down) เพื่อใช้เป็นหลักฐานประกอบการลงบัญชี Capitalization ทรัพย์สิน และ Expense รายจ่ายของบริษัท"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Flex>
        )}
      </Modal>
    </>
  );
};
