import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  Typography,
  Tooltip,
  Card,
  Tag,
  theme,
  Empty,
  Flex,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { ProjectStatus } from "../types/project.types";

const { Text } = Typography;

interface ProjectStatusModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectStatusModal: React.FC<ProjectStatusModalProps> = ({
  open,
  onClose,
}) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/status/read/", {
        method: "POST",
      });
      const json = await res.json();
      if (json.status === 200) {
        setStatuses(json.data);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลสถานะได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStatuses();
    }
  }, [open]);

  const handleAdd = () => {
    if (editingKey !== null) {
      toast.warning("โปรดบันทึกการแก้ไขเดิมก่อน");
      return;
    }
    const newPriority =
      statuses.length > 0
        ? Math.max(...statuses.map((s) => s.priority)) + 1
        : 1;
    const newRecord: ProjectStatus = {
      id: 0,
      priority: newPriority,
      nameTh: "",
      nameEn: "",
    };
    setStatuses([...statuses, newRecord]);
    setEditingKey(0);
    form.setFieldsValue({ ...newRecord });
  };

  const handleEdit = (record: ProjectStatus) => {
    setEditingKey(record.id);
    form.setFieldsValue({ ...record });
  };

  const handleCancel = () => {
    if (editingKey === 0) {
      setStatuses(statuses.filter((s) => s.id !== 0));
    }
    setEditingKey(null);
  };

  const handleSave = async (id: number) => {
    setActionLoading(true);
    try {
      const row = await form.validateFields();
      const payload = { ...row, id: id === 0 ? undefined : id };

      const res = await fetch("/api/v1/timesheet/project/status/insert/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.status === 200) {
        toast.success(id === 0 ? "เพิ่มสถานะสำเร็จ" : "อัปเดตสถานะสำเร็จ");
        setEditingKey(null);
        await fetchStatuses();
      } else {
        toast.error(json.message_th || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (errInfo: any) {
      if (!errInfo?.errorFields) {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        console.error("Save Error:", errInfo);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/status/delete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.status === 200) {
        toast.success("ลบสถานะสำเร็จ");
        await fetchStatuses();
      } else {
        toast.error(json.message_th || "ไม่สามารถลบได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setActionLoading(false);
    }
  };

  const isEditing = (record: ProjectStatus) => record.id === editingKey;

  const columns = [
    {
      title: (
        <Space>
          Priority
          <Tooltip title="ลำดับความสำคัญ (SDLC Step) ต้องไม่ซ้ำกัน เพื่อความชัดเจนในการทำงาน">
            <QuestionCircleOutlined
              style={{ fontSize: 12, color: token.colorTextDescription }}
            />
          </Tooltip>
        </Space>
      ),
      dataIndex: "priority",
      width: 120,
      render: (text: number, record: ProjectStatus) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="priority"
              style={{ margin: 0 }}
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          );
        }
        return (
          <Tag color="blue" style={{ fontWeight: 700, borderRadius: 4 }}>
            Step {text}
          </Tag>
        );
      },
    },
    {
      title: "ชื่อสถานะ (ภาษาไทย)",
      dataIndex: "nameTh",
      render: (text: string, record: ProjectStatus) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="nameTh"
              style={{ margin: 0 }}
              rules={[{ required: true, message: "กรุณาระบุชื่อสถานะ" }]}
            >
              <Input placeholder="เช่น รอดำเนินการ..." />
            </Form.Item>
          );
        }
        return <Text strong>{text}</Text>;
      },
    },
    {
      title: "ชื่อสถานะ (ภาษาอังกฤษ)",
      dataIndex: "nameEn",
      render: (text: string, record: ProjectStatus) => {
        if (isEditing(record)) {
          return (
            <Form.Item name="nameEn" style={{ margin: 0 }}>
              <Input placeholder="เช่น Pending..." />
            </Form.Item>
          );
        }
        return <Text type="secondary">{text || "-"}</Text>;
      },
    },
    {
      title: "จัดการ",
      dataIndex: "operation",
      width: 140,
      align: "center" as const,
      render: (_: any, record: ProjectStatus) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Tooltip title="บันทึกข้อมูล">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="small"
                onClick={() => handleSave(record.id)}
                loading={actionLoading}
              />
            </Tooltip>
            <Tooltip title="ยกเลิกการแก้ไข">
              <Button
                icon={<CloseOutlined />}
                size="small"
                onClick={handleCancel}
                disabled={actionLoading}
              />
            </Tooltip>
          </Space>
        ) : (
          <Space>
            <Tooltip title="แก้ไขข้อมูลสถานะ">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                disabled={editingKey !== null || actionLoading}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Popconfirm
              title="ยืนยันการลบสถานะนี้หรือไม่?"
              onConfirm={() => handleDelete(record.id)}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              disabled={actionLoading}
            >
              <Tooltip title="ลบข้อมูลสถานะ">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  disabled={editingKey !== null || actionLoading}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorFillSecondary})`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 18 }} />
          </div>
          <Text strong style={{ fontSize: 18 }}>
            ตั้งค่าสถานะโครงการ (SDLC Cycle)
          </Text>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg">
          ปิดหน้าต่าง
        </Button>,
      ]}
      width={850}
      centered
      styles={{ content: { borderRadius: 20, padding: 24 } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Card
          size="small"
          style={{
            background: token.colorInfoBg,
            borderColor: token.colorInfoBorder,
            borderRadius: 12,
          }}
        >
          <Flex gap={12} align="start">
            <InfoCircleOutlined
              style={{ color: token.colorInfo, marginTop: 4, fontSize: 16 }}
            />
            <div>
              <Text strong style={{ color: token.colorInfoText }}>
                ข้อแนะนำการตั้งค่าสถานะ
              </Text>
              <br />
              <Text style={{ fontSize: 13, color: token.colorInfoText }}>
                โดย <b>Priority</b> (Step 1, 2, 3...) จะใช้ระบุลำดับการทำงานแบบ
                SDLC Cycle ของโครงการและโครงการย่อย
                สถานะเหล่านี้จะถูกนำไปใช้ในการกรองข้อมูลและการทำ Dashboard
                โปรดจัดการลำดับให้ถูกต้องและไม่ซ้ำกันเพื่อขั้นตอนที่ราบรื่น
              </Text>
            </div>
          </Flex>
        </Card>
      </div>

      <Flex justify="end" style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="rounded-lg shadow-sm"
          disabled={editingKey !== null || actionLoading}
          size="large"
        >
          เพิ่มลำดับสถานะใหม่
        </Button>
      </Flex>

      <Form form={form} component={false}>
        <Table
          dataSource={statuses}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="large"
          className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
          locale={{ emptyText: <Empty description="ยังไม่มีการระบุสถานะ" /> }}
        />
      </Form>
    </Modal>
  );
};
