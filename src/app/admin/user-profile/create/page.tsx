"use client";

import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EditOutlined,
  IdcardOutlined,
  LinkOutlined,
  LoadingOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SmileOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Result,
  Row,
  Select,
  Space,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";

const { Title, Text } = Typography;

export default function CreateUserPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  // Auth State
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  // Local State
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success">("idle");
  const [uploading, setUploading] = useState(false);

  // Watch fields
  const employeeCode = Form.useWatch("employee_code", form);
  const currentImage = Form.useWatch("profile_image_path", form);
  const phone = Form.useWatch("tel", form);

  // Load constants
  useEffect(() => {
    const fetchConstants = async () => {
      try {
        const [posRes, deptRes, constRes] = await Promise.all([
          axios.get("/api/v2/admin/position-management/read?limit=1000"),
          axios.get("/api/v2/admin/department-management/read?limit=1000"),
          axios.get("/api/v2/admin/user-management/constants"),
        ]);
        setPositions(posRes?.data?.data?.items || []);
        setDepartments(deptRes?.data?.data?.items || []);
        setRoles(constRes?.data?.data?.roles || []);
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลพื้นฐานได้");
      }
    };
    fetchConstants();
  }, []);

  // Sync password with phone
  useEffect(() => {
    if (phone && !form.getFieldValue("password")) {
      form.setFieldValue("password", phone);
    }
  }, [phone, form]);

  const requestUploadProfileImage = async ({
    file,
    onSuccess,
    onError,
  }: any) => {
    if (!employeeCode) {
      toast.error("กรุณาระบุรหัสพนักงานก่อนอัปโหลดรูปภาพ");
      onError(new Error("Missing employee code"));
      return;
    }

    setUploading(true);
    try {
      const result =
        await HuaweiBucketStorageService.requestUploadUserProfileImage(
          file,
          employeeCode,
          currentImage,
        );
      if (result?.url) {
        form.setFieldValue("profile_image_path", result.url);
        toast.success("อัปโหลดรูปภาพสำเร็จ");
        onSuccess(result.url);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        firstname_th: values.name,
        lastname_th: values.lastname,
        phone: values.tel,
        profile_image: values.profile_image_path,
        admin_id: Number(values.admin_id),
        created_by: adminId,
        birth_date: values.birth_date
          ? values.birth_date.format("YYYY-MM-DD")
          : null,
        joined_date: values.joined_date
          ? values.joined_date.format("YYYY-MM-DD")
          : null,
        employment_type: values.employment_type || "FULL_TIME",
      };

      const res = await axios.post(
        "/api/v2/admin/user-management/create",
        payload,
      );

      if (res.status === 200 || res.status === 201) {
        setSubmitStatus("success");
        toast.success("สร้างผู้ใช้งานสำเร็จ");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message_th || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <PermissionLayout role={["ADMIN"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Result
              status="success"
              title="เพิ่มพนักงานใหม่สำเร็จ"
              subTitle="ข้อมูลพนักงานถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว"
              extra={[
                <Button
                  type="primary"
                  key="list"
                  onClick={() => router.push("/admin/user-profile")}
                >
                  กลับไปยังหน้ารายการ
                </Button>,
                <Button
                  key="again"
                  onClick={() => {
                    setSubmitStatus("idle");
                    form.resetFields();
                  }}
                >
                  เพิ่มพนักงานเพิ่ม
                </Button>,
              ]}
            />
          </div>
        </DashboardLayout>
      </PermissionLayout>
    );
  }

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<PlusOutlined />}
          title="เพิ่มพนักงานใหม่"
          subTitle="ระบุรายละเอียดเพื่อสร้างบัญชีผู้ใช้งานใหม่"
          extra={
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/admin/user-profile")}
            >
              ย้อนกลับ
            </Button>
          }
        />

        <div className="max-w-5xl mx-auto py-8 px-4">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={[24, 24]}>
              {/* Left Column: Avatar & Basic Info */}
              <Col xs={24} lg={8}>
                <Card
                  className="text-center"
                  bordered={false}
                  style={{ borderRadius: 16 }}
                >
                  <Title level={5}>รูปโปรไฟล์</Title>
                  <Form.Item name="profile_image_path" noStyle>
                    <Input type="hidden" />
                  </Form.Item>
                  <Upload
                    listType="picture-circle"
                    showUploadList={false}
                    customRequest={requestUploadProfileImage}
                  >
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                        <div className="mt-2 text-xs">อัปโหลดรูป</div>
                      </div>
                    )}
                  </Upload>
                  <div className="mt-4">
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      ระบุรหัสพนักงานก่อนอัปโหลด
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Right Column: Account & Profile Details */}
              <Col xs={24} lg={16}>
                <Space direction="vertical" size="large" className="w-full">
                  {/* Account Section */}
                  <Card
                    title="ข้อมูลบัญชีเข้าใช้งาน"
                    bordered={false}
                    style={{ borderRadius: 16 }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="username"
                          label={
                            <span>
                              Username&nbsp;
                              <Tooltip title="ชื่อที่ใช้สำหรับเข้าสู่ระบบ">
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                          rules={[
                            { required: true, message: "กรุณาระบุ Username" },
                          ]}
                        >
                          <Input
                            prefix={<UserOutlined />}
                            placeholder="Username"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="password"
                          label={
                            <span>
                              Password&nbsp;
                              <Tooltip title="หากไม่ระบุ ระบบจะใช้เบอร์โทรศัพท์เป็นรหัสผ่านเริ่มต้น">
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                          rules={[
                            { required: true, message: "กรุณาระบุ Password" },
                          ]}
                        >
                          <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          name="admin_id"
                          label={
                            <span>
                              Admin ID (External Link)&nbsp;
                              <Tooltip title="รหัสเชื่อมต่อข้อมูลกับระบบหลักเพื่อซิงค์ข้อมูลสิทธิ์การใช้งาน">
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                          rules={[
                            {
                              required: true,
                              message: "กรุณาระบุรหัสเชื่อมต่อ",
                            },
                          ]}
                        >
                          <Input
                            prefix={<LinkOutlined />}
                            placeholder="รหัสเชื่อมต่อระบบหลัก"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  {/* Personal Section */}
                  <Card
                    title="ข้อมูลส่วนตัว"
                    bordered={false}
                    style={{ borderRadius: 16 }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="name"
                          label="ชื่อจริง"
                          rules={[
                            { required: true, message: "กรุณาระบุชื่อจริง" },
                          ]}
                        >
                          <Input prefix={<EditOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="lastname"
                          label="นามสกุล"
                          rules={[
                            { required: true, message: "กรุณาระบุนามสกุล" },
                          ]}
                        >
                          <Input prefix={<EditOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="nickname" label="ชื่อเล่น">
                          <Input prefix={<SmileOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="employee_code"
                          label={
                            <span>
                              รหัสพนักงาน&nbsp;
                              <Tooltip title="ระบุรหัสพนักงานเพื่อใช้ในการอ้างอิงและอัปโหลดรูปภาพ">
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                          rules={[
                            { required: true, message: "กรุณาระบุรหัสพนักงาน" },
                          ]}
                        >
                          <Input prefix={<IdcardOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  {/* Work Section */}
                  <Card
                    title="ข้อมูลการทำงานและติดต่อ"
                    bordered={false}
                    style={{ borderRadius: 16 }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item name="position_id" label="ตำแหน่ง">
                          <Select
                            options={positions.map((p) => ({
                              label: p.name_th,
                              value: p.id,
                            }))}
                            showSearch
                            placeholder="เลือกตำแหน่ง"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="department_id" label="แผนก">
                          <Select
                            options={departments.map((d) => ({
                              label: d.name_th,
                              value: d.id,
                            }))}
                            showSearch
                            placeholder="เลือกแผนก"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="role_id"
                          label={
                            <span>
                              สิทธิ์ผู้ใช้งาน&nbsp;
                              <Tooltip title="กำหนดระดับการเข้าถึงข้อมูลและฟังก์ชันต่างๆ ในระบบ">
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                        >
                          <Select
                            options={roles.map((r) => ({
                              label: r.role_name,
                              value: r.id,
                            }))}
                            placeholder="เลือกสิทธิ์"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="employment_type" label="ประเภทการจ้าง">
                          <Select placeholder="เลือกประเภท">
                            <Select.Option value="FULL_TIME">
                              พนักงานประจำ
                            </Select.Option>
                            <Select.Option value="PART_TIME">
                              พนักงานชั่วคราว
                            </Select.Option>
                            <Select.Option value="CONTRACT">
                              สัญญาจ้าง
                            </Select.Option>
                            <Select.Option value="INTERN">ฝึกงาน</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="tel" label="เบอร์โทรศัพท์">
                          <Input
                            prefix={<PhoneOutlined />}
                            placeholder="08xxxxxxxx"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="birth_date" label="วันเกิด">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="เลือกวันเกิด"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={24}>
                        <Form.Item
                          name="email"
                          label="อีเมล"
                          rules={[{ type: "email" }]}
                        >
                          <Input prefix={<MailOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name="joined_date" label="วันที่เริ่มงาน">
                          <DatePicker className="w-full" format="DD/MM/YYYY" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <Space size="middle">
                      <Button
                        size="large"
                        onClick={() => router.push("/admin/user-profile")}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        loading={loading}
                        htmlType="submit"
                      >
                        บันทึกพนักงานใหม่
                      </Button>
                    </Space>
                  </div>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
