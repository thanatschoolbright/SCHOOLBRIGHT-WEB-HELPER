"use client";

import { SwapOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text } = Typography;

interface ReassignFormValues {
  assignee_id: number;
  comment?: string;
}

/**
 * Modal สำหรับ Quick Re-assign — เปลี่ยนผู้รับผิดชอบงานโดยไม่ต้องออกจากหน้า Dashboard
 */
export const QuickReassignModal = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm<ReassignFormValues>();

  const {
    reassignModalOpen,
    reassignIssueKey,
    reassignIssueSummary,
    reassignCurrentAssigneeName,
    reassignLoading,
    closeReassignModal,
    submitReassign,
    assigneeOptions,
  } = useBacklogDashboardStore();

  // ส่งฟอร์มเมื่อกด "มอบหมายงาน"
  const handleSubmit = async () => {
    const values = await form.validateFields();
    await submitReassign(values.assignee_id, values.comment);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    closeReassignModal();
  };

  return (
    <Modal
      open={reassignModalOpen}
      title={
        <Space>
          <SwapOutlined style={{ color: token.colorPrimary }} />
          <Text style={{ fontWeight: 600 }}>มอบหมายงานใหม่</Text>
        </Space>
      }
      okText="มอบหมายงาน"
      cancelText="ยกเลิก"
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={reassignLoading}
      width={520}
      styles={{
        header: {
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          paddingBottom: 12,
        },
        body: { padding: "20px 24px" },
      }}
      destroyOnHidden
    >
      {/* ข้อมูล Issue */}
      <Row
        style={{
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
          padding: "12px 16px",
          marginBottom: 20,
        }}
        gutter={[8, 4]}
      >
        <Col span={24}>
          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
            เลข Task
          </Text>
        </Col>
        <Col span={24}>
          <Space>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              {reassignIssueKey ?? "-"}
            </Tag>
            <Text style={{ fontSize: "0.9rem" }} ellipsis>
              {reassignIssueSummary ?? "-"}
            </Text>
          </Space>
        </Col>
        {reassignCurrentAssigneeName && (
          <>
            <Col span={24} style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                ผู้รับผิดชอบปัจจุบัน
              </Text>
            </Col>
            <Col span={24}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{reassignCurrentAssigneeName}</Text>
              </Space>
            </Col>
          </>
        )}
      </Row>

      {/* ฟอร์ม */}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="assignee_id"
          label={<Text strong>มอบหมายให้</Text>}
          rules={[
            { required: true, message: "กรุณาเลือกพนักงานที่ต้องการมอบงาน" },
          ]}
        >
          <Select
            showSearch
            placeholder="ค้นหาชื่อพนักงาน..."
            optionFilterProp="label"
            size="large"
            allowClear
            options={assigneeOptions.map((opt) => ({
              label: opt.label,
              value: Number(opt.value),
            }))}
            suffixIcon={<UserOutlined />}
          />
        </Form.Item>

        <Form.Item name="comment" label={<Text strong>หมายเหตุ (ถ้ามี)</Text>}>
          <Input.TextArea
            rows={3}
            placeholder="เพิ่มหมายเหตุการมอบหมายงาน เช่น เหตุผลที่โอนงาน..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
