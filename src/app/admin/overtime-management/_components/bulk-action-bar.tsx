"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DollarOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { Alert, Button, Flex, Popconfirm, Space, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import React from "react";

const { Text } = Typography;

interface BulkActionBarProps {
  selectedKeys: React.Key[];
  onClearSelection: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkMarkPaid: () => void;
  isLoading: boolean;
}

/**
 * แถบดำเนินการกลุ่มสำหรับ OT ที่เลือกหลายรายการพร้อมกัน
 * แสดงเมื่อมีรายการถูกเลือกอย่างน้อย 1 รายการ
 */
const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedKeys,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  onBulkMarkPaid,
  isLoading,
}) => {
  const router = useRouter();

  if (selectedKeys.length === 0) return null;

  // นำทางไปยังหน้า bulk preview เพื่อพิมพ์ PDF ทุกรายการที่เลือก
  const handleBulkPdf = () => {
    const ids = selectedKeys.map((k) => String(k)).join(",");
    router.push(`/timesheet/overtime/preview/bulk?ids=${ids}`);
  };

  return (
    <Alert
      type="info"
      style={{ borderRadius: 8 }}
      message={
        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Flex align="center" gap={8}>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              {selectedKeys.length} รายการ
            </Tag>
            <Text>ถูกเลือก — เลือกการดำเนินการด้านล่าง</Text>
          </Flex>

          <Space wrap>
            <Popconfirm
              title={`อนุมัติ ${selectedKeys.length} รายการ?`}
              description="คำขอ OT ที่เลือกทั้งหมดจะถูกอนุมัติพร้อมกัน"
              onConfirm={onBulkApprove}
              okText="อนุมัติทั้งหมด"
              cancelText="ยกเลิก"
              disabled={isLoading}
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={isLoading}
                size="small"
              >
                อนุมัติทั้งหมด
              </Button>
            </Popconfirm>

            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={onBulkReject}
              disabled={isLoading}
              size="small"
            >
              ปฏิเสธทั้งหมด
            </Button>

            <Popconfirm
              title={`เปลี่ยนสถานะเป็น "จ่ายเงินแล้ว" จำนวน ${selectedKeys.length} รายการ?`}
              description="ใช้หลังจากโอนเงินค่า OT ให้พนักงานเรียบร้อยแล้ว"
              onConfirm={onBulkMarkPaid}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              disabled={isLoading}
            >
              <Button
                icon={<DollarOutlined />}
                disabled={isLoading}
                size="small"
              >
                ทำเครื่องหมายจ่ายแล้ว
              </Button>
            </Popconfirm>

            <Button
              icon={<FilePdfOutlined />}
              onClick={handleBulkPdf}
              disabled={isLoading}
              size="small"
            >
              พิมพ์ PDF ({selectedKeys.length})
            </Button>

            <Button
              icon={<CloseOutlined />}
              onClick={onClearSelection}
              disabled={isLoading}
              size="small"
            >
              ยกเลิกการเลือก
            </Button>
          </Space>
        </Flex>
      }
    />
  );
};

export default BulkActionBar;
