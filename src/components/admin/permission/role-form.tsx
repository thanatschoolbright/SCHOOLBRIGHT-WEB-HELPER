"use client";

import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  // Helper สำหรับแปลและอธิบายสิทธิ์
  const getPermissionRouteDetail = (code: string) => {
    const parts = code.split(".");
    const mainModule = parts[0];
    const subModule = parts[1];

    const moduleThaiNames: Record<string, string> = {
      menu: "เข้าใช้งานหน้าเมนู",
      api: "เรียกใช้ข้อมูล API",
      action: "ดำเนินการคำสั่ง",
      admin: "ตั้งค่าระบบหลัก",
      user: "จัดการผู้ใช้งาน",
      timesheet: "ระบบลงเวลา",
      support: "สนับสนุนทางเทคนิค",
      testing: "การทดสอบระบบ",
    };

    const sectionThaiNames: Record<string, string> = {
      user_profile: "ประวัติพนักงาน",
      role_management: "จัดการบทบาทและสิทธิ์",
      position_management: "จัดการตำแหน่ง",
      department_management: "จัดการแผนก",
      load_testing: "ทดสอบการแบกรับโหลด",
      bypass_school: "ข้ามขั้นตอนโรงเรียน",
      test_nfc_card: "ทดสอบบัตร NFC",
      cancel_sales: "ยกเลิกการขาย",
      logs: "ดูบันทึกเหตุการณ์",
    };

    const typeLabel = moduleThaiNames[mainModule] || mainModule;
    const sectionLabel = sectionThaiNames[subModule] || subModule;

    return (
      <Space direction="vertical" size={0}>
        <div className="flex items-center gap-2">
          <Tag
            color={mainModule === "menu" ? "blue" : "orange"}
            style={{ borderRadius: 4 }}
          >
            {typeLabel}
          </Tag>
          <Text strong style={{ fontSize: 13, color: "#334155" }}>
            {sectionLabel}
          </Text>
        </div>
        <div style={{ paddingLeft: 4, marginTop: 4 }}>
          {mainModule === "menu" ? (
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                background: "#f1f5f9",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              เส้นทาง:{" "}
              <span
                style={{ color: "#0f172a", fontWeight: 500 }}
              >{`/admin/${subModule?.replace(/_/g, "-") || ""}`}</span>
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              ประเภท: ระบบเบื้องหลัง (System Action)
            </Text>
          )}
        </div>
      </Space>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roleRes, permRes] = await Promise.all([
          axios.get("/api/v2/admin/role-management/read"),
          axios.get("/api/v2/admin/permission-management/read"),
        ]);
        setRoles(roleRes?.data?.data?.items || []);
        setPermissions(permRes?.data?.data || []);

        // If in edit mode and has roleId, fetch existing role data
        if (mode === "edit" && roleId) {
          const res = await axios.get(
            `/api/v2/admin/role-management/read-by-id?id=${roleId}`,
          );
          const roleData = res?.data?.data;
          if (roleData) {
            form.setFieldsValue({
              role_name: roleData.role_name,
              description: roleData.description,
              is_active: roleData.is_active,
            });

            // Extract permission IDs from the join table structure
            const pIds = roleData.permissions.map((p: any) => p.permission_id);
            setSelectedPermissionIds(pIds);
          }
        }
      } catch (error) {
        toast.error("ไม่สามารถโหลดข้อมูลพื้นฐานได้");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode, roleId, form]);

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
      title: "ชื่อสิทธิ์และการอธิบาย",
      dataIndex: "name_th",
      key: "name_th",
      width: "35%",
      render: (text: string, record: Permission) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#1e293b", fontSize: 14 }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, lineHeight: "1.4" }}>
            {record.description || "สิทธิ์การเข้าถึงส่วนงานนี้ตามมาตรฐานระบบ"}
          </Text>
          <code
            style={{
              fontSize: 10,
              color: "#94a3b8",
              display: "block",
              marginTop: 4,
            }}
          >
            CODE: {record.p_code}
          </code>
        </Space>
      ),
    },
    {
      title: "ขอบเขตการเข้าถึง (Route Matrix)",
      key: "routing",
      render: (_: any, record: Permission) =>
        getPermissionRouteDetail(record.p_code),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 100,
      align: "center" as const,
      render: (_: any, record: Permission) =>
        selectedPermissionIds.includes(record.id) ? (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ borderRadius: 20, padding: "2px 10px" }}
          >
            เลือกแล้ว
          </Tag>
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
              pagination={{
                pageSize: 12,
                showSizeChanger: true,
                pageSizeOptions: ["12", "24", "48", "96", "100"],
                locale: { items_per_page: "/ หน้า" },
                showTotal: (total) => `รวมทั้งหมด ${total} สิทธิ์`,
              }}
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
