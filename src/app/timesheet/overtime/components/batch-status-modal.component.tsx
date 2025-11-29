"use client";

import React from "react";
import { Modal, Typography, Select } from "antd";
import { useTranslation } from "react-i18next";
import { OT_STATUS } from "../types/overtime.types";

const { Text } = Typography;

interface BatchStatusModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedRowKeys: React.Key[];
  batchSelectedStatus: string;
  setBatchSelectedStatus: (status: string) => void;
  batchApproveOvertime: (status: string) => void;
  batchProcessing: boolean;
}

export const BatchStatusModal: React.FC<BatchStatusModalProps> = ({
  visible,
  setVisible,
  selectedRowKeys,
  batchSelectedStatus,
  setBatchSelectedStatus,
  batchApproveOvertime,
  batchProcessing,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("overtime_page.batch_status_title")}
      open={visible}
      onCancel={() => setVisible(false)}
      onOk={async () => {
        setVisible(false);
        await batchApproveOvertime(batchSelectedStatus);
      }}
      okText={t("overtime_page.confirm")}
      cancelText={t("overtime_page.cancel")}
      confirmLoading={batchProcessing}
    >
      <div className="py-4">
        <Text>
          {t("overtime_page.batch_status_message", {
            count: selectedRowKeys.length,
          })}
        </Text>
        <div className="mt-4">
          <Text className="mb-2 block">
            {t("overtime_page.select_new_status")}
          </Text>
          <Select
            value={batchSelectedStatus}
            onChange={setBatchSelectedStatus}
            options={OT_STATUS.map((s) => ({
              label: s.text,
              value: s.value,
            }))}
            style={{ width: "100%" }}
            size="large"
          />
        </div>
      </div>
    </Modal>
  );
};
