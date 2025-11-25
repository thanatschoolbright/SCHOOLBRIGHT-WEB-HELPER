import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { getPositionTagColor } from "../utils/user-profile.helpers";
import { UserProfile } from "../types/user-profile.types";

interface UsersTableProps {
  data: UserProfile[];
  loading: boolean;
  pageSize: number;
  titles: {
    index: string;
    email: string;
    fullname: string;
    nickname: string;
    position: string;
    phone: string;
    actions: string;
    employeeCode: string;
    empty: string;
    edit: string;
    delete: string;
    copy: string;
  };
  onPageSizeChange: (size: number) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (id: number) => void;
  onCopy: (user: UserProfile) => void;
}

export const UsersTable = ({
  data,
  loading,
  pageSize,
  titles,
  onPageSizeChange,
  onEdit,
  onDelete,
  onCopy,
}: UsersTableProps) => {
  const columns: ColumnsType<UserProfile> = [
    {
      title: titles.index,
      dataIndex: "index",
      align: "center",
      width: 80,
      render: (_value, _record, idx) => idx + 1,
    },
    {
      title: titles.email,
      dataIndex: "email",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Typography.Text strong>
              <a href={`mailto:${value}`}>{value}</a>
            </Typography.Text>
            {value ? (
              <Tooltip title={titles.email}>
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => onCopy(record)}
                  className="!p-1"
                />
              </Tooltip>
            ) : null}
          </Space>
          <Typography.Text type="secondary" className="text-xs">
            {titles.employeeCode}: {record.employee_code || "-"}
          </Typography.Text>
        </Space>
      ),
      sorter: (a, b) => (a.email ?? "").localeCompare(b.email ?? ""),
    },
    {
      title: titles.fullname,
      dataIndex: "fullname",
      render: (_value, record) => (
        <Space>
          <Avatar className="bg-indigo-500">
            {(record.firstname ?? record.lastname ?? "U")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
          <Typography.Text strong>
            {record.firstname} {record.lastname}
          </Typography.Text>
        </Space>
      ),
      sorter: (a, b) =>
        `${a.firstname ?? ""} ${a.lastname ?? ""}`.localeCompare(
          `${b.firstname ?? ""} ${b.lastname ?? ""}`
        ),
    },
    {
      title: titles.nickname,
      dataIndex: "nickname",
      render: (value: string | undefined) => value || "-",
      sorter: (a, b) => (a.nickname ?? "").localeCompare(b.nickname ?? ""),
    },
    {
      title: titles.position,
      dataIndex: "position",
      render: (value: string | undefined) => (
        <Tag
          color={getPositionTagColor(value)}
          className="px-3 py-1 font-medium"
        >
          {value || "-"}
        </Tag>
      ),
      sorter: (a, b) => (a.position ?? "").localeCompare(b.position ?? ""),
    },
    {
      title: titles.phone,
      dataIndex: "tel",
      render: (value: string | undefined) =>
        value ? (
          <Space>
            <PhoneOutlined />
            <a href={`tel:${value}`}>{value}</a>
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
      sorter: (a, b) => (a.tel ?? "").localeCompare(b.tel ?? ""),
    },
    {
      title: titles.actions,
      key: "actions",
      align: "center",
      width: 200,
      render: (_value, record) => (
        <Space>
          <Tooltip title={titles.edit}>
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title={titles.delete}>
            <Button
              type="primary"
              className="bg-rose-500 hover:!bg-rose-600"
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
          <Tooltip title={titles.copy}>
            <Button
              type="default"
              icon={<MailOutlined />}
              onClick={() => onCopy(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<UserProfile>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey={(record) =>
        record.admin_id
          ? `user-${record.admin_id}`
          : `user-${record.id ?? record.email}`
      }
      pagination={{
        pageSize,
        showSizeChanger: true,
        pageSizeOptions: ["10", "30", "50"],
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      locale={{ emptyText: titles.empty }}
      className="hover:shadow-md"
      scroll={{ x: "max-content" }}
    />
  );
};
