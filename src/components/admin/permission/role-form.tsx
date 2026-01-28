"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Checkbox,
  Table,
  Space,
  Tag,
  Alert,
  Switch,
} from "antd";
import {
  SaveOutlined,
  CopyOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

const { Title, Text } = Typography;

interface Permission {
  id: number;
  p_code: string;
  name_th: string;
  description?: string;
}

interface Role {
  id: number;
  role_name: string;
  description?: string;
  is_active: boolean;
  permissions: {
    permission_id: number;
    permission: Permission;
  }[];
}

interface RoleFormProps {
  initialValues?: any;
  mode: "create" | "edit";
  roleId?: number;
}

export default function RoleForm({
  initialValues,
  mode,
  roleId,
}: RoleFormProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permSearch, setPermSearch] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    [],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roleRes, permRes] = await Promise.all([
          axios.get("/api/v2/admin/role-management/read"),
          axios.get("/api/v2/admin/permission-management/read"),
        ]);
        setRoles(roleRes?.data?.data?.items || []);
        setPermissions(permRes?.data?.data || []);
      } catch (error) {
        toast.error("ไม่สามารถโหลดข้อมูลพื้นฐานได้");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.permission_ids) {
        setSelectedPermissionIds(initialValues.permission_ids);
      }
    }
  }, [initialValues, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        permission_ids: selectedPermissionIds,
      };

      if (mode === "create") {
        await axios.post("/api/v2/admin/role-management/create", payload);
        toast.success("สร้างบทบาทสำเร็จ");
      } else {
        await axios.post("/api/v2/admin/role-management/update", {
          ...payload,
          id: roleId,
        });
        toast.success("อัปเดตบทบาทสำเร็จ");
      }
      router.push("/admin/permission-management");
    } catch (error: any) {
      toast.error(error?.response?.data?.message_th || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPermissions = (role: Role) => {
    const pIds = role.permissions.map((p) => p.permission_id);
    setSelectedPermissionIds(pIds);
    toast.info(
      `คัดลอกสิทธิ์จาก ${role.role_name} แล้ว (${pIds.length} รายการ)`,
    );
  };

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name_th.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.p_code.toLowerCase().includes(permSearch.toLowerCase()),
  );

  const columns = [
    {
      title: "ชื่อสิทธิ์การเข้าถึง",
      dataIndex: "name_th",
      key: "name_th",
      render: (text: string, record: Permission) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.p_code}
          </Text>
        </Space>
      ),
    },
    {
      title: "โมดูล",
      dataIndex: "p_code",
      key: "module",
      width: 150,
      render: (code: string) => {
        const module = code.split(".")[0] || "other";
        return <Tag color="blue">{module.toUpperCase()}</Tag>;
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 100,
      align: "center" as const,
      render: (_: any, record: Permission) =>
        selectedPermissionIds.includes(record.id) ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ is_active: true }}
    >
      <Row gutter={24}>
        <Col span={24} className="mb-6 flex justify-between items-center">
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/admin/permission-management")}
            >
              กลับ
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              {mode === "create"
                ? "สร้างบทบาทใหม่"
                : "แก้ไขบทบาทและกำหนดสิทธิ์"}
            </Title>
          </Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            size="large"
          >
            บันทึกข้อมูล
          </Button>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="ข้อมูลพื้นฐาน"
            bordered={false}
            className="shadow-sm mb-6"
            style={{ borderRadius: 16 }}
          >
            <Form.Item
              name="role_name"
              label="ชื่อบทบาท (ภาษาอังกฤษ)"
              rules={[{ required: true, message: "กรุณาระบุชื่อบทบาท" }]}
            >
              <Input placeholder="เช่น HR_MANAGER, SYSTEM_ADMIN" />
            </Form.Item>

            <Form.Item name="description" label="รายละเอียด/คำอธิบาย">
              <Input.TextArea
                rows={4}
                placeholder="ระบุขอบเขตการทำงานของบทบาทนี้..."
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="สถานะการใช้งาน"
              valuePropName="checked"
            >
              <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
            </Form.Item>

            <Divider orientation="left">Template</Divider>
            <Alert
              message="คัดลอกสิทธิ์จากบทบาทอื่น"
              description="เลือกบทบาทที่มีอยู่เพื่อนำมาเป็นต้นแบบ"
              type="info"
              showIcon
              className="mb-4"
            />
            <Row gutter={[8, 8]}>
              {roles.map((r) => (
                <Col span={24} key={r.id}>
                  <Button
                    block
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyPermissions(r)}
                  >
                    {r.role_name}
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex justify-between items-center w-full">
                <span>
                  กำหนด Matrix รายสิทธิ์เด็ดขาด ({selectedPermissionIds.length}{" "}
                  รายการ)
                </span>
                <Input
                  placeholder="ค้นหาสิทธิ์..."
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                  onChange={(e) => setPermSearch(e.target.value)}
                />
              </div>
            }
            bordered={false}
            className="shadow-sm"
            style={{ borderRadius: 16 }}
          >
            <Table
              dataSource={filteredPermissions}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 12 }}
              rowSelection={{
                selectedRowKeys: selectedPermissionIds,
                onChange: (keys) => setSelectedPermissionIds(keys as number[]),
              }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </Form>
  );
}
