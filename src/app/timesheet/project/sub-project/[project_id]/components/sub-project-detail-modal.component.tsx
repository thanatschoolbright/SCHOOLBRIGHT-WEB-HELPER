import React from "react";
import { Modal, Button, Space, Typography, Card, Row, Col, Tag } from "antd";
import {
  InfoCircleOutlined,
  CalendarOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import type { SubProject } from "../types/sub-project.types";
import { ASSET_OPTIONS } from "../utils/constants";

const { Text, Title } = Typography;

interface SubProjectDetailModalProps {
  open: boolean;
  data: SubProject | null;
  onClose: () => void;
}

export const SubProjectDetailModal: React.FC<SubProjectDetailModalProps> = ({
  open,
  data,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!data) return null;

  const option = ASSET_OPTIONS.find((o) => o.value === data.assetCaptureType);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <InfoCircleOutlined />
          {t("sub_project_page.detail_modal_title")}
        </Space>
      }
      footer={
        <Button onClick={onClose}>{t("sub_project_page.detail_close")}</Button>
      }
      width={600}
      centered
    >
      <div className="space-y-6 pt-4">
        <div className="p-4 rounded-lg border border-gray-100 flex justify-between items-start">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {data.name}
            </Title>
            <Text type="secondary">
              {t("sub_project_page.detail_id")}: {data.id}
            </Text>
          </div>
          <Tag color={option?.color}>{option?.label}</Tag>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small">
              <Text type="secondary">
                {t("sub_project_page.detail_start_date")}
              </Text>
              <Space align="center">
                <CalendarOutlined />
                {data.startDate
                  ? dayjs(data.startDate).format("DD/MM/YYYY")
                  : "-"}
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Text type="secondary">
                {t("sub_project_page.detail_end_date")}
              </Text>
              <Space align="center">
                <CalendarOutlined />
                {data.endDate ? dayjs(data.endDate).format("DD/MM/YYYY") : "-"}
              </Space>
            </Card>
          </Col>
        </Row>

        <div>
          <Text strong>{t("sub_project_page.detail_note")}</Text>
          <Card size="small" style={{ minHeight: 60 }}>
            {data.backlogDescription?.note || <Text type="secondary">-</Text>}
          </Card>
        </div>

        <div>
          <Text strong>{t("sub_project_page.detail_attachments")}</Text>
          <div className="mt-2 space-y-2">
            {data.backlogDescription?.backlogs?.length ? (
              data.backlogDescription.backlogs.map((item: any, idx: number) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", padding: 12, borderRadius: 8 }}
                >
                  <Space>
                    <LinkOutlined />
                    <Text strong>{item.title}</Text>
                  </Space>
                </a>
              ))
            ) : (
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary">
                    {t("sub_project_page.detail_no_attachments")}
                  </Text>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
