import { CheckCircleOutlined, EditOutlined, InfoCircleOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space } from "antd";
import { toast } from "sonner";
import { useEffect } from "react";
import { TFunction } from "i18next";
import { UpsertUserPayload } from "../types/user-profile.types";

interface CreateUserModalProps {
  open: boolean;
  translation: TFunction<"translate">;
  onCancel: () => void;
  onSubmit: (payload: UpsertUserPayload) => Promise<void>;
}

export const CreateUserModal = ({
  open,
  translation,
  onCancel,
  onSubmit,
}: CreateUserModalProps) => {
  const [form] = Form.useForm<UpsertUserPayload>();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values: UpsertUserPayload) => {
    try {
      await onSubmit({
        username: values.username.trim(),
        password: values.password?.trim(),
        name: values.name.trim(),
        lastname: values.lastname.trim(),
      });
      toast.success(translation("user_profile_page.toast_create_success"));
    } catch (err) {
      toast.error(translation("user_profile_page.toast_create_error"));
      throw err;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={translation("user_profile_page.create_modal_title")}
      footer={null}
      destroyOnClose
    >
      
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label={translation("user_profile_page.username_label")}
          name="username"
          rules={[
            { required: true, message: translation("user_profile_page.username_required") },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.username_placeholder")}
            prefix={<InfoCircleOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.password_label")}
          name="password"
          rules={[
            { required: true, message: translation("user_profile_page.password_required") },
            { min: 6, message: translation("user_profile_page.password_min") },
          ]}
        >
          <Input.Password
            placeholder={translation("user_profile_page.password_placeholder")}
            prefix={<LockOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.firstname_label")}
          name="name"
          rules={[
            { required: true, message: translation("user_profile_page.firstname_required") },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.firstname_placeholder")}
            prefix={<EditOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.lastname_label")}
          name="lastname"
          rules={[
            { required: true, message: translation("user_profile_page.lastname_required") },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.lastname_placeholder")}
            prefix={<EditOutlined />}
          />
        </Form.Item>
        <Form.Item>
          <Space className="flex w-full justify-end">
            <Button onClick={onCancel}>{translation("user_profile_page.cancel_button")}</Button>
            <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
              {translation("user_profile_page.save_button")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
