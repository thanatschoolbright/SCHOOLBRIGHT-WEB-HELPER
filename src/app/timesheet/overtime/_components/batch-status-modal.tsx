"use client";

import { OT_STATUS } from "@/constants/overtime-status";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Col,
  Flex,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";

interface BatchStatusModalProps {
  visible: boolean;
  onClose: () => void;
  selectedRowKeys: any[];
  batchSelectedStatus: string | null;
  setBatchSelectedStatus: (status: string) => void;
  requestBatchApproveOvertimeSubmission: (
    status: string | null,
  ) => Promise<void>;
  batchProcessing: boolean;
  processedRecordItems: Map<number, string>;
  overtimeDataSource: any[];
}

/**
 * หน้าต่างสำหรับเปลี่ยนสถานะรายการที่เลือกพร้อมกัน (Batch Update)
 */
const BatchStatusModal: React.FC<BatchStatusModalProps> = ({
  visible,
  onClose,
  selectedRowKeys,
  batchSelectedStatus,
  setBatchSelectedStatus,
  requestBatchApproveOvertimeSubmission,
  batchProcessing,
  processedRecordItems,
  overtimeDataSource,
}) => {
  const { token } = theme.useToken();

  const selectedRecords = useMemo(() => {
    return overtimeDataSource.filter((item: any) =>
      selectedRowKeys.includes(item.id),
    );
  }, [selectedRowKeys, overtimeDataSource]);

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: token.colorWarning }} />{" "}
          เปลี่ยนสถานะรายการที่เลือกพร้อมกัน
        </Space>
      }
      open={visible}
      onCancel={onClose}
      onOk={async () => {
        await requestBatchApproveOvertimeSubmission(batchSelectedStatus);
      }}
      confirmLoading={batchProcessing}
      okButtonProps={{ disabled: !batchSelectedStatus }}
      okText={batchProcessing ? "กำลังดำเนินการ..." : "ยืนยันการเปลี่ยนสถานะ"}
      cancelText="ปิดหน้าต่าง"
      centered
      width={1000}
      style={{ borderRadius: 20, overflow: "hidden" }}
      maskClosable={false}
    >
      <Flex vertical gap={24} style={{ paddingBlock: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <Flex vertical gap={20}>
              <Flex
                vertical
                gap={8}
                style={{
                  padding: "16px 20px",
                  background: token.colorInfoBg,
                  borderRadius: 12,
                  border: `1px solid ${token.colorInfoBorder}`,
                }}
              >
                <Typography.Text>
                  รายการที่เลือกทั้งหมด:{" "}
                  <Typography.Text strong type="primary">
                    {selectedRowKeys.length}
                  </Typography.Text>{" "}
                  รายการ
                </Typography.Text>
              </Flex>

              <Flex vertical gap={10}>
                <Typography.Text strong>
                  เลือกสถานะที่ต้องการปรับปรุง:
                </Typography.Text>
                <Select
                  value={batchSelectedStatus}
                  onChange={setBatchSelectedStatus}
                  disabled={batchProcessing}
                  placeholder="เลือกสถานะ..."
                  options={OT_STATUS.map((item) => ({
                    label: item.text,
                    value: item.value,
                  }))}
                  style={{ width: "100%", height: 48 }}
                />
              </Flex>

              <Flex
                align="center"
                gap={10}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                }}
              >
                <WarningOutlined style={{ color: "#faad14" }} />
                <Typography.Text style={{ fontSize: 12 }}>
                  ระบบจะดำเนินการประมวลผลทีละรายการ (Queue)
                  เพื่อความถูกต้องของข้อมูล
                </Typography.Text>
              </Flex>
            </Flex>
          </Col>

          <Col span={16}>
            <div
              style={{
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Table
                dataSource={selectedRecords}
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
                rowKey="id"
                columns={[
                  {
                    title: "รหัส",
                    dataIndex: "id",
                    width: 100,
                    render: (id) => <Tag>#{id}</Tag>,
                  },
                  {
                    title: "พนักงาน",
                    key: "requester",
                    render: (record) => {
                      const name =
                        record.requester_name ||
                        record.requester_user?.name ||
                        "-";
                      return (
                        <Space>
                          <Avatar
                            size="small"
                            src={record.requester_user?.profile_image}
                          />
                          <Typography.Text ellipsis style={{ maxWidth: 150 }}>
                            {name}
                          </Typography.Text>
                        </Space>
                      );
                    },
                  },
                  {
                    title: "วันที่ขอ",
                    dataIndex: "request_date",
                    width: 120,
                    render: (date) => dayjs(date).format("DD/MM/YYYY"),
                  },
                  {
                    title: "สถานะดำเนินการ",
                    key: "processing_status",
                    width: 180,
                    align: "center",
                    render: (record) => {
                      const status =
                        processedRecordItems.get(record.id) || "waiting";
                      const configs: any = {
                        waiting: {
                          color: "default",
                          icon: <ClockCircleOutlined />,
                          text: "รอคิว",
                        },
                        processing: {
                          color: "processing",
                          icon: <LoadingOutlined />,
                          text: "กำลังส่งข้อมูล",
                        },
                        completed: {
                          color: "success",
                          icon: <CheckCircleOutlined />,
                          text: "สำเร็จ",
                        },
                        failed: {
                          color: "error",
                          icon: <CloseCircleOutlined />,
                          text: "ล้มเหลว",
                        },
                      };
                      const config = configs[status];
                      return (
                        <Tag
                          icon={config.icon}
                          color={config.color}
                          style={{ margin: 0 }}
                        >
                          {config.text}
                        </Tag>
                      );
                    },
                  },
                ]}
              />
            </div>
          </Col>
        </Row>
      </Flex>
    </Modal>
  );
};

export default BatchStatusModal;
