import React from "react";
import { Modal } from "antd";

type ErrorModalProps = {
  error: Error | null;
  onClose: () => void;
};

export const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <Modal
      title="เกิดข้อผิดพลาด"
      open={!!error}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div>
        <p className="text-red-600 mb-4">{error.message}</p>
        <details className="mt-3">
          <summary className="cursor-pointer text-blue-500 hover:text-blue-600">
            ดูรายละเอียดเพิ่มเติม
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs max-h-64 overflow-auto">
            {error.stack || JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    </Modal>
  );
};
