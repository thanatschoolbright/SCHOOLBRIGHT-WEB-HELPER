"use client";

import React from "react";
import {
  Modal,
  Descriptions,
  Card,
  Tag,
  Typography,
  Space,
  Skeleton,
} from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { OvertimeRecord } from "../types/overtime.types";
import { OT_STATUS } from "../types/overtime.types";
import { getUserById } from "@helpers/local_storage/user.storage";

const { Title, Text } = Typography;

interface DetailModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedDetail: OvertimeRecord | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  setVisible,
  selectedDetail,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined className="text-blue-500" />
          {t("overtime_page.detail_title")}
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={700}
      centered
    >
      {selectedDetail ? (
        <div className="pt-4 space-y-6">
          <Descriptions
            bordered
            column={1}
            labelStyle={{ width: 150, fontWeight: 600 }}
          >
            <Descriptions.Item label={t("overtime_page.document_id")}>
              {selectedDetail.id}
            </Descriptions.Item>
            <Descriptions.Item label={t("overtime_page.requester")}>
              {selectedDetail.requester_id}
            </Descriptions.Item>
            <Descriptions.Item label={t("overtime_page.request_date")}>
              {selectedDetail.request_date
                ? dayjs(selectedDetail.request_date).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("overtime_page.status")}>
              {OT_STATUS.find((s) => s.value === selectedDetail.status)?.text ||
                selectedDetail.status}
            </Descriptions.Item>
            <Descriptions.Item label={t("overtime_page.created_by")}>
              {selectedDetail.created_by}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Title level={5}>{t("overtime_page.work_list")}</Title>
            <div className="space-y-3">
              {selectedDetail.descriptions?.map((item, idx) => (
                <Card
                  key={idx}
                  size="small"
                  type="inner"
                  title={`${t("overtime_page.item")} ${idx + 1}`}
                >
                  <div className="space-y-2">
                    {item.startDate && item.endDate && (
                      <div className="flex justify-between">
                        <Text type="secondary">
                          {t("overtime_page.time_range")}:
                        </Text>
                        <Text strong>
                          {dayjs(item.startDate).format("DD/MM/YYYY HH:mm")} -{" "}
                          {dayjs(item.endDate).format("DD/MM/YYYY HH:mm")}
                        </Text>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <Text type="secondary">
                        {t("overtime_page.description")}:
                      </Text>
                      <Text strong>{item.description}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">
                        {t("overtime_page.duration")}:
                      </Text>
                      <Tag color="blue">
                        {item.duration} {t("overtime_page.hours")}
                      </Tag>
                    </div>
                    {item.assignee && (
                      <div className="flex justify-between">
                        <Text type="secondary">
                          {t("overtime_page.assignee")}:
                        </Text>
                        <Text>
                          {getUserById(item.assignee)?.firstname ?? ""}{" "}
                          {getUserById(item.assignee)?.lastname ?? ""}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
};
