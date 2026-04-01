import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import React from "react";

interface TimesheetActionsProps {
  //** สถานะการโหลด */
  loading?: boolean;
  //** สถานะการรีเฟรช */
  refreshLoading?: boolean;
  //** ฟังก์ชันเพิ่มรายการใหม่ */
  onAdd: () => void;
  //** ฟังก์ชันรีเฟรชข้อมูล */
  onRefresh: () => void;
}

export const TimesheetActions: React.FC<TimesheetActionsProps> = ({
  loading = false,
  refreshLoading = false,
  onAdd,
  onRefresh,
}) => {
  return (
    <Space>
      {/* ปุ่มรีเฟรช */}
      <Tooltip title="รีเฟรชข้อมูล">
        <Button
          type="text"
          icon={<ReloadOutlined />}
          loading={refreshLoading}
          onClick={onRefresh}
          size="small"
        />
      </Tooltip>

      {/* ปุ่มเพิ่มรายการใหม่ */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAdd}
        disabled={loading}
        size="middle"
        hidden
      >
        เพิ่มรายการ
      </Button>
    </Space>
  );
};
