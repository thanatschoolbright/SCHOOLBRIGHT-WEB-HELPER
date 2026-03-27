"use client";

import { UserOutlined } from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Button,
  Flex,
  Modal,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { Text, Title } = Typography;

interface MyWorkItem {
  id: number;
  projectId: number;
  featureId: number | null;
  userId: number;
  position: string | null;
  project: {
    id: number;
    name: string;
    name_en: string | null;
    status: string;
  };
  feature: {
    id: number;
    name: string;
    name_en: string | null;
    status: string;
    ticket_number?: string | null;
  } | null;
}

interface MyWorkModalProps {
  open: boolean;
  onCancel: () => void;
  userId?: number;
}

/**
 * Modal แสดงรายการงานที่ได้รับมอบหมาย (My Work)
 */
export const MyWorkModal: React.FC<MyWorkModalProps> = ({
  open,
  onCancel,
  userId,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MyWorkItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/timesheet/my-work?user_id=${String(userId)}`,
      );
      setData(response.data?.data ?? []);
    } catch (_error) {
      toast.error("ไม่สามารถโหลดข้อมูลงานของคุณได้");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      void fetchData();
    }
  }, [open, fetchData]);

  const columns = [
    {
      title: t("timesheet_entry_page.table_project", "โครงการ"),
      dataIndex: ["project", "name"],
      key: "project",
      render: (text: string, record: MyWorkItem) => (
        <Flex vertical gap={0}>
          <Text strong>{text}</Text>
          {record.project.name_en && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.project.name_en}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: t("timesheet_entry_page.sub_task_feature", "งานย่อย / ฟีเจอร์"),
      dataIndex: ["feature", "name"],
      key: "feature",
      render: (text: string, record: MyWorkItem) =>
        text ? (
          <Flex vertical gap={0}>
            <Space size={4} wrap>
              {record.feature?.ticket_number && (
                <Tag color="processing" bordered={false} style={{ margin: 0 }}>
                  {record.feature.ticket_number}
                </Tag>
              )}
              <Text>{text}</Text>
            </Space>
            {record.feature?.name_en && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.feature.name_en}
              </Text>
            )}
          </Flex>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: t("timesheet_entry_page.position_role", "ตำแหน่ง / บทบาท"),
      dataIndex: "position",
      key: "position",
      render: (text: string) =>
        text || (
          <Text type="secondary">
            {t("timesheet_entry_page.not_specified", "ไม่ได้ระบุ")}
          </Text>
        ),
    },
    {
      title: t("timesheet_entry_page.table_status", "สถานะ"),
      key: "status",
      render: (_text: string, record: MyWorkItem) => (
        <Flex gap={4} wrap="wrap">
          <Tag
            color={record.project.status === "open" ? "processing" : "default"}
          >
            Project: {record.project.status.toUpperCase()}
          </Tag>
          {record.feature && (
            <Tag color={record.feature.status === "open" ? "cyan" : "default"}>
              Feature: {record.feature.status.toUpperCase()}
            </Tag>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <Space size={12}>
          <UserOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <Flex vertical gap={0}>
            <Title level={4} style={{ margin: 0 }}>
              {t("timesheet_entry_page.my_work", "งานของฉัน")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t(
                "timesheet_entry_page.my_work_description",
                "รายการโครงการและฟีเจอร์ที่คุณได้รับมอบหมาย",
              )}
            </Text>
          </Flex>
        </Space>
      }
      onCancel={onCancel}
      width={1000}
      footer={<Button onClick={onCancel}>ปิด</Button>}
      centered
      styles={{
        body: { padding: "16px 24px" },
      }}
    >
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{
          emptyText: t(
            "timesheet_entry_page.no_assigned_work",
            "ไม่พบข้อมูลงานที่ได้รับมอบหมาย",
          ),
        }}
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};
