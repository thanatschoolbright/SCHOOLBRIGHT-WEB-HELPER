import { useAppSelector } from "@/stores/store";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MailOutlined,
  MoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getUserById } from "@helpers/local_storage/user.storage";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Dropdown,
  Modal,
  Select,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { OT_STATUS } from "../types/overtime.types";
import { getCurrentUserId } from "../utils/overtime.helpers";

const { Text } = Typography;

interface ChangeStatusModalProps {
  record: any;
  onStatusChange: (id: string | number, status: string) => void;
  t: (key: string) => string;
}

const ChangeStatusModalContent: React.FC<ChangeStatusModalProps> = ({
  record,
  onStatusChange,
  t,
}) => {
  const { token } = theme.useToken();

  // จัดลำดับความสำคัญของข้อมูลพนักงาน:
  // 1. จาก Backend (requester_user)
  // 2. จาก Local Storage (user)
  // 3. จาก record.requester_name โดยตรง
  const user = getUserById(record.requester_id);
  const backendUser = record.requester_user;

  const displayName = backendUser
    ? `${backendUser.firstname_th} ${backendUser.lastname_th}`.trim()
    : user
      ? `${user.firstname} ${user.lastname}`.trim()
      : record.requester_name || record.requester_id;

  return (
    <>
      <Space
        style={{
          width: "100%",
          paddingBottom: 16,
          borderBottom: `2px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Avatar
          size={48}
          style={{
            background: token.colorSuccessBg,
          }}
          icon={
            <CheckOutlined
              style={{
                color: token.colorSuccess,
                fontSize: 24,
              }}
            />
          }
        />
        <Space direction="vertical" size={0}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t("overtime_page.change_status")}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            เปลี่ยนสถานะการอนุมัติคำขอ OT
          </Typography.Text>
        </Space>
      </Space>

      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", paddingTop: 16 }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space align="center">
            <FileTextOutlined
              style={{ fontSize: 16, color: token.colorPrimary }}
            />
            <Typography.Text strong style={{ fontSize: 14 }}>
              รายละเอียดคำขอ
            </Typography.Text>
          </Space>
          <Card
            size="small"
            styles={{
              body: {
                background: token.colorSuccessBg,
                borderColor: token.colorSuccessBorder,
              },
            }}
          >
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item
                label={
                  <Typography.Text type="secondary">
                    เลขที่เอกสาร
                  </Typography.Text>
                }
              >
                <Typography.Text strong>{record.id}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Typography.Text type="secondary">
                    ผู้ยื่นคำขอ
                  </Typography.Text>
                }
              >
                <Typography.Text strong>{displayName}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Typography.Text type="secondary">
                    วันที่ยื่นคำขอ
                  </Typography.Text>
                }
              >
                <Typography.Text strong>
                  {record.request_date
                    ? dayjs(record.request_date).format("DD/MM/YYYY")
                    : "-"}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Space>

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space align="center">
            <EditOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
            <Typography.Text strong style={{ fontSize: 14 }}>
              เลือกสถานะใหม่
            </Typography.Text>
          </Space>
          <Select
            defaultValue={record.status || "pending"}
            style={{ width: "100%" }}
            size="large"
            onChange={(v) => onStatusChange(record.id, v)}
            options={OT_STATUS.map((s) => ({
              label: (
                <Space>
                  <Tag color={s.color}>{s.text}</Tag>
                </Space>
              ),
              value: s.value,
            }))}
            placeholder="เลือกสถานะ"
          />
          <Space align="start" size={4}>
            <InfoCircleOutlined
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                marginTop: 2,
              }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              การเปลี่ยนสถานะจะมีผลทันที และระบบจะบันทึกประวัติการเปลี่ยนแปลง
            </Typography.Text>
          </Space>
        </Space>
      </Space>
    </>
  );
};

interface UseOvertimeTableColumnsProps {
  processedItems: Set<React.Key>;
  deleteOvertime: (id?: string | number) => void;
  approveOvertime: (id?: string | number, status?: string) => void;
  sendEmailToHR: (id?: string | number) => void;
  fetchOvertimeDetail: (id: string | number) => void;
  router: any;
}

export const useOvertimeTableColumns = ({
  processedItems = new Set(),
  deleteOvertime = () => {},
  approveOvertime = () => {},
  sendEmailToHR = () => {},
  fetchOvertimeDetail = () => {},
  router = { push: () => {} },
}: UseOvertimeTableColumnsProps) => {
  const { t } = useTranslation();
  const authentication = useAppSelector((state) => state.callAdminLogin);
  const { token } = theme.useToken();

  return useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 70,
        sorter: (a: any, b: any) => (a.id || 0) - (b.id || 0),
      },
      {
        title: t("overtime_page.request_date"),
        dataIndex: "request_date",
        width: 150,
        render: (value: string) =>
          value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
        sorter: (a: any, b: any) =>
          dayjs(a.request_date).valueOf() - dayjs(b.request_date).valueOf(),
      },
      {
        title: t("overtime_page.requester"),
        dataIndex: "requester_id",
        width: 200,
        sorter: (a: any, b: any) =>
          (a.requester_name || "").localeCompare(b.requester_name || ""),
        render: (value: string, record: any) => {
          const user = getUserById(value);
          const backendUser = record.requester_user;

          const name = backendUser
            ? `${backendUser.firstname_th} ${backendUser.lastname_th}`.trim()
            : user
              ? `${user.firstname} ${user.lastname}`.trim()
              : record.requester_name || value;

          const avatarSrc =
            backendUser?.profile_image ||
            backendUser?.image_profile ||
            user?.profile_image ||
            user?.image_profile;

          return (
            <Space>
              <Avatar icon={<UserOutlined />} size="small" src={avatarSrc}>
                {!avatarSrc && (name ? name[0] : "?")}
              </Avatar>
              <Space direction="vertical" size={0}>
                <Typography.Text strong style={{ fontSize: 13 }}>
                  {name}
                </Typography.Text>
                <Space size={4} wrap>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {record.requester_employee_code ||
                      backendUser?.employee_code ||
                      user?.employee_code ||
                      "-"}
                  </Typography.Text>
                  <Divider type="vertical" style={{ margin: 0 }} />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {record.requester_position ||
                      backendUser?.position_th ||
                      "-"}
                  </Typography.Text>
                </Space>
              </Space>
            </Space>
          );
        },
      },
      {
        title: t("overtime_page.total_hours"),
        key: "total_hours",
        width: 100,
        align: "right" as const,
        render: (_: any, record: any) => {
          const total = (record.descriptions || []).reduce(
            (sum: number, desc: any) => sum + Number(desc.duration || 0),
            0,
          );
          return (
            <Text strong style={{ color: token.colorError }}>
              {total.toFixed(2)}
            </Text>
          );
        },
      },
      {
        title: t("overtime_page.status"),
        dataIndex: "status",
        width: 120,
        sorter: (a: any, b: any) =>
          (a.status || "").localeCompare(b.status || ""),
        filters: OT_STATUS.map((s) => ({ text: s.text, value: s.value })),
        render: (status: string) => {
          const s = OT_STATUS.find((o) => o.value === status) || OT_STATUS[0];
          return <Tag color={s.color}>{s.text}</Tag>;
        },
      },
      {
        title: t("overtime_page.created_at"),
        dataIndex: "created_at",
        width: 150,
        sorter: (a: any, b: any) =>
          dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
        render: (value: string) =>
          value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: t("overtime_page.updated_at"),
        dataIndex: "updated_at",
        width: 150,
        sorter: (a: any, b: any) =>
          dayjs(a.updated_at).valueOf() - dayjs(b.updated_at).valueOf(),
        render: (value: string) =>
          value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: t("overtime_page.created_by"),
        dataIndex: "created_by",
        width: 160,
        render: (value: string, record: any) => {
          const backendCreator = record.creator_user;
          const user = getUserById(value);
          const name = backendCreator
            ? `${backendCreator.firstname_th} ${backendCreator.lastname_th}`.trim()
            : user
              ? `${user.firstname} ${user.lastname}`.trim()
              : record.creator_name || value;

          return (
            <Space>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={
                  backendCreator?.profile_image ||
                  user?.profile_image ||
                  user?.image_profile
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {name || "-"}
              </Text>
            </Space>
          );
        },
      },
      {
        title: t("overtime_page.actions"),
        key: "actions",
        width: 80,
        fixed: "right" as const,
        render: (_: any, record: any) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: t("overtime_page.view_detail"),
                  icon: <EyeOutlined />,
                  onClick: () => fetchOvertimeDetail(record.id),
                },
                {
                  key: "preview",
                  label: t("overtime_page.view_pdf"),
                  icon: <FilePdfOutlined />,
                  onClick: () =>
                    router.push(`/timesheet/overtime/preview/${record.id}`),
                },
                {
                  key: "status",
                  label: t("overtime_page.change_status"),
                  icon: <CheckOutlined />,
                  onClick: async () => {
                    const currentUserId =
                      await getCurrentUserId(authentication);
                    if (currentUserId !== "117")
                      return toast.error(t("overtime_page.no_permission"));

                    Modal.confirm({
                      title: null,
                      content: (
                        <ChangeStatusModalContent
                          record={record}
                          onStatusChange={approveOvertime}
                          t={t}
                        />
                      ),
                      width: 600,
                      centered: true,
                      footer: null,
                      closable: true,
                      icon: null,
                    });
                  },
                },
                {
                  key: "email",
                  label: t("overtime_page.send_email"),
                  icon: <MailOutlined />,
                  onClick: async () => {
                    const currentUserId =
                      await getCurrentUserId(authentication);
                    if (currentUserId !== "117")
                      return toast.error(t("overtime_page.no_permission"));
                    sendEmailToHR(record.id);
                  },
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: t("overtime_page.delete"),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => {
                    Modal.confirm({
                      title: t("overtime_page.confirm_delete_title"),
                      content: t("overtime_page.confirm_delete_content"),
                      okText: t("overtime_page.delete"),
                      okType: "danger",
                      cancelText: t("overtime_page.cancel"),
                      onOk: () => deleteOvertime(record.id),
                    });
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [
      t,
      processedItems,
      deleteOvertime,
      approveOvertime,
      sendEmailToHR,
      fetchOvertimeDetail,
      router,
      authentication,
    ],
  );
};
