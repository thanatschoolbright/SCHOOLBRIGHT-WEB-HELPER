import {
  ApiLogFilters,
  ApiLogItem,
  ApiLogPagination,
} from "@/types/api-log.type";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { getUserById } from "@helpers/local_storage/user.storage";
import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);

const { Text } = Typography;

interface ApiLogTableProps {
  data: ApiLogItem[];
  loading: boolean;
  pagination: ApiLogPagination;
  filters: ApiLogFilters;
  onView: (record: ApiLogItem) => void;
  onEdit: (record: ApiLogItem) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, isArchived: boolean) => void;
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
}

//** คอมโพเนนต์ตารางสำหรับแสดง API Logs */
const ApiLogTable = ({
  data,
  loading,
  pagination,
  filters,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onTableChange,
}: ApiLogTableProps) => {
  //** สร้าง Status Tag */
  const renderStatusTag = (statusCode?: number, isSuccess?: boolean) => {
    if (!statusCode) return <Tag>Unknown</Tag>;

    let color = "default";
    if (statusCode >= 200 && statusCode < 300) color = "success";
    else if (statusCode >= 300 && statusCode < 400) color = "warning";
    else if (statusCode >= 400 && statusCode < 500) color = "orange";
    else if (statusCode >= 500) color = "error";

    return (
      <Tag color={color}>
        {statusCode} {isSuccess ? "(v)" : "(x)"}
      </Tag>
    );
  };

  //** สร้าง Method Tag */
  const renderMethodTag = (method?: string) => {
    if (!method) return <Tag>Unknown</Tag>;

    const colors: Record<string, string> = {
      GET: "blue",
      POST: "green",
      PUT: "orange",
      PATCH: "purple",
      DELETE: "red",
    };

    return <Tag color={colors[method] || "default"}>{method}</Tag>;
  };

  //** คอลัมน์ของตาราง */
  const columns: ColumnsType<ApiLogItem> = [
    {
      title: "Time",
      dataIndex: "requestTime",
      key: "requestTime",
      width: 180,
      sorter: true,
      sortOrder:
        filters.sortBy === "request_time"
          ? filters.sortOrder === "asc"
            ? "ascend"
            : "descend"
          : undefined,
      render: (time: string) => (
        <Tooltip title={dayjs(time).format("DD/MM/BBBB HH:mm:ss")}>
          <Text style={{ fontSize: "12px" }}>
            {dayjs(time).format("DD/MM/BBBB HH:mm:ss")}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 80,
      filters: [
        { text: "GET", value: "GET" },
        { text: "POST", value: "POST" },
        { text: "PUT", value: "PUT" },
        { text: "PATCH", value: "PATCH" },
        { text: "DELETE", value: "DELETE" },
      ],
      render: renderMethodTag,
    },
    {
      title: "Status",
      dataIndex: "statusCode",
      key: "statusCode",
      width: 100,
      sorter: true,
      sortOrder:
        filters.sortBy === "status_code"
          ? filters.sortOrder === "asc"
            ? "ascend"
            : "descend"
          : undefined,
      render: (statusCode: number, record: ApiLogItem) =>
        renderStatusTag(statusCode, record.isSuccess),
    },
    {
      title: "Service",
      dataIndex: "serviceName",
      key: "serviceName",
      width: 120,
      filters: [
        { text: "timesheet", value: "timesheet" },
        { text: "auth", value: "auth" },
        { text: "user", value: "user" },
        { text: "logger", value: "logger" },
        { text: "example", value: "example" },
      ],
      render: (serviceName?: string) => (
        <Tag color="cyan">{serviceName || "Unknown"}</Tag>
      ),
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (endpoint?: string) => (
        <Tooltip title={endpoint}>
          <Text code style={{ fontSize: "12px" }}>
            {endpoint || "-"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Duration",
      dataIndex: "durationMs",
      key: "durationMs",
      width: 100,
      sorter: true,
      sortOrder:
        filters.sortBy === "duration_ms"
          ? filters.sortOrder === "asc"
            ? "ascend"
            : "descend"
          : undefined,
      render: (duration?: number) => {
        if (!duration) return "-";

        let color = "default";
        if (duration < 100) color = "success";
        else if (duration < 500) color = "warning";
        else color = "error";

        return <Tag color={color}>{duration}ms</Tag>;
      },
    },
    {
      title: "Called By",
      dataIndex: "requestHeader",
      key: "requestHeader",
      width: 120,
      render: (_, row: ApiLogItem) => {
        // ดึงข้อมูลผู้ใช้จาก Local Storage ตาม x-request-user header
        const user = getUserById(row?.requestHeader?.["x-request-user"]);

        // ถ้าไม่พบข้อมูลผู้ใช้ ให้แสดง "ไม่ทราบ"
        if (!user) {
          return <Text style={{ fontSize: "12px" }}>ไม่ทราบ</Text>;
        }

        // แสดงชื่อ-นามสกุล พร้อมรหัสพนักงาน
        const fullName =
          `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
        const employeeCode = user.employee_code
          ? `(${user.employee_code})`
          : "";

        return (
          <Text style={{ fontSize: "12px" }}>
            {fullName || "ไม่ทราบ"} {employeeCode}
          </Text>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      filters: [
        { text: "Active", value: false },
        { text: "Archived", value: true },
      ],
      render: (_, record: ApiLogItem) => (
        <Tag color={record.isArchived ? "orange" : "green"}>
          {record.isArchived ? "Archived" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record: ApiLogItem) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              size="small"
            />
          </Tooltip>

          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              size="small"
            />
          </Tooltip>

          <Tooltip title={record.isArchived ? "Unarchive" : "Archive"}>
            <Button
              type="text"
              icon={<InboxOutlined />}
              onClick={() => onArchive(record.id, !record.isArchived)}
              size="small"
              style={{ color: record.isArchived ? "#52c41a" : "#fa8c16" }}
            />
          </Tooltip>

          <Popconfirm
            title="ยืนยันการลบ"
            description="คุณต้องการลบ API Log นี้ใช่หรือไม่?"
            onConfirm={() => onDelete(record.id)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okType="danger"
          >
            <Tooltip title="ลบ">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1200 }}
      size="small"
      pagination={{
        current: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} items`,
        pageSizeOptions: ["10", "20", "50", "100"],
      }}
      onChange={onTableChange}
    />
  );
};

export default ApiLogTable;
