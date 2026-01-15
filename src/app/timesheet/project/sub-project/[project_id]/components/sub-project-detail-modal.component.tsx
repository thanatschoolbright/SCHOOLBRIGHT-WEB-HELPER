import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  List,
  Avatar,
  theme,
} from "antd";
import {
  InfoCircleOutlined,
  CalendarOutlined,
  LinkOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import type { SubProject } from "../types/sub-project.types";
import { ASSET_OPTIONS } from "../utils/constants";
import { getUserById } from "@helpers/local_storage/user.storage";

const { Text, Title } = Typography;

interface SubProjectDetailModalProps {
  open: boolean;
  data: SubProject | null;
  onClose: () => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "ยังไม่เริ่มต้น":
      return "default";
    case "ค้นคว้าเอกสาร":
      return "cyan";
    case "พัฒนา":
      return "processing";
    case "ทดสอบระบบ":
      return "warning";
    case "ส่งมอบงาน (บนเซิฟเวอร์พัฒนา)":
      return "blue";
    case "ส่งมอบงาน (บนเซิฟเวอร์โปรดักชัน)":
      return "success";
    default:
      return "default";
  }
};

export const SubProjectDetailModal: React.FC<SubProjectDetailModalProps> = ({
  open,
  data,
  onClose,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

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
        <div className="p-4 rounded-lg border border-gray-100 flex justify-between items-start dark:border-gray-800">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {data.name}
            </Title>
            <div className="mt-1 flex gap-2">
              <Tag color={getStatusColor(data.status)}>
                {data.status || "ยังไม่เริ่มต้น"}
              </Tag>
              <Tag color={option?.color}>{option?.label}</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t("sub_project_page.detail_id")}: {data.id}
            </Text>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" className="h-full">
              <div className="flex flex-col">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("sub_project_page.detail_start_date")}
                </Text>
                <Space align="center">
                  <CalendarOutlined />
                  <Text>
                    {data.startDate
                      ? dayjs(data.startDate).format("DD/MM/YYYY")
                      : "-"}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" className="h-full">
              <div className="flex flex-col">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("sub_project_page.detail_end_date")}
                </Text>
                <Space align="center">
                  <CalendarOutlined />
                  <Text>
                    {data.endDate
                      ? dayjs(data.endDate).format("DD/MM/YYYY")
                      : "-"}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        <div>
          <Text strong>
            <Space>
              <TeamOutlined /> ทีมงานที่รับผิดชอบ
            </Space>
          </Text>
          <Card size="small" className="mt-2">
            <List
              dataSource={data.projectAssignees || []}
              locale={{ emptyText: "ไม่พบข้อมูลทีมงาน" }}
              renderItem={(item) => {
                const u = getUserById(item.userId);
                return (
                  <List.Item style={{ padding: "8px 0" }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={u?.profile_image}
                          style={{ backgroundColor: token.colorPrimary }}
                        >
                          {u?.firstname?.[0] || <UserOutlined />}
                        </Avatar>
                      }
                      title={`${u?.firstname || "Unknown"} ${
                        u?.lastname || ""
                      }`}
                      description={
                        item.position || (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ไม่ได้ระบุตำแหน่ง
                          </Text>
                        )
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </div>

        <div>
          <Text strong>{t("sub_project_page.detail_note")}</Text>
          <Card size="small" style={{ minHeight: 60 }} className="mt-2">
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
                  className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800/50"
                  style={{ textDecoration: "none" }}
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
