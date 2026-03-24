/* eslint-disable no-useless-assignment */
"use client";

import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Row,
  Space,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const { Title, Text } = Typography;

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";

import { UserEditForm } from "./_components/user-edit-form";
import { UserProfileCard } from "./_components/user-profile-card";
import { useUserEditStore } from "./_state/user-edit-store";

/**
 * หน้าแก้ไขข้อมูลผู้ใช้งาน (User Profile Edit Page)
 * ทำหน้าที่เป็น Orchestrator สำหรับประกอบ Components และจัดการ Layout หลัก
 */
const UserEditPage = () => {
  const router = useRouter();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const { user_id } = useParams();
  const userId = Array.isArray(user_id) ? user_id[0] : user_id;
  const [form] = Form.useForm();

  // Zustand States & Actions
  const {
    loading,
    submitting,
    fetchInitialData,
    updateUser,
    userData,
    roles,
    positions,
    departments,
  } = useUserEditStore();

  const employeeCode = Form.useWatch("employee_code", form);

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
    if (userId) {
      fetchInitialData(userId as string, (err: any) =>
        showErrorModal(err, "ดึงข้อมูลผู้ใช้งาน"),
      );
    }
  }, [userId]);

  // Sync state to form when userData is loaded
  useEffect(() => {
    if (userData) {
      form.setFieldsValue({
        ...userData,
        role_id: userData.role_id,
        position_id: userData.position_id,
        department_id: userData.department_id,
        profile_image: userData.profile_image_path,
        joined_date: userData.joined_date ? dayjs(userData.joined_date) : null,
        resigned_date: userData.resigned_date
          ? dayjs(userData.resigned_date)
          : null,
        birth_date: userData.birth_date ? dayjs(userData.birth_date) : null,
        employment_type: userData.employment_type || "FULL_TIME",
      });
    }
  }, [userData, form]);

  /**
   * จัดการการบันทึกข้อมูล
   */
  const onFinish = async (values: any) => {
    const changedFields: any[] = [];
    const fieldLabels: Record<string, string> = {
      firstname_th: "ชื่อ (ไทย)",
      lastname_th: "นามสกุล (ไทย)",
      firstname_en: "ชื่อ (อังกฤษ)",
      lastname_en: "นามสกุล (อังกฤษ)",
      nickname: "ชื่อเล่น",
      username: "ชื่อผู้ใช้งาน",
      email: "อีเมล",
      phone: "เบอร์โทรศัพท์",
      employee_code: "รหัสพนักงาน",
      status: "สถานะ",
      joined_date: "วันที่เริ่มงาน",
      resigned_date: "วันที่ลาออก",
      birth_date: "วันเกิด",
      employment_type: "ประเภทจ้างงาน",
      role_id: "สิทธิ์การใช้งาน",
      position_id: "ตำแหน่ง",
      department_id: "แผนก",
    };

    // ตรวจสอบข้อมูลที่เปลี่ยนแปลง
    Object.keys(fieldLabels).forEach((key) => {
      const oldVal = userData[key];
      const newVal = values[key];

      // จัดการ Date comparison
      if (
        ["joined_date", "resigned_date", "birth_date"].includes(key) &&
        (oldVal || newVal)
      ) {
        const oldDateStr = oldVal ? dayjs(oldVal).format("DD/MM/YYYY") : "-";
        const newDateStr = newVal ? dayjs(newVal).format("DD/MM/YYYY") : "-";
        if (oldDateStr !== newDateStr) {
          changedFields.push({
            label: fieldLabels[key],
            old: oldDateStr,
            new: newDateStr,
          });
        }
        return;
      }

      // จัดการกับ ID หรือ ค่าปกติ
      if (oldVal !== newVal) {
        let oldDisplay = oldVal ?? "-";
        let newDisplay = newVal ?? "-";

        // Mapping ชื่อเฉพาะสำหรับค่าที่เป็น ID
        if (key === "role_id") {
          oldDisplay = roles.find((r) => r.id === oldVal)?.role_name || "-";
          newDisplay = roles.find((r) => r.id === newVal)?.role_name || "-";
        } else if (key === "position_id") {
          oldDisplay = positions.find((p) => p.id === oldVal)?.name_th || "-";
          newDisplay = positions.find((p) => p.id === newVal)?.name_th || "-";
        } else if (key === "department_id") {
          oldDisplay = departments.find((d) => d.id === oldVal)?.name_th || "-";
          newDisplay = departments.find((d) => d.id === newVal)?.name_th || "-";
        } else if (key === "status") {
          oldDisplay = oldVal === "ACTIVE" ? "ใช้งานปกติ" : "ปิดการใช้งาน";
          newDisplay = newVal === "ACTIVE" ? "ใช้งานปกติ" : "ปิดการใช้งาน";
        }

        changedFields.push({
          label: fieldLabels[key],
          old: oldDisplay,
          new: newDisplay,
        });
      }
    });

    if (changedFields.length === 0) {
      toast.info("ไม่พบการแก้ไขข้อมูล");
      return;
    }

    // แสดง Confirm Modal พร้อมรายละเอียด
    modal.confirm({
      title: (
        <Space>
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            ยืนยันการแก้ไขข้อมูล
          </span>
        </Space>
      ),
      width: 600,
      centered: true,
      className: "rounded-2xl",
      icon: null,
      content: (
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          <Text type="secondary">
            พบข้อมูลที่ถูกเปลี่ยนแปลงจำนวน {changedFields.length} รายการ
            กรุณาตรวจสอบก่อนกดยืนยัน
          </Text>
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              padding: "4px 8px 4px 4px",
            }}
          >
            {changedFields.map((item, index) => (
              <Card
                key={index}
                styles={{ body: { padding: "12px 16px" } }}
                style={{
                  background: token.colorFillAlter,
                  marginBottom: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 12,
                }}
              >
                <Flex vertical gap={6}>
                  <Badge
                    status="processing"
                    text={
                      <Text strong style={{ color: token.colorText }}>
                        {item.label}
                      </Text>
                    }
                  />
                  <Flex align="center" gap={12}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        wordBreak: "break-all",
                        color: token.colorTextDescription,
                      }}
                    >
                      {item.old}
                    </Text>
                    <RightOutlined
                      style={{ fontSize: 10, color: token.colorTextDisabled }}
                    />
                    <Text
                      strong
                      style={{
                        flex: 1,
                        color: token.colorPrimary,
                        wordBreak: "break-all",
                      }}
                    >
                      {item.new}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </div>
        </Flex>
      ),
      okText: "ยืนยันบันทึกข้อมูล",
      cancelText: "กลับไปแก้ไข",
      okButtonProps: { size: "large", style: { borderRadius: 8 } },
      cancelButtonProps: { size: "large", style: { borderRadius: 8 } },
      onOk: async () => {
        try {
          const payload = {
            ...values,
            id: Number(userId),
            joined_date: values.joined_date
              ? dayjs(values.joined_date).format("YYYY-MM-DD")
              : null,
            resigned_date: values.resigned_date
              ? dayjs(values.resigned_date).format("YYYY-MM-DD")
              : null,
            birth_date: values.birth_date
              ? dayjs(values.birth_date).format("YYYY-MM-DD")
              : null,
            position_id: values.position_id || undefined,
            department_id: values.department_id || undefined,
            profile_image: values.profile_image || undefined,
          };

          await updateUser(payload);
          toast.success("อัปเดตข้อมูลสำเร็จ");
          router.push("/admin/user-profile");
        } catch (error: any) {
          showErrorModal(error, "อัปเดตข้อมูลผู้ใช้งาน");
          console.error("onFinish error:", error);
        }
      },
    });
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
                loading={submitting || loading}
                onClick={() => form.submit()}
              >
                บันทึกการแก้ไข
              </Button>
            </Space>
          }
        />

        <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={8}>
              <Flex vertical style={{ position: "sticky", top: 104 }}>
                <UserProfileCard employeeCode={employeeCode} form={form} />
              </Flex>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                styles={{ body: { padding: "40px" } }}
                style={{
                  borderRadius: 24,
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex vertical gap={32}>
                  <Flex vertical gap={4}>
                    <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                      ข้อมูลส่วนบุคคล
                    </Title>
                    <Text type="secondary">
                      กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความถูกต้องของระบบ
                    </Text>
                  </Flex>

                  <Divider style={{ margin: 0, opacity: 0.6 }} />

                  <UserEditForm form={form} onFinish={onFinish} />
                </Flex>
              </Card>
            </Col>
          </Row>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
};

export default UserEditPage;
