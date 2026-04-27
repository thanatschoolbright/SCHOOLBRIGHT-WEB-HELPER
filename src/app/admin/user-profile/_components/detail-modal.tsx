"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Descriptions,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { GET_API_LOGS } from "@/helpers/api-log.helper";
import { ApiLogItem, ApiLogPagination } from "@/types/api-log.type";
import { useUserProfileStore } from "../_stores/user-profile-store";
import { SignatureModal } from "./signature-modal";

// columns สำหรับ Activity Log table
const activityColumns: ColumnsType<ApiLogItem> = [
  {
    title: "เวลา",
    dataIndex: "requestTime",
    key: "requestTime",
    width: 160,
    render: (v) => (
      <Typography.Text style={{ fontSize: 12 }}>
        {dayjs(v).format("DD/MM/YY HH:mm:ss")}
      </Typography.Text>
    ),
  },
  {
    title: "Method",
    dataIndex: "method",
    key: "method",
    width: 80,
    render: (v) => {
      const colorMap: Record<string, string> = {
        GET: "green",
        POST: "blue",
        PUT: "orange",
        PATCH: "cyan",
        DELETE: "red",
      };
      return <Tag color={colorMap[v] ?? "default"}>{v ?? "-"}</Tag>;
    },
  },
  {
    title: "Endpoint",
    dataIndex: "endpoint",
    key: "endpoint",
    ellipsis: true,
    render: (v) => (
      <Typography.Text style={{ fontSize: 12 }} copyable={{ text: v }}>
        {v ?? "-"}
      </Typography.Text>
    ),
  },
  {
    title: "Status",
    dataIndex: "statusCode",
    key: "statusCode",
    width: 80,
    render: (v, record) => (
      <Space size={4}>
        {record.isSuccess ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
        )}
        <Tag
          color={
            v >= 200 && v < 300 ? "success" : v >= 400 ? "error" : "warning"
          }
        >
          {v ?? "-"}
        </Tag>
      </Space>
    ),
  },
  {
    title: "ใช้เวลา",
    dataIndex: "durationMs",
    key: "durationMs",
    width: 90,
    render: (v) => (
      <Typography.Text style={{ fontSize: 12 }}>
        {v != null ? `${v} ms` : "-"}
      </Typography.Text>
    ),
  },
  {
    title: "IP",
    dataIndex: "ipAddress",
    key: "ipAddress",
    width: 120,
    render: (v) => (
      <Typography.Text style={{ fontSize: 11 }}>{v ?? "-"}</Typography.Text>
    ),
  },
];

// Tab: ข้อมูลพนักงาน
const UserInfoTab = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const { selectedUser, closeDetailModal } = useUserProfileStore();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  if (!selectedUser) return null;

  return (
    <div className="py-2">
      <div
        className="flex items-center gap-6 mb-6 p-6 rounded-2xl border"
        style={{
          backgroundColor: token.colorFillAlter,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <Avatar
          size={100}
          src={selectedUser.profile_image_path}
          icon={<UserOutlined />}
          className="shadow-md"
          style={{ border: `4px solid ${token.colorBgContainer}` }}
        />
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {selectedUser.firstname_th} {selectedUser.lastname_th}
          </Typography.Title>
          <Typography.Text type="secondary" className="text-lg">
            {selectedUser.nickname ? `(${selectedUser.nickname})` : ""}
          </Typography.Text>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Tag color="blue" className="rounded-full">
              รหัสพนักงาน: {selectedUser.employee_code}
            </Tag>
            <Tag color="cyan" className="rounded-full">
              รหัสระบบ: {selectedUser.admin_id}
            </Tag>
            <Tag
              color={selectedUser.status === "ACTIVE" ? "success" : "default"}
              className="rounded-full"
            >
              {selectedUser.status === "ACTIVE"
                ? "ออนไลน์และเป็นปกติ"
                : "ระงับการใช้งาน"}
            </Tag>
          </div>
        </div>
      </div>

      <Descriptions
        title="ข้อมูลส่วนตัวและบัญชี"
        bordered
        column={2}
        className="mb-6"
        size="small"
      >
        <Descriptions.Item label="ชื่อผู้ใช้งาน">
          {selectedUser.username}
        </Descriptions.Item>
        <Descriptions.Item label="สิทธิ์การใช้งาน">
          {selectedUser.role?.role_name || "ผู้ใช้งาน"}
        </Descriptions.Item>
        <Descriptions.Item label="อีเมล" span={2}>
          {selectedUser.email || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="เบอร์โทรศัพท์">
          {selectedUser.phone || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="วันเกิด">
          {selectedUser.birth_date
            ? dayjs(selectedUser.birth_date).format("DD MMMM YYYY")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="เพศ">
          {selectedUser.gender === "MALE"
            ? "ชาย"
            : selectedUser.gender === "FEMALE"
            ? "หญิง"
            : selectedUser.gender === "OTHER"
            ? "ไม่ระบุ"
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="อีเมลสำรอง">
          {(selectedUser as unknown as Record<string, string>).backlog_email ||
            "-"}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions
        title="ข้อมูลการทำงาน"
        bordered
        column={2}
        className="mb-6"
        size="small"
      >
        <Descriptions.Item label="ตำแหน่ง">
          {selectedUser.position_ref?.name_th || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="แผนก">
          {selectedUser.department?.name_th || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="ประเภทการจ้างงาน">
          {selectedUser.employment_type === "FULL_TIME"
            ? "พนักงานประจำ"
            : selectedUser.employment_type === "PART_TIME"
            ? "พาร์ทไทม์"
            : selectedUser.employment_type === "CONTRACT"
            ? "สัญญาจ้าง"
            : selectedUser.employment_type === "INTERN"
            ? "นักศึกษาฝึกงาน"
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="วันที่เริ่มงาน">
          {selectedUser.joined_date
            ? dayjs(selectedUser.joined_date).format("DD MMMM YYYY")
            : "-"}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="ข้อมูลความปลอดภัย" bordered column={2} size="small">
        <Descriptions.Item label="เข้าสู่ระบบล่าสุด">
          {selectedUser.last_login
            ? dayjs(selectedUser.last_login).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="เข้าสู่ระบบล้มเหลว">
          {selectedUser.failed_login_attempts || 0} ครั้ง
        </Descriptions.Item>
        <Descriptions.Item label="สร้างเมื่อ" span={2}>
          {dayjs(selectedUser.created_at).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
      </Descriptions>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={closeDetailModal}>ปิดหน้าต่าง</Button>
        <Button
          icon={<SafetyCertificateOutlined />}
          onClick={() => setSignatureModalOpen(true)}
        >
          จัดการลายเซ็น
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => router.push(`/admin/user-profile/${selectedUser.id}`)}
        >
          แก้ไขข้อมูล
        </Button>
      </div>

      <SignatureModal
        open={signatureModalOpen}
        userId={selectedUser.id}
        userName={`${selectedUser.firstname_th} ${selectedUser.lastname_th}`}
        onClose={() => setSignatureModalOpen(false)}
      />
    </div>
  );
};

// Tab: Activity Log
const ActivityLogTab = () => {
  const { selectedUser } = useUserProfileStore();
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<ApiLogPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ดึง activity log ของ user คนนี้จาก calledBy = username
  const fetchLogs = useCallback(
    async (page = 1) => {
      if (!selectedUser?.username) return;
      setIsLoading(true);
      try {
        const res = await GET_API_LOGS({
          calledBy: selectedUser.id.toString(),
          page,
          limit: 10,
          sortBy: "request_time",
          sortOrder: "desc",
        });
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      } catch {
        // silent — ถ้า log ไม่มีก็แสดง empty
      } finally {
        setIsLoading(false);
      }
    },
    [selectedUser?.username],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Space>
          <Badge count={pagination.total} overflowCount={9999} color="blue">
            <Typography.Text strong>ประวัติการใช้งาน API</Typography.Text>
          </Badge>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            (calledBy : {selectedUser?.id ?? "-"})
          </Typography.Text>
        </Space>
        <Tooltip title="รีเฟรช">
          <Button
            icon={<ReloadOutlined />}
            size="small"
            shape="circle"
            loading={isLoading}
            onClick={() => fetchLogs(pagination.page)}
          />
        </Tooltip>
      </div>

      <Table<ApiLogItem>
        columns={activityColumns}
        dataSource={logs}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 700 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          onChange: (page) => fetchLogs(page),
          size: "small",
        }}
        rowClassName={(record) =>
          !record.isSuccess ? "bg-red-50 dark:bg-red-950/20" : ""
        }
      />
    </div>
  );
};

// Main Modal
export const DetailModal = () => {
  const { detailModalOpen, selectedUser, closeDetailModal } =
    useUserProfileStore();

  return (
    <Modal
      open={detailModalOpen}
      title={
        <Space>
          <InfoCircleOutlined />
          <span>
            รายละเอียดพนักงาน — {selectedUser?.firstname_th}{" "}
            {selectedUser?.lastname_th}
          </span>
        </Space>
      }
      onCancel={closeDetailModal}
      width={860}
      footer={null}
      centered
      styles={{ body: { padding: "0 24px 24px" } }}
    >
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: "info",
            label: (
              <Space>
                <UserOutlined />
                ข้อมูลพนักงาน
              </Space>
            ),
            children: <UserInfoTab />,
          },
          {
            key: "activity",
            label: (
              <Space>
                <HistoryOutlined />
                Activity Log
              </Space>
            ),
            children: <ActivityLogTab />,
          },
        ]}
      />
    </Modal>
  );
};
