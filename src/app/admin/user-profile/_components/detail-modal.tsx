"use client";

import {
  EditOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Descriptions,
  Modal,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { useUserProfileStore } from "../_stores/user-profile-store";

export const DetailModal = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const { detailModalOpen, selectedUser, closeDetailModal } =
    useUserProfileStore();

  return (
    <Modal
      open={detailModalOpen}
      title={
        <Space>
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
          <span>รายละเอียดพนักงาน</span>
        </Space>
      }
      onCancel={closeDetailModal}
      width={700}
      footer={[
        <Button key="close" onClick={closeDetailModal}>
          ปิดหน้าต่าง
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => router.push(`/admin/user-profile/${selectedUser?.id}`)}
        >
          แก้ไขข้อมูล
        </Button>,
      ]}
      centered
    >
      {selectedUser && (
        <div className="py-4">
          <div
            className="flex items-center gap-6 mb-8 p-6 rounded-2xl border"
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
              <div className="mt-2 flex gap-2">
                <Tag color="blue" className="rounded-full">
                  รหัสพนักงาน: {selectedUser.employee_code}
                </Tag>
                <Tag color="cyan" className="rounded-full">
                  รหัสระบบ: {selectedUser.admin_id}
                </Tag>
                <Tag
                  color={
                    selectedUser.status === "ACTIVE" ? "success" : "default"
                  }
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
              {(selectedUser as unknown as Record<string, string>)
                .backlog_email || "-"}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title="ข้อมูลการทำงาน"
            bordered
            column={2}
            className="mb-6"
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

          <Descriptions title="ข้อมูลความปลอดภัย" bordered column={2}>
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
        </div>
      )}
    </Modal>
  );
};
