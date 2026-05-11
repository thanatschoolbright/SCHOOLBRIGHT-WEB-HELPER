import { StatusModalComponent } from "@/components/modal/status-modal-component";
import {
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Progress,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useEffect } from "react";
import { usePositionStore } from "../_state/position-store";

/**
 * รวม Modal ทั่งหมดในฟีเจอร์นี้
 */
export const PositionModals = () => {
  const [form] = Form.useForm();
  const {
    modalMode,
    setModalMode,
    selectedPos,
    submitPosition,
    deleteModalOpen,
    setDeleteModalOpen,
    confirmDelete,
    statusModal,
    setStatusModal,
    autoGenModalOpen,
    setAutoGenModalOpen,
    genStep,
    candidatePositions,
    handleDeleteCandidate,
    handleConfirmAutoGen,
    executionStatus,
    currentExecutionIndex,
  } = usePositionStore();

  // Reset form when modal open/closed or mode changed
  useEffect(() => {
    if (modalMode === "create") {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    } else if (modalMode === "edit" && selectedPos) {
      form.setFieldsValue(selectedPos);
    }
  }, [modalMode, selectedPos, form]);

  return (
    <>
      {/* Create/Edit Modal */}
      <Modal
        open={!!modalMode}
        title={modalMode === "create" ? "เพิ่มตำแหน่งใหม่" : "แก้ไขตำแหน่ง"}
        onCancel={() => setModalMode(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submitPosition}>
          <Form.Item
            name="name_th"
            label="ชื่อตำแหน่ง (TH)"
            rules={[{ required: true, message: "กรุณาระบุชื่อภาษาไทย" }]}
          >
            <Input placeholder="เช่น ผู้จัดการฝ่ายขาย" />
          </Form.Item>
          <Form.Item name="name_en" label="ชื่อตำแหน่ง (EN)">
            <Input placeholder="e.g. Sales Manager" />
          </Form.Item>
          <Form.Item name="description" label="คำอธิบาย">
            <Input.TextArea
              rows={3}
              placeholder="รายละเอียดหน้าที่ความรับผิดชอบ"
            />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="สถานะการใช้งาน"
            valuePropName="checked"
          >
            <Space.Compact>
              <Button
                type={form.getFieldValue("is_active") ? "primary" : "default"}
                onClick={() => form.setFieldsValue({ is_active: true })}
                icon={<CheckOutlined />}
              >
                เปิดใช้งาน
              </Button>
              <Button
                type={!form.getFieldValue("is_active") ? "primary" : "default"}
                danger={!form.getFieldValue("is_active")}
                onClick={() => form.setFieldsValue({ is_active: false })}
                icon={<CloseOutlined />}
              >
                ปิดใช้งาน
              </Button>
            </Space.Compact>
          </Form.Item>

          <Flex justify="end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setModalMode(null)}>ยกเลิก</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<CheckCircleOutlined />}
            >
              บันทึกข้อมูล
            </Button>
          </Flex>
        </Form>
      </Modal>

      {/* Delete Confirmation */}
      <StatusModalComponent
        open={deleteModalOpen}
        type="delete"
        title="ยืนยันการลบตำแหน่งงาน"
        message={`คุณต้องการลบตำแหน่ง "${selectedPos?.name_th}" หรือไม่? การดำเนินการนี้ไม่สามารถเรียกคืนได้`}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        confirmLabel="ลบทิ้ง"
        cancelLabel="ยกเลิก"
      />

      {/* Status Notification Modal */}
      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ open: false })}
      />

      {/* Auto Gen Modal */}
      <Modal
        open={autoGenModalOpen}
        title={
          <Space>
            <CloudServerOutlined className="text-blue-500" />
            ระบบสร้างตำแหน่งอัตโนมัติ (Position Generator)
          </Space>
        }
        width={700}
        onCancel={() => {
          if (genStep === "executing") return;
          setAutoGenModalOpen(false);
        }}
        footer={
          genStep === "review"
            ? [
                <Button key="cancel" onClick={() => setAutoGenModalOpen(false)}>
                  ยกเลิก
                </Button>,
                <Button
                  key="confirm"
                  type="primary"
                  onClick={handleConfirmAutoGen}
                >
                  ยืนยันและเริ่มสร้าง (
                  {
                    candidatePositions.filter((c) => c.status === "READY")
                      .length
                  }
                  )
                </Button>,
              ]
            : genStep === "summary"
            ? [
                <Button
                  key="close"
                  type="primary"
                  onClick={() => setAutoGenModalOpen(false)}
                >
                  ปิดหน้าต่าง
                </Button>,
              ]
            : null
        }
      >
        {genStep === "generating" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <div
              className="animate-spin"
              style={{ fontSize: "2.5rem", color: "#1890ff", marginBottom: 16 }}
            >
              <CloudServerOutlined />
            </div>
            <Typography.Text type="secondary">
              กำลังวิเคราะห์และสร้างรายการตำแหน่ง...
            </Typography.Text>
          </div>
        )}

        {genStep === "review" && (
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Alert
              type="info"
              showIcon
              message="ตรวจสอบรายการตำแหน่ง"
              description="ระบบได้สร้างรายการตำแหน่ง Tech Standard ให้คุณแล้ว กรุณาตรวจสอบก่อนยืนยัน หากตำแหน่งใดมีอยู่แล้วระบบจะข้ามการสร้าง"
            />
            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
              }}
            >
              <Table
                dataSource={candidatePositions}
                pagination={false}
                rowKey="name_th"
                size="small"
                columns={[
                  { title: "Position Name (TH)", dataIndex: "name_th" },
                  { title: "Position Name (EN)", dataIndex: "name_en" },
                  {
                    title: "Status",
                    dataIndex: "status",
                    width: 100,
                    render: (status) =>
                      status === "DUPLICATE" ? (
                        <Tooltip title="ตำแหน่งนี้มีอยู่แล้วในระบบ">
                          <Tag color="warning">Duplicate</Tag>
                        </Tooltip>
                      ) : (
                        <Tag color="success">Ready</Tag>
                      ),
                  },
                  {
                    title: "Action",
                    key: "action",
                    width: 60,
                    render: (_, __, idx) => (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCandidate(idx)}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </Space>
        )}

        {(genStep === "executing" || genStep === "summary") && (
          <Space direction="vertical" style={{ width: "100%" }} size={24}>
            <div style={{ textAlign: "center" }}>
              <Typography.Title level={4}>
                {genStep === "executing"
                  ? "กำลังสร้างตำแหน่ง..."
                  : "ดำเนินการเสร็จสิ้น"}
              </Typography.Title>
              <Progress
                percent={Math.round(
                  ((currentExecutionIndex + (genStep === "summary" ? 1 : 0)) /
                    candidatePositions.length) *
                    100,
                )}
                status={genStep === "summary" ? "success" : "active"}
              />
            </div>

            <div
              style={{
                height: 300,
                overflowY: "auto",
                backgroundColor: "#fafafa",
                padding: 16,
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
            >
              <Steps
                direction="vertical"
                size="small"
                current={currentExecutionIndex}
                items={executionStatus.map((item, idx) => ({
                  title: item.name_th,
                  description:
                    item.execStatus === "skipped" ? (
                      "ข้าม (มีอยู่แล้ว)"
                    ) : item.execStatus === "error" ? (
                      <span style={{ color: "#ff4d4f" }}>เกิดข้อผิดพลาด</span>
                    ) : item.execStatus === "success" ? (
                      <span style={{ color: "#52c41a" }}>สร้างสำเร็จ</span>
                    ) : (
                      "รอการดำเนินการ"
                    ),
                  status:
                    item.execStatus === "pending"
                      ? "wait"
                      : item.execStatus === "success"
                      ? "finish"
                      : item.execStatus === "error"
                      ? "error"
                      : item.execStatus === "skipped"
                      ? "process"
                      : "wait",
                  icon:
                    item.execStatus === "pending" &&
                    idx === currentExecutionIndex ? (
                      <LoadingOutlined />
                    ) : item.execStatus === "skipped" ? (
                      <CheckCircleOutlined style={{ color: "#8c8c8c" }} />
                    ) : undefined,
                }))}
              />
            </div>

            {genStep === "summary" && (
              <Alert
                type="success"
                showIcon
                message="สรุปผลการดำเนินการ"
                description={
                  <ul>
                    <li>
                      สร้างสำเร็จ:{" "}
                      {
                        executionStatus.filter(
                          (i) => i.execStatus === "success",
                        ).length
                      }{" "}
                      รายการ
                    </li>
                    <li>
                      ข้าม (มีอยู่แล้ว):{" "}
                      {
                        executionStatus.filter(
                          (i) => i.execStatus === "skipped",
                        ).length
                      }{" "}
                      รายการ
                    </li>
                    <li>
                      ผิดพลาด:{" "}
                      {
                        executionStatus.filter((i) => i.execStatus === "error")
                          .length
                      }{" "}
                      รายการ
                    </li>
                  </ul>
                }
              />
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};
