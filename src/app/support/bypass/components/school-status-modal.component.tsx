"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  SettingOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Descriptions,
  Flex,
  Modal,
  Switch,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { requestUpdateSchoolStatus } from "../_api/school-status.api";
import type { SchoolDetail } from "../types/bypass.types";

interface SchoolStatusModalProps {
  open: boolean;
  school: SchoolDetail | null;
  onClose: () => void;
  onSuccess: (schoolId: number, active: boolean | null, isActive: boolean | null) => void;
}

// ✨ Modal ปรับสถานะโรงเรียน: Active (เปิดใช้งานระบบ) และ isActive (เปิดเข้าสู่ระบบ)
const SchoolStatusModal: React.FC<SchoolStatusModalProps> = ({
  open,
  school,
  onClose,
  onSuccess,
}) => {
  const [activeValue, setActiveValue] = useState<boolean>(false);
  const [isActiveValue, setIsActiveValue] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // ✨ ซิงค์ค่าเริ่มต้นจาก school prop เมื่อ modal เปิด
  useEffect(() => {
    if (school && open) {
      setActiveValue(school.db_active ?? false);
      setIsActiveValue(school.db_is_active ?? (school.isActive === "active"));
    }
  }, [school, open]);

  // ✨ บันทึกการปรับสถานะโรงเรียนผ่าน API
  const handleSave = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const schoolId = Number(school.school_id);
      await requestUpdateSchoolStatus(schoolId, {
        active: activeValue,
        is_active: isActiveValue,
      });
      toast.success(`อัปเดตสถานะ ${school.company_name} สำเร็จ`);
      onSuccess(schoolId, activeValue, isActiveValue);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      toast.error(`ไม่สามารถอัปเดตสถานะได้: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!school) return null;

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          <SettingOutlined style={{ color: "#f97316" }} />
          <Typography.Text strong>ปรับสถานะโรงเรียน</Typography.Text>
        </Flex>
      }
      onCancel={onClose}
      onOk={handleSave}
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      okButtonProps={{ danger: false }}
      width={480}
      destroyOnClose
    >
      <Flex vertical gap={20} style={{ paddingTop: 8 }}>
        {/* ข้อมูลโรงเรียน */}
        <Descriptions
          size="small"
          column={1}
          bordered
          labelStyle={{ width: 120, fontWeight: 600 }}
        >
          <Descriptions.Item label="รหัสโรงเรียน">
            <Tag color="geekblue">{school.school_id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="ชื่อโรงเรียน">
            <Typography.Text strong>{school.company_name}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="จังหวัด">
            {school.province || "-"}
          </Descriptions.Item>
        </Descriptions>

        <Alert
          type="warning"
          showIcon
          message="การปรับสถานะจะมีผลทันที กรุณาตรวจสอบก่อนบันทึก"
          style={{ borderRadius: 8 }}
        />

        {/* Toggle Active */}
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${activeValue ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.2)"}`,
            background: activeValue ? "rgba(22,163,74,0.04)" : "rgba(220,38,38,0.03)",
          }}
        >
          <Flex vertical gap={2}>
            <Flex align="center" gap={6}>
              <SettingOutlined style={{ color: activeValue ? "#16a34a" : "#94a3b8" }} />
              <Typography.Text strong>เปิดการใช้งานระบบ (Active)</Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ควบคุมการเข้าถึงฟีเจอร์ต่าง ๆ ของระบบโรงเรียน
            </Typography.Text>
          </Flex>
          <Flex align="center" gap={8}>
            {activeValue ? (
              <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
                เปิด
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error" style={{ margin: 0 }}>
                ปิด
              </Tag>
            )}
            <Switch
              checked={activeValue}
              onChange={setActiveValue}
              checkedChildren="เปิด"
              unCheckedChildren="ปิด"
            />
          </Flex>
        </Flex>

        {/* Toggle isActive */}
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${isActiveValue ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.2)"}`,
            background: isActiveValue ? "rgba(22,163,74,0.04)" : "rgba(220,38,38,0.03)",
          }}
        >
          <Flex vertical gap={2}>
            <Flex align="center" gap={6}>
              {isActiveValue ? (
                <UnlockOutlined style={{ color: "#16a34a" }} />
              ) : (
                <LockOutlined style={{ color: "#94a3b8" }} />
              )}
              <Typography.Text strong>เปิดการเข้าสู่ระบบ (isActive)</Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ควบคุมสิทธิ์การ Login เข้าสู่ระบบของโรงเรียน
            </Typography.Text>
          </Flex>
          <Flex align="center" gap={8}>
            {isActiveValue ? (
              <Tag icon={<UnlockOutlined />} color="success" style={{ margin: 0 }}>
                เปิด
              </Tag>
            ) : (
              <Tag icon={<LockOutlined />} color="error" style={{ margin: 0 }}>
                ปิด
              </Tag>
            )}
            <Switch
              checked={isActiveValue}
              onChange={setIsActiveValue}
              checkedChildren="เปิด"
              unCheckedChildren="ปิด"
            />
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default SchoolStatusModal;
