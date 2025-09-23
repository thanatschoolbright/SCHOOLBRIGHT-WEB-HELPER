// ใช้ client side
"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import Swal from "sweetalert2";
// นำเข้า Ant Design Components
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Space,
  Tag,
  Spin,
  Select,
  Skeleton,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SearchOutlined,
  UserOutlined,
  SmileOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import axios from "axios";

// สำหรับการแก้ไขข้อมูลผู้ใช้งาน
import FormData from "form-data";
import { UserProfile, UpdateUserInput, UserProfileForm } from "@stores/type";
import PermissionLayout from "@/components/layouts/permission-layout";

export default function Page() {
  const [antdForm] = Form.useForm();
  // ใช้ Redux store สำหรับข้อมูล authentication
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const [pageSize, setPageSize] = useState<number>(10);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "" | "create" | "edit" | "delete" | "detail"
  >("");
  const initialFormState: UserProfileForm = {
    username: "",
    password: "",
    name: "",
    firstname: "",
    lastname: "",
    nickname: "",
    email: "",
    tel: "",
    backlog_email: "",
    position: "",
    employee_code: "",
    admin_id: "",
    id: "",
  };
  const [formState, setFormState] = useState<
    UserProfileForm & { confirmText?: string }
  >(initialFormState);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [positions, setPositions] = useState<string[]>([]);

  const storageToLocal = (users: UserProfile[]) => {
    localStorage.setItem("users", JSON.stringify(users));
    toast.success("บันทึกข้อมูลผู้ใช้งานลง Local Storage แล้ว", {
      duration: 5000,
    });
  };

  const updateUser = async (fields: UpdateUserInput) => {
    console.info("Update Fields:", fields);
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const response = await axios.post("/api/v1/admin/user/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error("Failed to update user");
      }
      toast.success("อัปเดตข้อมูลผู้ใช้งานสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("อัปเดตข้อมูลผู้ใช้งานล้มเหลว", { duration: 5000 });
    }
  };

  // ฟังก์ชัน submit สำหรับอัปเดตผู้ใช้งาน
  const handleUpdateUser = async (values: UserProfileForm) => {
    await updateUser({
      // id: formState.id,
      admin_id: Number(values.admin_id),
      employee_code: values?.employee_code,
      firstname: values?.firstname,
      lastname: values?.lastname,
      nickname: values?.nickname,
      position: values?.position || "",
      email: values?.email || "",
      backlog_email: values?.backlog_email || "",
      tel: values?.tel || "",
    });
    setModalType("");
    await fetchUsers();
  };

  // ฟังก์ชันโหลดข้อมูลผู้ใช้งาน
  const fetchUsersByUserId = async (userId: string) => {
    try {
      const response = await axios.get(`/api/v1/admin/user/read/${userId}`);
      const result = response?.data?.data[0];
      console.info("User Detail:", result);
      setFormState(result);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const data = await axios.get("/api/v1/admin/user/");
      const fetchedUsers = data?.data?.data?.data || [];
      setUsers(fetchedUsers);
      storageToLocal(fetchedUsers);
    } catch (error) {
      setUsers([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setTableLoading(false);
    }
  };

  // ฟังก์ชันสร้างหรือแก้ไขผู้ใช้งาน
  const createOrUpdateUser = async (user: UserProfileForm) => {
    try {
      const payload = {
        username: user.username,
        name: user.name,
        lastname: user.lastname,
        ...(user.password ? { password: user.password } : {}),
      };

      const response = await axios.post(`/api/v1/admin/user/create`, payload, {
        headers: {
          "Content-Type": "application/json",
          "JabjaiKey-0-0": "",
        },
      });

      if (response.status < 200 || response.status >= 300)
        throw new Error("Failed to create or update user");

      toast.success("สร้าง/อัปเดตผู้ใช้งานสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("สร้าง/อัปเดตผู้ใช้งานล้มเหลว", { duration: 5000 });
    }
  };

  // ฟังก์ชันลบผู้ใช้งาน
  const deleteUser = async (id: number) => {
    try {
      const response = await axios.post(
        `/api/v1/timesheet/project/delete/`,
        {
          id,
          by: AUTHENTICATION.response.data.user_data.admin_id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status !== 200) throw new Error("Failed to delete project");
      toast.success("ลบข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      toast.error("ลบข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  // โหลดข้อมูลผู้ใช้งานเมื่อ mount
  useEffect(() => {
    fetchUsers();
    fetchPositions();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await axios.get("/api/v1/admin/user/constants/position");
      const result = response?.data?.data?.response?.data;
      console.info("Positions:", result);
      setPositions(result);
    } catch (error) {
      console.error("Failed to fetch positions:", error);
      setPositions([]);
    }
  };

  // ตรวจสอบสิทธิ์การเข้าถึง

  // เมื่อเปิด modal สร้างผู้ใช้งาน
  const openCreateUserModal = () => {
    setFormState(initialFormState);
    setModalType("create");
  };

  // เมื่อเปิด modal แก้ไขผู้ใช้งาน
  const openEditUserModal = async (user: UserProfile) => {
    await fetchUsersByUserId(user?.admin_id);
    setModalType("edit");
  };

  // เมื่อเปิด modal ลบผู้ใช้งาน
  const openDeleteUserModal = (id: number) => {
    setDeleteId(id);
    setFormState((prev) => ({ ...prev, confirmText: "" }));
    setModalType("delete");
  };

  // Copy User Information
  const copyUserInformation = (user: UserProfile) => {
    console.info("User Information Copied", JSON.stringify(user, null, 2));

    const textFormat = `
  📋 รายละเอียด
  ✨ ใช้งานสำหรับเข้าเว็บ
  https://sb-helper.schoolbright.co
  ━━━━━━━━━━━━━━━━

  👤 ชื่อ-นามสกุล     : ${user.firstname} ${user.lastname}
  🆔 ไอดี       : ${user.admin_id}
  📧 อีเมลล์    : ${user.email}
  📱 เบอร์มือถือ    : ${user.tel}
  🔰 ตำแหน่ง     : ${user.position}
  📅 รหัสพนักงาน  : ${user.employee_code}

  ━━━━━━━━━━━━━━━━
    `.trim();

    navigator.clipboard.writeText(textFormat);
    toast.success("ข้อมูลผู้ใช้ถูกคัดลอกไปยังคลิปบอร์ด");
  };

  // ฟังก์ชัน submit สำหรับสร้าง/แก้ไขผู้ใช้งาน
  const handleUserSubmit = async (values: {
    username: string;
    password?: string;
    name: string;
    lastname: string;
  }) => {
    const trimmedUsername = values?.username.trim();
    const trimmedName = values?.name.trim();
    const trimmedLastname = values?.lastname.trim();

    if (!trimmedUsername || !trimmedName || !trimmedLastname) return;

    const { confirmText, ...restState } = formState;

    await createOrUpdateUser({
      ...restState,
      username: trimmedUsername,
      password: values?.password?.trim(),
      name: trimmedName,
      lastname: trimmedLastname,
    });
    setModalType("");
    await fetchUsers();
  };

  // ฟังก์ชันยืนยันลบผู้ใช้งาน
  const confirmDeleteUser = async () => {
    if (deleteId === null) return;
    await deleteUser(deleteId);
    setModalType("");
    setDeleteId(null);
    await fetchUsers();
  };

  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      align: "center" as const,
      render: (_: any, __: any, idx: number) => idx + 1,
      width: 80,
    },
    {
      title: "ชื่อผู้ใช้งาน",
      dataIndex: "email",
      align: "left" as const,
      sorter: (a: UserProfile, b: UserProfile) =>
        a.email.localeCompare(b.email),
      render: (_: string, record: UserProfile) => (
        <Typography.Text>
          {record.email} ({record.admin_id})
        </Typography.Text>
      ),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="ค้นหา username หรือ user_id"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
            autoFocus
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              ค้นหา
            </Button>
            <Button
              onClick={() => {
                clearFilters && clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              รีเซ็ต
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value: any, record: UserProfile) => {
        const email = (record.email ?? "").toString().toLowerCase();
        const adminId = (record.admin_id ?? "").toString().toLowerCase();
        return (
          email.includes(value.toLowerCase()) ||
          adminId.includes(value.toLowerCase())
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "fullname",
      align: "left" as const,
      render: (_: string, record: UserProfile) => (
        <Typography.Text>
          {record?.firstname} {record?.lastname}
        </Typography.Text>
      ),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="ค้นหา ชื่อ-นามสกุล"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
            autoFocus
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              ค้นหา
            </Button>
            <Button
              onClick={() => {
                clearFilters && clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              รีเซ็ต
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value: any, record: UserProfile) => {
        const fullName = `${record.firstname ?? ""} ${
          record.lastname ?? ""
        }`.toLowerCase();
        return fullName.includes(value.toLowerCase());
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "ชื่อเล่น",
      dataIndex: "description",
      align: "left" as const,
      render: (_: string, record: any) => (
        <Typography.Text>{record?.nickname ?? "-"}</Typography.Text>
      ),
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      align: "left" as const,
      sorter: (a: UserProfile, b: UserProfile) =>
        (a?.position ?? "").localeCompare(b?.position ?? ""),
      render: (_: string, record: any) => (
        <Typography.Text>{record?.position ?? "-"}</Typography.Text>
      ),
    },
    {
      title: "เบอร์มือถือ",
      dataIndex: "tel",
      align: "left" as const,
      sorter: (a: UserProfile, b: UserProfile) =>
        (a?.tel ?? "").localeCompare(b?.tel ?? ""),
      render: (_: string, record: any) => (
        <Typography.Text>{record?.tel ?? "-"}</Typography.Text>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: UserProfile) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditUserModal(record)}
            aria-label="Edit User"
            type="primary"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => openDeleteUserModal(record.id)}
            aria-label="Delete User"
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyUserInformation(record)}
            aria-label="View User"
          />
        </Space>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <div className="w-full space-y-4">
          {/* ปุ่มเพิ่มโครงการใหม่ */}
          <div className="w-full flex justify-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={openCreateUserModal}
              style={{ minWidth: 160 }}
            >
              เพิ่มผู้ใช้งาน
            </Button>
          </div>

          {/* Card รายการผู้ใช้งาน */}
          <Card title="รายการผู้ใช้งาน" className="w-full">
            {/* ตารางผู้ใช้งาน */}
            {tableLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Table
                columns={columns}
                dataSource={users}
                rowKey={(record) => `user-${record.admin_id}`} // ถ้ามี id ทุก record
                pagination={{
                  pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "30", "50"],
                  onShowSizeChange: (_current, size) => setPageSize(size),
                }}
                locale={{
                  emptyText: "ไม่พบข้อมูลผู้ใช้งาน",
                }}
              />
            )}
          </Card>

          {/* Modal สร้างผู้ใช้งาน */}
          <Modal
            open={modalType === "create"}
            onCancel={() => setModalType("")}
            title="เพิ่มผู้ใช้งานใหม่"
            footer={null}
            destroyOnHidden
          >
            {/* ฟอร์มผู้ใช้งาน */}
            <Form
              form={antdForm}
              layout="vertical"
              initialValues={{
                username: "",
                password: "",
                name: "",
                lastname: "",
              }}
              onFinish={handleUserSubmit}
            >
              <Form.Item
                label="ชื่อผู้ใช้งาน (Username)"
                name="username"
                rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้งาน" }]}
              >
                <Input
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  prefix={<InfoCircleOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="รหัสผ่าน"
                name="password"
                rules={[
                  { required: true, message: "กรุณากำหนดรหัสผ่าน" },
                  {
                    min: 6,
                    message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
                  },
                ]}
              >
                <Input.Password
                  placeholder="กรอกรหัสผ่าน"
                  prefix={<LockOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="ชื่อ"
                name="name"
                rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
              >
                <Input
                  placeholder="กรอกชื่อ"
                  prefix={<EditOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="นามสกุล"
                name="lastname"
                rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
              >
                <Input
                  placeholder="กรอกนามสกุล"
                  prefix={<EditOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastname: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button onClick={() => setModalType("")}>ยกเลิก</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                  >
                    บันทึก
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal ยืนยันลบผู้ใช้งาน */}
          <Modal
            open={modalType === "delete"}
            onCancel={() => setModalType("")}
            title="ยืนยันการลบ"
            onOk={confirmDeleteUser}
            okText="ลบ"
            okType="danger"
            cancelText="ยกเลิก"
            okButtonProps={{
              disabled: formState.confirmText !== "Delete",
            }}
            destroyOnHidden
          >
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="danger" strong>
                คุณต้องการยืนยันที่จะลบผู้ใช้งานนี้จริงหรือไม่
              </Typography.Text>
              <br />
              <Typography.Text>
                โปรดพิมพ์ <b style={{ color: "#f5222d" }}>Delete</b> เพื่อยืนยัน
              </Typography.Text>
              <Input
                style={{ marginTop: 10 }}
                placeholder="พิมพ์ Delete เพื่อยืนยัน"
                value={formState.confirmText}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    confirmText: e.target.value,
                  }))
                }
              />
            </div>
          </Modal>

          {/* Modal แก้ไขผู้ใช้งาน */}
          <Modal
            open={modalType === "edit"}
            onCancel={() => setModalType("")}
            title="แก้ไขข้อมูลผู้ใช้งาน"
            footer={null}
            destroyOnHidden
          >
            <Form
              layout="vertical"
              initialValues={{
                admin_id: formState.admin_id ?? "",
                employee_code: formState.employee_code ?? "",
                firstname: formState.firstname ?? "",
                lastname: formState.lastname ?? "",
                nickname: formState.nickname ?? "",
                position: formState.position ?? "",
                email: formState.email ?? "",
                backlog_email: formState.backlog_email ?? "",
                tel: formState.tel ?? "",
              }}
              onFinish={handleUpdateUser}
            >
              <Form.Item name="admin_id" hidden>
                <Input type="hidden" />
              </Form.Item>

              <Form.Item
                label="ชื่อ"
                name="firstname"
                rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
              >
                <Input
                  placeholder="กรอกชื่อ"
                  prefix={<UserOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="นามสกุล"
                name="lastname"
                rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
              >
                <Input
                  placeholder="กรอกนามสกุล"
                  prefix={<UserOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastname: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="ชื่อเล่น" name="nickname">
                <Input
                  placeholder="กรอกชื่อเล่น"
                  prefix={<SmileOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="รหัสพนักงาน" name="employee_code">
                <Input
                  placeholder="กรอกรหัสพนักงาน"
                  prefix={<IdcardOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      employee_code: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="ตำแหน่ง" name="position">
                <Select
                  placeholder="เลือกตำแหน่ง"
                  value={formState.position}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      position: value,
                    }))
                  }
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {positions.map((pos) => (
                    <Select.Option key={pos} value={pos}>
                      {pos}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="อีเมล"
                name="email"
                rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}
              >
                <Input
                  placeholder="กรอกอีเมล"
                  prefix={<MailOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="Backlog Email"
                name="backlog_email"
                rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}
              >
                <Input
                  placeholder="กรอก Backlog Email"
                  prefix={<MailOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      backlog_email: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="เบอร์โทรศัพท์" name="tel">
                <Input
                  placeholder="กรอกเบอร์โทรศัพท์"
                  prefix={<PhoneOutlined />}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      tel: e.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button onClick={() => setModalType("")}>ยกเลิก</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                  >
                    บันทึก
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
