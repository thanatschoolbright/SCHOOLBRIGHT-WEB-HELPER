import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Input, Modal, Typography } from "antd";
import { TFunction } from "i18next";

interface DeleteUserModalProps {
  open: boolean;
  confirmText: string;
  translation: TFunction<"translate">;
  keyword: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onConfirmTextChange: (value: string) => void;
}

export const DeleteUserModal = ({
  open,
  confirmText,
  translation,
  keyword,
  onCancel,
  onConfirm,
  onConfirmTextChange,
}: DeleteUserModalProps) => (
  <Modal
    open={open}
    onCancel={onCancel}
    onOk={onConfirm}
    okText={translation("user_profile_page.delete_button")}
    cancelText={translation("user_profile_page.cancel_button")}
    title={translation("user_profile_page.delete_modal_title")}
    okButtonProps={{ disabled: confirmText !== keyword, className: "bg-rose-500" }}
    destroyOnHidden
  >
    <div className="space-y-2">
      <Typography.Text type="danger" className="flex items-center gap-2">
        <ExclamationCircleOutlined />
        {translation("user_profile_page.delete_modal_description")}
      </Typography.Text>
      <Typography.Text>
        {translation("user_profile_page.delete_modal_instruction")}{" "}
        <Typography.Text strong className="text-rose-500">
          {keyword}
        </Typography.Text>
      </Typography.Text>
      <Input
        value={confirmText}
        placeholder={translation("user_profile_page.delete_modal_placeholder")}
        onChange={(e) => onConfirmTextChange(e.target.value)}
      />
    </div>
  </Modal>
);
