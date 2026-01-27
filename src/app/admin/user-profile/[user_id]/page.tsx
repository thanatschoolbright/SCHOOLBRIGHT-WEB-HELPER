"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
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
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import dayjs from "dayjs";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";

const { Title, Text } = Typography;

const UserEditPage = () => {
  const router = useRouter();
  const { token } = theme.useToken();
  const { user_id } = useParams();
  const userId = Array.isArray(user_id) ? user_id[0] : user_id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Debug Helper: Show Modal for Errors
  const showErrorModal = (error: any, context: string) => {
    const errorData = error?.response?.data;
    const errorMessage =
      errorData?.message_th ||
      errorData?.message_en ||
      error?.message ||
      "Internal Server Error";
    const errorDetail = errorData?.error
      ? JSON.stringify(errorData.error, null, 2)
      : error?.stack;

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
                Technical Stack Trace / details:
              </Text>
              <div
                style={{
                  backgroundColor: "#1e1e1e",
                  color: "#d4d4d4",
                  padding: 16,
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 11,
                  overflowX: "auto",
                  maxHeight: 300,
                  border: "1px solid #333",
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
      const [userRes, rolesRes, positionsRes] = await Promise.all([
        axios.get(`/api/v2/admin/user-management/detail/${userId}`),
        axios.get("/api/v2/admin/user-management/constants"),
        axios.get("/api/v2/admin/position-management/read?limit=1000"),
      ]);

      const user = userRes.data.data;
      setUserData(user);
      setRoles(rolesRes.data.data.roles);
      setPositions(positionsRes.data.data.items);

      form.setFieldsValue({
        ...user,
        role_id: user.role_id,
        position_id: user.position_id,
      });
    } catch (error: any) {
      showErrorModal(error, "ดึงข้อมูลผู้ใช้งาน");
      console.error("fetchInitialData error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      await axios.post("/api/v2/admin/user-management/update", {
        id: Number(user_id),
        ...values,
      });
      toast.success("อัปเดตข้อมูลสำเร็จ");
      router.push("/admin/user-profile");
    } catch (error: any) {
      showErrorModal(error, "อัปเดตข้อมูลผู้ใช้งาน");
      console.error("onFinish error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      </div>
    );
  }

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
                  bordered={false}
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
                    <Avatar
                      size={120}
                      icon={<UserOutlined />}
                      src={userData?.profile_image_path}
                      style={{
                        backgroundColor: token.colorPrimaryBg,
                        color: token.colorPrimary,
                        border: `4px solid white`,
                        boxShadow: token.boxShadow,
                      }}
                    />
                    <div style={{ position: "absolute", bottom: 4, right: 4 }}>
                      <Badge
                        count={
                          <div
                            style={{
                              backgroundColor: "white",
                              padding: 4,
                              borderRadius: "50%",
                              boxShadow: token.boxShadow,
                            }}
                          >
                            {userData?.status === "ACTIVE" ? (
                              <CheckCircleOutlined
                                style={{
                                  color: token.colorSuccess,
                                  fontSize: 18,
                                }}
                              />
                            ) : (
                              <ExclamationCircleOutlined
                                style={{
                                  color: token.colorTextDisabled,
                                  fontSize: 18,
                                }}
                              />
                            )}
                          </div>
                        }
                      />
                    </div>
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

                  <Space size={8} wrap justify="center">
                    <Tag color="blue">
                      {userData?.role?.role_name || "ไม่มีสิทธิ์"}
                    </Tag>
                    <Tag color="cyan">
                      {userData?.position_ref?.name_th || "ไม่มีตำแหน่ง"}
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
              <Card
                bordered={false}
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
                  <div style={{ marginBottom: 32 }}>
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
                  <div style={{ marginBottom: 32 }}>
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

                  {/* Role & Position */}
                  <div>
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
                        <Form.Item label="แผนก (Department)" name="department">
                          <Input
                            prefix={
                              <TeamOutlined
                                style={{ color: token.colorTextDisabled }}
                              />
                            }
                            placeholder="แผนก"
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
