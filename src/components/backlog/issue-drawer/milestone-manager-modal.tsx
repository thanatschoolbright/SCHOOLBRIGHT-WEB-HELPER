"use client";

import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import type { Milestone, MilestoneFormValues } from "./types";

export type MilestoneManagerModalProps = {
  editingMilestone: Milestone | null;
  form: FormInstance<MilestoneFormValues>;
  loading: boolean;
  onCancel: () => void;
  onDelete: (milestoneId: number) => void;
  onEdit: (milestone: Milestone) => void;
  onFinish: (values: MilestoneFormValues) => void;
  onResetEdit: () => void;
  open: boolean;
  saving: boolean;
  selectedDeletingId: number | null;
  milestones: Milestone[];
};

//** Modal จัดการ Milestone (เพิ่ม/แก้ไข/ลบ) พร้อมฟอร์มและรายการ
export default function MilestoneManagerModal({
  editingMilestone,
  form,
  loading,
  onCancel,
  onDelete,
  onEdit,
  onFinish,
  onResetEdit,
  open,
  saving,
  selectedDeletingId,
  milestones,
}: MilestoneManagerModalProps) {
  return (
    <Modal
      centered
      destroyOnClose={false}
      footer={null}
      open={open}
      styles={{ content: { borderRadius: 20, padding: 24 } }}
      title="จัดการ Milestone"
      width={600}
      onCancel={onCancel}
    >
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          เพิ่ม แก้ไข หรือลบ Milestone เพื่อใช้กับการอัปเดตแบบกลุ่มและการกรองข้อมูล
        </Typography.Paragraph>

        <Form
          form={form}
          initialValues={{ archived: false }}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="ชื่อ Milestone"
            name="name"
            rules={[{ required: true, message: "กรุณากรอกชื่อ Milestone" }]}
          >
            <Input placeholder="เช่น Sprint 01" />
          </Form.Item>
          <Form.Item label="รายละเอียด" name="description">
            <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
          </Form.Item>
          <Space size={12} style={{ width: "100%" }} wrap>
            <Form.Item label="วันเริ่ม" name="startDate">
              <DatePicker allowClear />
            </Form.Item>
            <Form.Item label="วันกำหนดส่ง" name="releaseDueDate">
              <DatePicker allowClear />
            </Form.Item>
            <Form.Item label="สถานะ" name="archived" valuePropName="checked">
              <Switch checkedChildren="Archived" unCheckedChildren="Active" />
            </Form.Item>
          </Space>
          <Space>
            <Button htmlType="submit" loading={saving} type="primary">
              {editingMilestone ? "บันทึกการแก้ไข" : "เพิ่ม Milestone"}
            </Button>
            {editingMilestone ? (
              <Button disabled={saving} onClick={onResetEdit}>
                ยกเลิกการแก้ไข
              </Button>
            ) : null}
          </Space>
        </Form>

        <Divider style={{ margin: 0 }} />

        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <List
            dataSource={milestones}
            locale={{ emptyText: "ยังไม่มี Milestone" }}
            rowKey={(item) => String(item.id)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="edit" size="small" onClick={() => onEdit(item)}>
                    แก้ไข
                  </Button>,
                  <Popconfirm
                    key="delete"
                    cancelText="ยกเลิก"
                    okText="ลบ"
                    title="ยืนยันการลบ Milestone"
                    onConfirm={() => onDelete(item.id)}
                  >
                    <Button
                      danger
                      size="small"
                      loading={selectedDeletingId === item.id}
                    >
                      ลบ
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  description={
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Typography.Text>{item.description || "-"}</Typography.Text>
                      <Typography.Text type="secondary">
                        เริ่ม: {formatDate(item.startDate)} • กำหนดส่ง:{" "}
                        {formatDate(item.releaseDueDate)}
                      </Typography.Text>
                    </Space>
                  }
                  title={
                    <Space size={8} wrap>
                      <Typography.Text strong>{item.name}</Typography.Text>
                      {item.archived ? <Tag color="default">Archived</Tag> : null}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Modal>
  );
}

//** Helper แสดงวันที่ให้อ่านง่ายใน Modal
function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
