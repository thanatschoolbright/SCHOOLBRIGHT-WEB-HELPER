import {
  CheckCircleOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SmileOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space } from "antd";
import { useEffect } from "react";
import { TFunction } from "i18next";
import { UpdateUserInput, UserProfile } from "../types/user-profile.types";

interface EditUserModalProps {
  open: boolean;
  translation: TFunction<"translate">;
  positions: string[];
  user: UserProfile | null;
  onCancel: () => void;
  onSubmit: (payload: UpdateUserInput) => Promise<void>;
}

interface EditFormValues {
  admin_id: number | string;
  employee_code?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  position?: string;
  email?: string;
  backlog_email?: string;
  tel?: string;
}

export const EditUserModal = ({
  open,
  translation,
  positions,
  user,
  onCancel,
  onSubmit,
}: EditUserModalProps) => {
  const [form] = Form.useForm<EditFormValues>();

  useEffect(() => {
   console.info("user", user);
    if (open && user) {
      form.setFieldsValue({
        admin_id: user.admin_id,
        employee_code: user.employee_code,
        firstname: user.firstname,
        lastname: user.lastname,
        nickname: user.nickname,
        position: user.position,
        email: user.email,
        backlog_email: user.backlog_email,
        tel: user.tel,
      });
    } else {
      form.resetFields();
    }
  }, [form, open, user]);

  const handleFinish = async (values: EditFormValues) => {
    if (!user) return;
    await onSubmit({
      admin_id: Number(values.admin_id),
      employee_code: values.employee_code ?? "",
      firstname: values.firstname ?? "",
      lastname: values.lastname ?? "",
      nickname: values.nickname ?? "",
      position: values.position ?? "",
      email: values.email ?? "",
      backlog_email: values.backlog_email ?? "",
      tel: values.tel ?? "",
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={translation("user_profile_page.edit_modal_title")}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="admin_id" hidden>
          <Input type="hidden" />
        </Form.Item>

        <Form.Item
          label={translation("user_profile_page.firstname_label")}
          name="firstname"
          rules={[
            { required: true, message: translation("user_profile_page.firstname_required") },
          ]}
        >
          <Input placeholder={translation("user_profile_page.firstname_placeholder")} prefix={<UserOutlined />} />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.lastname_label")}
          name="lastname"
          rules={[
            { required: true, message: translation("user_profile_page.lastname_required") },
          ]}
        >
          <Input placeholder={translation("user_profile_page.lastname_placeholder")} prefix={<UserOutlined />} />
        </Form.Item>
        <Form.Item label={translation("user_profile_page.nickname_label")} name="nickname">
          <Input placeholder={translation("user_profile_page.nickname_placeholder")} prefix={<SmileOutlined />} />
        </Form.Item>
        <Form.Item label={translation("user_profile_page.employee_code_label")} name="employee_code">
          <Input placeholder={translation("user_profile_page.employee_code_placeholder")} prefix={<IdcardOutlined />} />
        </Form.Item>
        <Form.Item label={translation("user_profile_page.position_label")} name="position">
          <Select
            allowClear
            options={positions.map((pos) => ({ label: pos, value: pos }))}
            placeholder={translation("user_profile_page.position_placeholder")}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.email_label")}
          name="email"
          rules={[{ type: "email", message: translation("user_profile_page.email_invalid") }]}
        >
          <Input placeholder={translation("user_profile_page.email_placeholder")} prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.backlog_email_label")}
          name="backlog_email"
          rules={[{ type: "email", message: translation("user_profile_page.email_invalid") }]}
        >
          <Input placeholder={translation("user_profile_page.backlog_email_placeholder")} prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item label={translation("user_profile_page.tel_label")} name="tel">
          <Input placeholder={translation("user_profile_page.tel_placeholder")} prefix={<PhoneOutlined />} />
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
