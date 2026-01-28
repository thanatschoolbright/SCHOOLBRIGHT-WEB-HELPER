"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Space,
  App,
  theme,
} from "antd";
import {
  LockOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
  const router = useRouter();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setSubmitting(false);
      // Validate confirm password manually or using form rules
      if (values.new_password !== values.confirm_password) {
        toast.error("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }

      setSubmitting(true);
      const payload = {
        old_password: values.old_password,
        new_password: values.new_password,
      };

      await axios.post("/api/v2/profile/change-password", payload);

      toast.success("เปลี่ยนรหัสผ่านสำเร็จแล้ว");
      form.resetFields();

      // Optional: Redirect or suggest logout
      modal.success({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        content:
          "ระบบได้ทำการเปลี่ยนรหัสผ่านของคุณเรียบร้อยแล้ว กรุณาใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป",
        okText: "ตกลง",
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message_th ||
        "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";

      modal.error({
        title: (
          <Space>
            <ExclamationCircleOutlined style={{ color: token.colorError }} />
            <span style={{ fontWeight: 600, color: token.colorError }}>
              เปลี่ยนรหัสผ่านไม่สำเร็จ
            </span>
          </Space>
        ),
        content: errorMessage,
        okText: "ลองอีกครั้ง",
      });
      console.error("Change password error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PermissionLayout>
      <DashboardLayout>
        <HeaderBar
          icon={<KeyOutlined />}
          title="เปลี่ยนรหัสผ่าน"
          subTitle="เพื่อความปลอดภัยของบัญชี กรุณาเปลี่ยนรหัสผ่านที่คาดเดาได้ยาก"
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
          }
        />

        <div style={{ padding: "24px", maxWidth: 600, margin: "0 auto" }}>
          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary }}
          >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: token.colorPrimaryBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <LockOutlined
                  style={{ fontSize: 32, color: token.colorPrimary }}
                />
              </div>
              <Title level={4} style={{ margin: 0 }}>
                ตั้งค่ารหัสผ่านใหม่
              </Title>
              <Text type="secondary">
                รหัสผ่านใหม่ควรมีความยาวอย่างน้อย 8 ตัวอักษร
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                label="รหัสผ่านปัจจุบัน"
                name="old_password"
                rules={[
                  { required: true, message: "กรุณาระบุรหัสผ่านปัจจุบัน" },
                ]}
              >
                <Input.Password
                  prefix={
                    <LockOutlined style={{ color: token.colorTextDisabled }} />
                  }
                  placeholder="กรอกรหัสผ่านเดิม"
                />
              </Form.Item>

              <Divider />

              <Form.Item
                label="รหัสผ่านใหม่"
                name="new_password"
                rules={[
                  { required: true, message: "กรุณาระบุรหัสผ่านใหม่" },
                  {
                    min: 8,
                    message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
                  },
                ]}
              >
                <Input.Password
                  prefix={
                    <KeyOutlined style={{ color: token.colorTextDisabled }} />
                  }
                  placeholder="กรอกรหัสผ่านใหม่"
                />
              </Form.Item>

              <Form.Item
                label="ยืนยันรหัสผ่านใหม่"
                name="confirm_password"
                dependencies={["new_password"]}
                rules={[
                  { required: true, message: "กรุณายืนยันรหัสผ่านใหม่" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("new_password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("รหัสผ่านที่ยืนยันไม่ตรงกัน"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={
                    <KeyOutlined style={{ color: token.colorTextDisabled }} />
                  }
                  placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  block
                >
                  ยืนยันการเปลี่ยนรหัสผ่าน
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
};

export default ResetPasswordPage;
