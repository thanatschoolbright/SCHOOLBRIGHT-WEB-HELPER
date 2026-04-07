"use client";

import { Modal, Select, Typography } from "antd";

import { useAppSelector } from "@stores/store";
import { useUserProfileStore } from "../_stores/user-profile-store";

export const BulkUpdateModal = () => {
  const {
    bulkMode,
    bulkValue,
    bulkLoading,
    positions,
    departments,
    roles,
    setBulkMode,
    setBulkValue,
    bulkUpdateStaffData,
  } = useUserProfileStore();
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  const modeLabel =
    bulkMode === "position"
      ? "ตำแหน่ง"
      : bulkMode === "department"
      ? "แผนก"
      : bulkMode === "role"
      ? "สิทธิ์การใช้งาน"
      : "ประเภทการจ้างงาน";

  const options =
    bulkMode === "position"
      ? (positions as { id: number; name_th: string }[]).map((p) => ({
          label: p.name_th,
          value: p.id,
        }))
      : bulkMode === "department"
      ? (departments as { id: number; name_th: string }[]).map((d) => ({
          label: d.name_th,
          value: d.id,
        }))
      : bulkMode === "role"
      ? (roles as { id: number; role_name: string }[]).map((r) => ({
          label: r.role_name,
          value: r.id,
        }))
      : [
          { label: "พนักงานประจำ", value: "FULL_TIME" },
          { label: "พนักงานชั่วคราว", value: "PART_TIME" },
          { label: "สัญญาจ้าง", value: "CONTRACT" },
          { label: "นักศึกษาฝึกงาน", value: "INTERN" },
        ];

  return (
    <Modal
      title={`ปรับปรุง${modeLabel}แบบกลุ่ม`}
      open={!!bulkMode}
      onOk={() => bulkUpdateStaffData(adminId)}
      onCancel={() => setBulkMode(null)}
      confirmLoading={bulkLoading}
      okText="ยืนยันการเปลี่ยนข้อมูล"
      cancelText="ยกเลิก"
    >
      <div className="py-4">
        <Typography.Text className="mb-4 block">
          คุณต้องการเปลี่ยน{modeLabel} ของพนักงานที่เลือก เป็น:
        </Typography.Text>
        <Select<number | string>
          className="w-full"
          placeholder={`เลือก${modeLabel}ใหม่`}
          value={bulkValue ?? undefined}
          onChange={(v) => setBulkValue(v)}
          options={options as { label: string; value: number | string }[]}
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </div>
    </Modal>
  );
};
