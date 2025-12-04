import { useMemo } from "react";
import {
  Button,
  Dropdown,
  Space,
  Tag,
  Avatar,
  Typography,
  Modal,
  Select,
} from "antd";
import {
  CheckOutlined,
  EyeOutlined,
  FilePdfOutlined,
  MailOutlined,
  DeleteOutlined,
  MoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getUserById } from "@helpers/local_storage/user.storage";
import { OT_STATUS } from "../types/overtime.types";
import { getCurrentUserId } from "../utils/overtime.helpers";
import { toast } from "sonner";
import { useAppSelector } from "@/stores/store";

const { Text } = Typography;

interface UseOvertimeTableColumnsProps {
  processedItems: Set<React.Key>;
  deleteOvertime: (id?: string | number) => void;
  approveOvertime: (id?: string | number, status?: string) => void;
  sendEmailToHR: (id?: string | number) => void;
  fetchOvertimeDetail: (id: string | number) => void;
  router: any;
}

export const useOvertimeTableColumns = ({
  processedItems,
  deleteOvertime,
  approveOvertime,
  sendEmailToHR,
  fetchOvertimeDetail,
  router,
}: UseOvertimeTableColumnsProps) => {
  const { t } = useTranslation();
  const authentication = useAppSelector((state) => state.callAdminLogin);

  return useMemo(
    () => [
      {
        title: "",
        key: "processed",
        width: 50,
        align: "center" as const,
        render: (_: any, record: any) =>
          processedItems.has(record.id) && (
            <CheckOutlined className="text-green-500 text-lg font-bold" />
          ),
      },
      {
        title: t("overtime_page.request_date"),
        dataIndex: "request_date",
        width: 120,
        render: (value: string) =>
          value ? dayjs(value).format("DD/MM/YYYY") : "-",
        sorter: (a: any, b: any) =>
          dayjs(a.request_date).valueOf() - dayjs(b.request_date).valueOf(),
      },
      {
        title: t("overtime_page.requester"),
        dataIndex: "requester_id",
        width: 200,
        render: (value: string) => {
          const user = getUserById(value);
          return (
            <Space>
              <Avatar icon={<UserOutlined />} size="small">
                {user?.firstname?.[0]}
              </Avatar>
              <Text>{user ? `${user.firstname} ${user.lastname}` : "-"}</Text>
            </Space>
          );
        },
      },
      {
        title: t("overtime_page.status"),
        dataIndex: "status",
        width: 140,
        filters: OT_STATUS.map((s) => ({ text: s.text, value: s.value })),
        render: (status: string) => {
          const s = OT_STATUS.find((o) => o.value === status) || OT_STATUS[0];
          return (
            <Tag color={s.color} className="px-2 py-1 rounded-full">
              {s.text}
            </Tag>
          );
        },
      },
      {
        title: t("overtime_page.created_by"),
        dataIndex: "created_by",
        width: 180,
        render: (value: string) => {
          const user = getUserById(value);
          return (
            <Text type="secondary">
              {user ? `${user.firstname} ${user.lastname}` : "-"}
            </Text>
          );
        },
      },
      {
        title: t("overtime_page.created_at"),
        dataIndex: "created_at",
        width: 160,
        render: (value: string) =>
          value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
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
                    const currentUserId = await getCurrentUserId(
                      authentication
                    );
                    if (currentUserId !== "117")
                      return toast.error(t("overtime_page.no_permission"));
                    Modal.confirm({
                      title: t("overtime_page.change_status"),
                      content: (
                        <div className="pt-4">
                          <Select
                            defaultValue={record.status || "pending"}
                            style={{ width: "100%" }}
                            onChange={(v) => approveOvertime(record.id, v)}
                            options={OT_STATUS.map((s) => ({
                              label: s.text,
                              value: s.value,
                            }))}
                          />
                        </div>
                      ),
                      footer: null,
                      closable: true,
                    });
                  },
                },
                {
                  key: "email",
                  label: t("overtime_page.send_email"),
                  icon: <MailOutlined />,
                  onClick: async () => {
                    const currentUserId = await getCurrentUserId(
                      authentication
                    );
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
    ]
  );
};
