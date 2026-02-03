"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  IdcardOutlined,
  LinkOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
("use client");

import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import { CameraOutlined, LoadingOutlined } from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import type { UploadProps } from "antd";
import { Descriptions } from "antd";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

dayjs.extend(buddhistEra);

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";

const { Title, Text } = Typography;

const UserEditPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus, update } = useSession();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const { user_id } = useParams();

  // 🛡️ เช็คสิทธิ์และตัวตน
  const sessionUser = session?.user as any;
  const isAdmin =
    sessionUser?.role === "ADMIN" ||
    sessionUser?.role_name === "ADMIN" ||
    String(sessionUser?.role_id) === "1";

  // หน้า "ข้อมูลส่วนตัว" จะใช้ Session ID เป็นหลัก หากไม่มี Params ส่งมา
  const userId =
    (Array.isArray(user_id) ? user_id[0] : user_id) || sessionUser?.id;

  // โหมดพนักงานแก้ไขเอง (ถ้าไม่ใช่ Admin ให้ล็อกฟิลด์สำคัญ)
  const isRestricted = !isAdmin;

  // 🔒 ป้องกันพนักงานแอบแก้ข้อมูลคนอื่นผ่าน URL
  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      !isAdmin &&
      user_id &&
      String(user_id) !== String(sessionUser?.id)
    ) {
      toast.error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้อื่น");
      router.replace("/profile/personal-information");
    }
  }, [user_id, sessionUser?.id, isAdmin, sessionStatus, router]);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // --- Helper: Restricted Label ---
  const RestrictedLabel = ({ label }: { label: string }) => (
    <Space size={4}>
      <span>{label}</span>
      {isRestricted && (
        <Tooltip title="กรณีต้องการปรับเปลี่ยนข้อมูลให้ติดต่อฝ่ายบุคคล">
          <Badge
            count="HR"
            style={{
              backgroundColor: token.colorFillAlter,
              color: token.colorTextQuaternary,
              fontSize: "10px",
              height: "16px",
              lineHeight: "16px",
              minWidth: "24px",
              cursor: "help",
              border: `1px solid ${token.colorBorder}`,
            }}
          />
        </Tooltip>
      )}
    </Space>
  );

  // Debug Helper: Show Modal for Errors
  const showErrorModal = (error: any, context: string) => {
    const errorData = error?.response?.data;
    const errorMessage =
      errorData?.message_th ||
      errorData?.message_en ||
      error?.message ||
      "Internal Server Error";

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

    modal.error({
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
        </div>
      ),
      okText: "เข้าใจแล้ว",
    });
  };

  useEffect(() => {
    if (userId) fetchInitialData();
  }, [userId]);

  const fetchInitialData = async () => {
    if (!userId) return;
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
    } finally {
      setLoading(false);
    }
  };

  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;
    const empCode = form.getFieldValue("employee_code");
    const currentImg = form.getFieldValue("profile_image");

    if (!empCode) {
      toast.error("กรุณาระบุรหัสพนักงานก่อนอัปโหลดรูปภาพ");
      onError?.(new Error("Missing employee code"));
      return;
    }

    setUploading(true);
    try {
      const result =
        await HuaweiBucketStorageService.requestUploadUserProfileImage(
          file as File,
          empCode,
          currentImg,
        );

      const newUrl = result.url || result.data?.url;
      if (newUrl) {
        form.setFieldValue("profile_image", newUrl);
        setUserData((prev: any) => ({ ...prev, profile_image_path: newUrl }));
        await update({ ...session?.user, profile_image_path: newUrl });
        toast.success("อัปโหลดรูปภาพสำเร็จ");
        onSuccess?.(result);
      } else {
        throw new Error("Upload response invalid");
      }
    } catch (error: any) {
      showErrorModal(error, "อัปโหลดรูปภาพ");
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        id: Number(userId),
        joined_date: values.joined_date
          ? dayjs(values.joined_date).format("YYYY-MM-DD")
          : null,
        resigned_date: values.resigned_date
          ? dayjs(values.resigned_date).format("YYYY-MM-DD")
          : null,
        position_id: values.position_id || undefined,
        department_id: values.department_id || undefined,
        profile_image: values.profile_image || undefined,
      };

      await axios.post("/api/v2/admin/user-management/update", payload);
      await update();
      toast.success("อัปเดตข้อมูลสำเร็จ");
      if (isAdmin) router.push("/admin/user-profile");
    } catch (error: any) {
      showErrorModal(error, "อัปเดตข้อมูลผู้ใช้งาน");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PermissionLayout>
      <DashboardLayout>
        <HeaderBar
          icon={<UserOutlined />}
          title={isRestricted ? "ข้อมูลส่วนตัว" : "แก้ไขข้อมูลผู้ใช้งาน"}
          subTitle={
            isRestricted
              ? "ดูและจัดการข้อมูลส่วนตัวของคุณ"
              : "ปรับเปลี่ยนรายละเอียดข้อมูลของสมาชิกในระบบ"
          }
          extra={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() =>
                  isAdmin ? router.push("/admin/user-profile") : router.back()
                }
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
            <Col xs={24} lg={8}>
              <Card
                variant="borderless"
                styles={{ body: { textAlign: "center", padding: "40px 24px" } }}
                style={{ borderRadius: 16 }}
                loading={loading}
              >
                <div
                  style={{
                    marginBottom: 24,
                    display: "inline-block",
                    position: "relative",
                  }}
                >
                  <Upload
                    name="avatar"
                    listType="picture-circle"
                    showUploadList={false}
                    customRequest={handleUpload}
                    disabled={uploading}
                  >
                    <div className="relative group w-[104px] h-[104px] overflow-hidden rounded-full cursor-pointer">
                      <Avatar
                        size={104}
                        src={userData?.profile_image_path}
                        icon={
                          uploading ? <LoadingOutlined /> : <UserOutlined />
                        }
                        className="transition-transform group-hover:scale-110"
                        style={{
                          border: `2px solid ${token.colorBorderSecondary}`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CameraOutlined
                          style={{ color: "white", fontSize: 24 }}
                        />
                        <Text style={{ color: "white", fontSize: 10 }}>
                          แก้ไข
                        </Text>
                      </div>
                    </div>
                  </Upload>
                  {userData?.profile_image_path && (
                    <Badge
                      count={
                        <CheckCircleOutlined
                          style={{ color: token.colorSuccess }}
                        />
                      }
                      offset={[-10, 90]}
                      style={{
                        backgroundColor: "white",
                        borderRadius: "50%",
                        padding: 2,
                      }}
                    />
                  )}
                </div>

                <Title level={3} style={{ marginBottom: 4 }}>
                  {userData?.firstname_th || "-"} {userData?.lastname_th || ""}
                </Title>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 16 }}
                >
                  {userData?.email || "ไม่มีอีเมล"}
                </Text>

                <Space size={4} wrap style={{ justifyContent: "center" }}>
                  <Tag color="blue">{userData?.role?.role_name || "Guest"}</Tag>
                  <Tag color="cyan">
                    {userData?.position_ref?.name_th || "No Position"}
                  </Tag>
                </Space>

                <Divider />

                <Descriptions
                  column={1}
                  size="small"
                  labelStyle={{ color: token.colorTextDescription }}
                  contentStyle={{
                    fontWeight: 600,
                    justifyContent: "flex-end",
                    textAlign: "right",
                  }}
                  items={[
                    {
                      label: (
                        <Space>
                          <LinkOutlined /> รหัสเชื่อมต่อ
                        </Space>
                      ),
                      children: (
                        <Text copyable={{ text: userData?.admin_id }}>
                          {userData?.admin_id || "-"}
                        </Text>
                      ),
                    },
                    {
                      label: (
                        <Space>
                          <HistoryOutlined /> แก้ไขล่าสุด
                        </Space>
                      ),
                      children: userData?.updated_at
                        ? dayjs(userData.updated_at).format("DD/MM/BBBB HH:mm")
                        : "-",
                    },
                    {
                      label: (
                        <Space>
                          <IdcardOutlined /> วันที่สร้างบัญชี
                        </Space>
                      ),
                      children: dayjs(userData?.created_at).format(
                        "DD/MM/BBBB",
                      ),
                    },
                    {
                      label: (
                        <Space>
                          <CalendarOutlined /> วันที่เริ่มงาน
                        </Space>
                      ),
                      children: userData?.joined_date
                        ? dayjs(userData.joined_date).format("DD/MM/BBBB")
                        : "ไม่ได้ระบุ",
                    },
                  ]}
                />
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                variant="borderless"
                style={{ borderRadius: 16 }}
                loading={loading}
                title={
                  <Space>
                    <SolutionOutlined style={{ color: token.colorPrimary }} />
                    <span>ข้อมูลโดยละเอียด</span>
                  </Space>
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark="optional"
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Divider orientation="left" style={{ marginTop: 0 }}>
                        <Text strong>
                          <UserOutlined /> ข้อมูลส่วนตัว
                        </Text>
                      </Divider>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="ชื่อ (ไทย)"
                        name="firstname_th"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="ชื่อ" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="นามสกุล (ไทย)"
                        name="lastname_th"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="นามสกุล" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="First Name (EN)" name="firstname_en">
                        <Input placeholder="First Name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Last Name (EN)" name="lastname_en">
                        <Input placeholder="Last Name" />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Divider orientation="left">
                        <Text strong>
                          <MailOutlined /> การติดต่อและบัญชี
                        </Text>
                      </Divider>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="ชื่อผู้ใช้งาน" />}
                        name="username"
                        rules={[{ required: true }]}
                      >
                        <Input
                          disabled={isRestricted}
                          prefix={<LockOutlined />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="รหัสพนักงาน" />}
                        name="employee_code"
                      >
                        <Input
                          disabled={isRestricted}
                          prefix={<IdcardOutlined />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="อีเมล"
                        name="email"
                        rules={[{ type: "email" }]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="เบอร์โทรศัพท์" name="phone">
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Divider orientation="left">
                        <Text strong>
                          <CalendarOutlined /> ข้อมูลการทำงาน
                        </Text>
                      </Divider>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="แผนก" />}
                        name="department_id"
                      >
                        <Select
                          disabled={isRestricted}
                          options={departments.map((d) => ({
                            label: d.name_th,
                            value: d.id,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="ตำแหน่ง" />}
                        name="position_id"
                      >
                        <Select
                          disabled={isRestricted}
                          options={positions.map((p) => ({
                            label: p.name_th,
                            value: p.id,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="สิทธิ์การใช้งาน" />}
                        name="role_id"
                      >
                        <Select
                          disabled={isRestricted}
                          options={roles.map((r) => ({
                            label: r.role_name,
                            value: r.id,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="สถานะพนักงาน" />}
                        name="status"
                      >
                        <Select disabled={isRestricted}>
                          <Select.Option value="ACTIVE">
                            พนักงานปกติ
                          </Select.Option>
                          <Select.Option value="INACTIVE">
                            ปิดการใช้งาน
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="วันที่เริ่มงาน" />}
                        name="joined_date"
                      >
                        <DatePicker
                          disabled={isRestricted}
                          style={{ width: "100%" }}
                          format="DD/MM/BBBB"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<RestrictedLabel label="ประเภทพนักงาน" />}
                        name="employment_type"
                      >
                        <Select disabled={isRestricted}>
                          <Select.Option value="FULL_TIME">
                            Full-time
                          </Select.Option>
                          <Select.Option value="PART_TIME">
                            Part-time
                          </Select.Option>
                          <Select.Option value="CONTRACT">
                            Contract
                          </Select.Option>
                          <Select.Option value="INTERN">Intern</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="profile_image" hidden>
                    <Input />
                  </Form.Item>

                  <Divider />
                  <div style={{ textAlign: "right" }}>
                    <Space>
                      <Button
                        onClick={() =>
                          isAdmin
                            ? router.push("/admin/user-profile")
                            : router.back()
                        }
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        icon={<SaveOutlined />}
                        size="large"
                      >
                        บันทึกการเปลี่ยนแปลง
                      </Button>
                    </Space>
                  </div>
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
