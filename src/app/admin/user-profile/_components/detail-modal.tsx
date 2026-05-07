"use client";

import {
  EditOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Modal,
  Space,
  Tabs,
  Tag,
  theme,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/th";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useUserProfileStore } from "../_stores/user-profile-store";
import { SignatureModal } from "./signature-modal";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

interface LoginLogItem {
  id: string;
  action: "LOGIN" | "LOGOUT";
  request_time: string;
  is_success: boolean;
  ip_address: string | null;
  user_agent: string | null;
}

interface LoginLogPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

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

// ตรวจสอบชนิด browser จาก user_agent string
function parseBrowser(ua: string | null): string {
  if (!ua) return "-";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  return "Browser";
}

// Tab: Activity Log
const ActivityLogTab = () => {
  const { token } = theme.useToken();
  const { selectedUser } = useUserProfileStore();
  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<LoginLogPagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  });

  const fetchLogs = useCallback(
    async (page = 1) => {
      if (!selectedUser?.id) return;
      setIsLoading(true);
      try {
        const res = await axios.get(
          `/api/v2/admin/user-management/login-log?user_id=${selectedUser.id}&page=${page}&page_size=20`,
        );
        setLogs(res.data.data ?? []);
        setPagination(res.data.pagination);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    },
    [selectedUser?.id],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const loginCount = logs.filter((l) => l.action === "LOGIN").length;
  const logoutCount = logs.filter((l) => l.action === "LOGOUT").length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Space size={12}>
          <Badge count={pagination.total} overflowCount={9999} color="blue">
            <Typography.Text strong style={{ fontSize: 14 }}>
              ประวัติการเข้า-ออกระบบ
            </Typography.Text>
          </Badge>
          <Tag color="green" icon={<LoginOutlined />}>
            เข้า {loginCount}
          </Tag>
          <Tag color="orange" icon={<LogoutOutlined />}>
            ออก {logoutCount}
          </Tag>
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

      {/* Timeline */}
      {logs.length === 0 && !isLoading ? (
        <Empty description="ยังไม่มีประวัติการเข้าสู่ระบบ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          <Timeline
            mode="left"
            items={logs.map((log) => {
              const isLogin = log.action === "LOGIN";
              const color = isLogin ? "#52c41a" : "#fa8c16";
              const icon = isLogin ? (
                <LoginOutlined style={{ color, fontSize: 14 }} />
              ) : (
                <LogoutOutlined style={{ color: "#fa8c16", fontSize: 14 }} />
              );

              const timeStr = dayjs(log.request_time).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss");
              const relStr = dayjs(log.request_time).fromNow();
              const browser = parseBrowser(log.user_agent);

              return {
                dot: icon,
                color,
                label: (
                  <Tooltip title={timeStr}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {relStr}
                    </Typography.Text>
                  </Tooltip>
                ),
                children: (
                  <Card
                    size="small"
                    styles={{
                      body: { padding: "8px 12px" },
                    }}
                    style={{
                      borderColor: isLogin ? "#b7eb8f" : "#ffd591",
                      backgroundColor: isLogin
                        ? token.colorSuccessBg
                        : token.colorWarningBg,
                      marginBottom: 2,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%" }}>
                      <Space size={6}>
                        <Tag
                          color={isLogin ? "success" : "warning"}
                          style={{ margin: 0, fontWeight: 600, fontSize: 11 }}
                        >
                          {isLogin ? "เข้าสู่ระบบ" : "ออกจากระบบ"}
                        </Tag>
                        <Typography.Text style={{ fontSize: 12 }}>
                          {timeStr}
                        </Typography.Text>
                      </Space>
                      <Space size={12}>
                        {log.ip_address && (
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            IP: {log.ip_address}
                          </Typography.Text>
                        )}
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {browser}
                        </Typography.Text>
                      </Space>
                    </Space>
                  </Card>
                ),
              };
            })}
          />
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          <Button
            size="small"
            disabled={pagination.page <= 1}
            onClick={() => fetchLogs(pagination.page - 1)}
          >
            หน้าก่อน
          </Button>
          <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: "24px" }}>
            {pagination.page} / {pagination.total_pages}
          </Typography.Text>
          <Button
            size="small"
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => fetchLogs(pagination.page + 1)}
          >
            หน้าถัดไป
          </Button>
        </div>
      )}
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
