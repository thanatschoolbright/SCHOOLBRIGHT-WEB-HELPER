"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Flex,
  Select,
  Typography,
  Divider,
  Avatar,
  Space,
  Badge,
  Skeleton,
  Tag,
  Alert,
  Modal,
  theme,
  DatePicker,
  Steps,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  SolutionOutlined,
  HistoryOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import { Upload, message } from "antd";
import type { UploadProps } from "antd";
import {
  LoadingOutlined,
  CameraOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";

const { Title, Text } = Typography;

const UserEditPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user_id } = useParams();
  const userId = Array.isArray(user_id) ? user_id[0] : user_id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Watch fields for upload
  const employeeCode = Form.useWatch("employee_code", form);
  const currentImage = Form.useWatch("profile_image_path", form);

  // Debug Helper: Show Modal for Errors
  const showErrorModal = (error: any, context: string) => {
    const errorData = error?.response?.data;
    const errorMessage =
      errorData?.message_th ||
      errorData?.message_en ||
      error?.message ||
      "Internal Server Error";

    // Extract detailed error information (validation errors or stack trace)
    let errorDetail = "";
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      errorDetail = errorData.errors
        .map((err: any) => `- ${err.path?.join(".")}: ${err.message}`)
        .join("\n");
    } else if (errorData?.error) {
      errorDetail =
        typeof errorData.error === "object"
          ? JSON.stringify(errorData.error, null, 2)
          : errorData.error;
    } else {
      errorDetail = error?.stack || "";
    }

    Modal.error({
      title: (
        <Space>
          <ExclamationCircleOutlined style={{ color: token.colorError }} />
          <span style={{ fontWeight: 600, color: token.colorError }}>
            เกิดข้อผิดพลาดในการ{context}
          </span>
        </Space>
      ),
      width: 700,
      content: (
        <div className="space-y-4">
          <div>
            <Text
              strong
              style={{
                color: token.colorTextSecondary,
                display: "block",
                marginBottom: 4,
              }}
            >
              สาเหตุ (Reason):
            </Text>
            <Alert
              message={errorMessage}
              description={
                error?.config?.url ? `URL: ${error.config.url}` : undefined
              }
              type="error"
              showIcon
            />
          </div>
          {errorDetail && (
            <div>
              <Text
                strong
                style={{
                  color: token.colorTextSecondary,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                รายละเอียดข้อผิดพลาด (Details):
              </Text>
              <div
                style={{
                  backgroundColor: token.colorErrorBg,
                  color: token.colorErrorText,
                  padding: 16,
                  borderRadius: 12,
                  fontFamily: "monospace",
                  fontSize: 12,
                  overflowX: "auto",
                  maxHeight: 300,
                  border: `1px solid ${token.colorErrorBorder}`,
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {errorDetail}
                </pre>
              </div>
            </div>
          )}
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              *กรุณาตรวจสอบ Console (F12) หรือแจ้งทีมพัฒนา พร้อมรูปถ่ายหน้าจอนี้
            </Text>
          </div>
        </div>
      ),
      okText: "เข้าใจแล้ว",
      className: "rounded-2xl",
    });
  };

  useEffect(() => {
    if (userId) fetchInitialData();
  }, [userId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [userRes, rolesRes, positionsRes, departmentsRes] =
        await Promise.all([
          axios.get(`/api/v2/admin/user-management/detail/${userId}`),
          axios.get("/api/v2/admin/user-management/constants"),
          axios.get("/api/v2/admin/position-management/read?limit=1000"),
          axios.get("/api/v2/admin/department-management/read?limit=1000"),
        ]);

      const user = userRes?.data?.data;
      setUserData(user);
      setRoles(rolesRes?.data?.data?.roles || []);
      setPositions(positionsRes?.data?.data?.items || []);
      setDepartments(departmentsRes?.data?.data?.items || []);

      form.setFieldsValue({
        ...user,
        role_id: user.role_id,
        position_id: user.position_id,
        department_id: user.department_id,
        profile_image: user.profile_image_path,
        joined_date: user.joined_date ? dayjs(user.joined_date) : null,
        resigned_date: user.resigned_date ? dayjs(user.resigned_date) : null,
        employment_type: user.employment_type || "FULL_TIME",
      });
    } catch (error: any) {
      showErrorModal(error, "ดึงข้อมูลผู้ใช้งาน");
      console.error("fetchInitialData error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Upload Logic ---
  const customUploadRequest = async ({ file, onSuccess, onError }: any) => {
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

      if (result.status === 200 || result.url) {
        const newImageUrl = result.url || result.data?.url;
        form.setFieldValue("profile_image", newImageUrl);
        setUserData((prev: any) => ({
          ...prev,
          profile_image_path: newImageUrl,
        }));
        toast.success("อัปโหลดรูปภาพสำเร็จ");
        onSuccess("ok");
      } else {
        throw new Error(result.message_en || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      showErrorModal(error, "อัปโหลดรูปภาพ");
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      // Sanitize payload to avoid validation errors (null vs undefined)
      const payload = {
        ...values,
        id: Number(userId),
        joined_date: values.joined_date
          ? dayjs(values.joined_date).format("YYYY-MM-DD")
          : null,
        resigned_date: values.resigned_date
          ? dayjs(values.resigned_date).format("YYYY-MM-DD")
          : null,
        // Ensure these are numbers or undefined (not null) if that's what backend expects
        position_id: values.position_id || undefined,
        department_id: values.department_id || undefined,
        profile_image: values.profile_image || undefined,
      };

      await axios.post("/api/v2/admin/user-management/update", payload);

      toast.success("อัปเดตข้อมูลสำเร็จ");
      router.push("/admin/user-profile");
    } catch (error: any) {
      showErrorModal(error, "อัปเดตข้อมูลผู้ใช้งาน");
      console.error("onFinish error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<UserOutlined />}
          title="แก้ไขข้อมูลผู้ใช้งาน"
          subTitle="ปรับเปลี่ยนรายละเอียดข้อมูลของสมาชิกในระบบ"
          extra={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/admin/user-profile")}
              >
                ย้อนกลับ
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={() => form.submit()}
              >
                บันทึกการแก้ไข
              </Button>
            </Space>
          }
        />

        <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
          <Row gutter={[24, 24]}>
            {/* Left Column: User Card */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <Card
                  variant="borderless"
                  styles={{
                    body: { textAlign: "center", padding: "40px 24px" },
                  }}
                  style={{ borderRadius: 16 }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                      marginBottom: 24,
                    }}
                  >
                    <div className="relative group cursor-pointer">
                      <Upload
                        name="avatar"
                        listType="picture-circle"
                        className="avatar-uploader"
                        showUploadList={false}
                        customRequest={customUploadRequest}
                        disabled={uploading}
                      >
                        <div style={{ position: "relative" }}>
                          <Avatar
                            size={120}
                            icon={
                              uploading ? <LoadingOutlined /> : <UserOutlined />
                            }
                            src={userData?.profile_image_path}
                            style={{
                              backgroundColor: token.colorPrimaryBg,
                              color: token.colorPrimary,
                              border: `4px solid white`,
                              boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
                              opacity: uploading ? 0.6 : 1,
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            className="hover:scale-105"
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(0,0,0,0.5)",
                              borderRadius: "50%",
                              opacity: userData?.profile_image_path ? 0 : 1, // แสดงคำสั่งถ้ายังไม่มีรูป
                              transition: "opacity 0.3s",
                            }}
                            className={
                              userData?.profile_image_path
                                ? "group-hover:opacity-100"
                                : ""
                            }
                          >
                            <CameraOutlined
                              style={{
                                color: "white",
                                fontSize: 24,
                                marginBottom: 4,
                              }}
                            />
                            {!userData?.profile_image_path && (
                              <Text
                                style={{
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                อัปโหลดรูปภาพที่นี่
                              </Text>
                            )}
                          </div>
                        </div>
                      </Upload>
                    </div>
                    {/* ✅ แสดงสัญลักษณ์ "ถูก" เมื่ออัปโหลดรูปแล้วเท่านั้น */}
                    {userData?.profile_image_path && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 4,
                          right: 12,
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: token.colorSuccess,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid white",
                            boxShadow: token.boxShadow,
                            zIndex: 2,
                          }}
                        >
                          <CheckCircleOutlined
                            style={{ color: "white", fontSize: 14 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Title level={3} style={{ marginBottom: 4 }}>
                    {userData?.firstname_th} {userData?.lastname_th}
                  </Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 16 }}
                  >
                    {userData?.email || "ไม่มีอีเมล"}
                  </Text>

                  <Space size={8} wrap>
                    <Tag color="blue">
                      {userData?.role?.role_name || "ไม่มีสิทธิ์"}
                    </Tag>
                    <Tag color="cyan">
                      {userData?.position_ref?.name_th || "ไม่มีตำแหน่ง"}
                    </Tag>
                    <Tag color="purple">
                      {userData?.department?.name_th || "ไม่มีแผนก"}
                    </Tag>
                  </Space>

                  <Divider />

                  <div style={{ textAlign: "left" }}>
                    <Space
                      direction="vertical"
                      size={16}
                      style={{ width: "100%" }}
                    >
                      <Space align="start" size={12}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: token.colorPrimaryBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <LinkOutlined style={{ color: token.colorPrimary }} />
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: "block" }}
                          >
                            รหัสเชื่อมต่อ (adminsystem.schoolbright.co)
                          </Text>
                          <Text strong style={{ color: token.colorPrimary }}>
                            {userData?.admin_id || "-"}
                          </Text>
                        </div>
                      </Space>

                      <Space align="start" size={12}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: token.colorFillAlter,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <HistoryOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: "block" }}
                          >
                            ข้อมูลล่าสุดเมื่อ
                          </Text>
                          <Text strong>
                            {userData?.updated_at
                              ? dayjs(userData.updated_at).format(
                                  "DD MMM YYYY HH:mm",
                                )
                              : "-"}
                          </Text>
                        </div>
                      </Space>

                      <Space align="start" size={12}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: token.colorFillAlter,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IdcardOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: "block" }}
                          >
                            วันที่เข้าสู่ระบบ
                          </Text>
                          <Text strong>
                            {dayjs(userData?.created_at).format("DD MMM YYYY")}
                          </Text>
                        </div>
                      </Space>

                      <Space align="start" size={12}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: token.colorFillAlter,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CalendarOutlined
                            style={{ color: token.colorHighlight }}
                          />
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: "block" }}
                          >
                            วันที่เริ่มงาน (Joined)
                          </Text>
                          <Text strong>
                            {userData?.joined_date
                              ? dayjs(userData.joined_date).format(
                                  "DD MMM YYYY",
                                )
                              : "ไม่ได้ระบุ"}
                          </Text>
                        </div>
                      </Space>
                    </Space>
                  </div>
                </Card>

                <Alert
                  message="คำแนะนำ"
                  description="การแก้ไขข้อมูลระดับสิทธิ์ของพนักงาน จะมีผลเมื่อพนักงานทำการเข้าสู่ระบบใหม่ในครั้งถัดไป"
                  type="info"
                  showIcon
                  style={{ borderRadius: 12 }}
                />
              </Space>
            </Col>

            {/* Right Column: Edit Form */}
            <Col xs={24} lg={16}>
              {/* --- Navigator --- */}
              <div
                className="mb-8 p-4 rounded-2xl sticky top-[80px] z-10 transition-all"
                style={{
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: token.boxShadowTertiary,
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <Typography.Text
                    strong
                    className="text-[11px] uppercase tracking-[0.15em]"
                    style={{ color: token.colorPrimary }}
                  >
                    <SearchOutlined className="mr-2" /> Quick Navigation
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    className="text-[10px] opacity-70"
                  >
                    คลิกเพื่อวาร์ปไปยังส่วนต่างๆ
                  </Typography.Text>
                </div>
                <Steps
                  size="small"
                  className="px-2"
                  current={-1}
                  items={[
                    { title: "ข้อมูลส่วนตัว", icon: <UserOutlined /> },
                    { title: "บัญชี/ติดต่อ", icon: <MailOutlined /> },
                    { title: "การจ้างงาน", icon: <HistoryOutlined /> },
                    {
                      title: "หน้าที่/สิทธิ์",
                      icon: <SafetyCertificateOutlined />,
                    },
                  ]}
                  onChange={(current) => {
                    const sections = [
                      "personal",
                      "account",
                      "employment",
                      "responsibility",
                    ];
                    const element = document.getElementById(
                      `section-${sections[current]}`,
                    );
                    if (element) {
                      const yOffset = -200; // Offset for sticky header
                      const y =
                        element.getBoundingClientRect().top +
                        window.pageYOffset +
                        yOffset;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                />
              </div>

              <Card
                variant="borderless"
                style={{ borderRadius: 16 }}
                title={
                  <Space>
                    <SolutionOutlined style={{ color: token.colorPrimary }} />
                    <span>ข้อมูลผู้ใช้งานโดยละเอียด</span>
                  </Space>
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark="optional"
                >
                  {/* Personal Information */}
                  <div id="section-personal" style={{ marginBottom: 32 }}>
                    <Space size={8} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          width: 4,
                          height: 20,
                          backgroundColor: token.colorPrimary,
                          borderRadius: 2,
                        }}
                      />
                      <Title level={5} style={{ margin: 0 }}>
                        ข้อมูลส่วนตัว
                      </Title>
                    </Space>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="ชื่อ (ไทย)"
                          name="firstname_th"
                          rules={[{ required: true, message: "กรุณาระบุชื่อ" }]}
                        >
                          <Input placeholder="ชื่อ" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="นามสกุล (ไทย)"
                          name="lastname_th"
                          rules={[
                            { required: true, message: "กรุณาระบุนามสกุล" },
                          ]}
                        >
                          <Input placeholder="นามสกุล" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="ชื่อ (อังกฤษ)" name="firstname_en">
                          <Input placeholder="First Name" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="นามสกุล (อังกฤษ)" name="lastname_en">
                          <Input placeholder="Last Name" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="ชื่อเล่น" name="nickname">
                          <Input placeholder="ชื่อเล่น" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* Account & Contact */}
                  <div id="section-account" style={{ marginBottom: 32 }}>
                    <Space size={8} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          width: 4,
                          height: 20,
                          backgroundColor: token.colorPrimary,
                          borderRadius: 2,
                        }}
                      />
                      <Title level={5} style={{ margin: 0 }}>
                        ข้อมูลบัญชีผู้ใช้และติดต่อ
                      </Title>
                    </Space>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="ชื่อผู้ใช้งาน (Username)"
                          name="username"
                          rules={[
                            {
                              required: true,
                              message: "กรุณาระบุชื่อผู้ใช้งาน",
                            },
                          ]}
                        >
                          <Input
                            prefix={
                              <UserOutlined
                                style={{ color: token.colorTextDisabled }}
                              />
                            }
                            placeholder="username"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="รหัสพนักงาน" name="employee_code">
                          <Input
                            prefix={
                              <IdcardOutlined
                                style={{ color: token.colorTextDisabled }}
                              />
                            }
                            placeholder="รหัสพนักงาน"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="อีเมล"
                          name="email"
                          rules={[
                            { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                          ]}
                        >
                          <Input
                            prefix={
                              <MailOutlined
                                style={{ color: token.colorTextDisabled }}
                              />
                            }
                            placeholder="email@example.com"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="เบอร์โทรศัพท์" name="phone">
                          <Input
                            prefix={
                              <PhoneOutlined
                                style={{ color: token.colorTextDisabled }}
                              />
                            }
                            placeholder="08X-XXX-XXXX"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* Employment Timeline */}
                  <div id="section-employment" style={{ marginBottom: 32 }}>
                    <Space size={8} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          width: 4,
                          height: 20,
                          backgroundColor: token.colorWarning,
                          borderRadius: 2,
                        }}
                      />
                      <Title level={5} style={{ margin: 0 }}>
                        ข้อมูลการจ้างงาน (Employment Timeline)
                      </Title>
                    </Space>
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item label="วันที่เริ่มงาน" name="joined_date">
                          <DatePicker
                            placeholder="เลือกวันที่เริ่มงาน"
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="วันที่ลาออก" name="resigned_date">
                          <DatePicker
                            placeholder="เลือกวันที่ลาออก"
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="ประเภทการจ้างงาน"
                          name="employment_type"
                        >
                          <Select placeholder="เลือกประเภทการจ้างงาน">
                            <Select.Option value="FULL_TIME">
                              Full-time (พนักงานประจำ)
                            </Select.Option>
                            <Select.Option value="PART_TIME">
                              Part-time (พนักงานชั่วคราว)
                            </Select.Option>
                            <Select.Option value="CONTRACT">
                              Contract (สัญญาจ้าง)
                            </Select.Option>
                            <Select.Option value="INTERN">
                              Intern (ฝึกงาน)
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* Role & Position */}
                  <div id="section-responsibility">
                    <Space size={8} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          width: 4,
                          height: 20,
                          backgroundColor: token.colorPrimary,
                          borderRadius: 2,
                        }}
                      />
                      <Title level={5} style={{ margin: 0 }}>
                        หน้าที่และความรับผิดชอบ
                      </Title>
                    </Space>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="สิทธิ์การใช้งาน (Role)"
                          name="role_id"
                        >
                          <Select
                            placeholder="เลือกสิทธิ์การใช้งาน"
                            options={roles.map((r) => ({
                              label: r.role_name,
                              value: r.id,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="ตำแหน่ง (Position)"
                          name="position_id"
                        >
                          <Select
                            placeholder="เลือกตำแหน่ง"
                            showSearch
                            optionFilterProp="label"
                            options={positions.map((p) => ({
                              label: p.name_th,
                              value: p.id,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="แผนก (Department)"
                          name="department_id"
                        >
                          <Select
                            placeholder="เลือกแผนก"
                            showSearch
                            optionFilterProp="label"
                            options={departments.map((d) => ({
                              label: d.name_th,
                              value: d.id,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="สถานะการใช้งาน" name="status">
                          <Select>
                            <Select.Option value="ACTIVE">
                              <Tag
                                color="success"
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  margin: 0,
                                }}
                              >
                                ใช้งานปกติ
                              </Tag>
                            </Select.Option>
                            <Select.Option value="INACTIVE">
                              <Tag
                                color="default"
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  margin: 0,
                                }}
                              >
                                ปิดการใช้งาน
                              </Tag>
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="profile_image" hidden>
                      <Input />
                    </Form.Item>
                  </div>

                  <Divider />

                  <Space
                    style={{ width: "100%", justifyContent: "flex-end" }}
                    size={12}
                  >
                    <Button onClick={() => router.push("/admin/user-profile")}>
                      ยกเลิก
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                    >
                      ยืนยันการบันทึกข้อมูล
                    </Button>
                  </Space>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
};

export default UserEditPage;
