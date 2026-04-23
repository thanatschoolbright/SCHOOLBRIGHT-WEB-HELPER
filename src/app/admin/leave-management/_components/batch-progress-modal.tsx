"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { Button, Modal, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BatchItemStatus,
  BatchProgressItem,
  useLeaveManagementStore,
} from "../_state/leave-management-store";

// แปลงสถานะเป็น Tag สำหรับแสดงใน Modal
const StatusTag = ({ status }: { status: BatchItemStatus }) => {
  if (status === "waiting")
    return (
      <Tag icon={<MinusCircleOutlined />} color="default">
        รอคิว
      </Tag>
    );
  if (status === "processing")
    return (
      <Tag icon={<LoadingOutlined spin />} color="processing">
        กำลังดำเนินการ
      </Tag>
    );
  if (status === "success")
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        สำเร็จ
      </Tag>
    );
  return (
    <Tag icon={<CloseCircleOutlined />} color="error">
      ไม่สำเร็จ
    </Tag>
  );
};

export const BatchProgressModal = () => {
  const {
    showProgressModal,
    batchProgress,
    isApproving,
    setShowProgressModal,
  } = useLeaveManagementStore();

  const successCount = batchProgress.filter(
    (p) => p.status === "success",
  ).length;
  const errorCount = batchProgress.filter((p) => p.status === "error").length;
  const total = batchProgress.length;
  const isDone = !isApproving && batchProgress.length > 0;

  const columns: ColumnsType<BatchProgressItem> = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_, __, index) => (
        <Typography.Text type="secondary">{index + 1}</Typography.Text>
      ),
    },
    {
      title: "ชื่อ",
      dataIndex: "student_name",
      key: "student_name",
    },
    {
      title: "ประเภทการลา",
      dataIndex: "leave_type",
      key: "leave_type",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: BatchItemStatus) => <StatusTag status={status} />,
    },
    {
      title: "หมายเหตุ",
      dataIndex: "error_message",
      key: "error_message",
      render: (msg?: string) =>
        msg ? (
          <Typography.Text type="danger" style={{ fontSize: "0.85rem" }}>
            {msg}
          </Typography.Text>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <Modal
      open={showProgressModal}
      title={
        <Typography.Text strong>
          ผลการดำเนินการ{isApproving ? " (กำลังประมวลผล...)" : ""}
        </Typography.Text>
      }
      footer={
        isDone ? (
          <Button type="primary" onClick={() => setShowProgressModal(false)}>
            ปิด
          </Button>
        ) : null
      }
      closable={isDone}
      onCancel={() => isDone && setShowProgressModal(false)}
      maskClosable={false}
      width={680}
    >
      {/* สรุปผล */}
      {isDone && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text>
            ทั้งหมด <Typography.Text strong>{total}</Typography.Text> รายการ
            {" — "}
            <Typography.Text
              strong
              style={{ color: "var(--ant-color-success)" }}
            >
              สำเร็จ {successCount}
            </Typography.Text>
            {errorCount > 0 && (
              <>
                {", "}
                <Typography.Text strong type="danger">
                  ไม่สำเร็จ {errorCount}
                </Typography.Text>
              </>
            )}
          </Typography.Text>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={batchProgress}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ y: 360 }}
      />
    </Modal>
  );
};
