/* eslint-disable no-useless-assignment */
"use client";

import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Modal,
  Row,
  Space,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";

import { UserEditForm } from "./_components/user-edit-form";
import { UserProfileCard } from "./_components/user-profile-card";
import { useUserEditStore } from "./_state/user-edit-store";

const { Text } = Typography;

/**
 * หน้าแก้ไขข้อมูลผู้ใช้งาน (User Profile Edit Page)
 * ทำหน้าที่เป็น Orchestrator สำหรับประกอบ Components และจัดการ Layout หลัก
 */
const UserEditPage = () => {
  const router = useRouter();
  const { token } = theme.useToken();
  const { user_id } = useParams();
  const userId = Array.isArray(user_id) ? user_id[0] : user_id;
  const [form] = Form.useForm();

  // Zustand States & Actions
  const { loading, submitting, fetchInitialData, updateUser, userData } =
    useUserEditStore();

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
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <UserProfileCard employeeCode={employeeCode} form={form} />
            </Col>

            <Col xs={24} lg={16}>
              <Card
                variant="borderless"
                style={{ borderRadius: 16 }}
                loading={loading}
                title={
                  <Space>
                    <SolutionOutlined style={{ color: token.colorPrimary }} />
                    <span>ข้อมูลผู้ใช้งานโดยละเอียด</span>
                  </Space>
                }
              >
                <UserEditForm form={form} onFinish={onFinish} />
              </Card>
            </Col>
          </Row>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
};

export default UserEditPage;
