"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
  TLineGroupItem,
  sendTestLineReport,
} from "../_api/school-line-group-service";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";
import { BatchSendModal } from "./batch-send-modal";
import { motion } from "framer-motion";

const { Text } = Typography;

/**
 * ไอคอน LINE (SVG) ตามแบบ Ant Design
 */
const LineIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ marginBottom: -2 }}
  >
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

/**
 * ตารางแสดงรายชื่อกลุ่ม LINE พร้อมฟังก์ชันการจัดการ
 * ปรับปรุง Padding และ Cell Spacing ให้ดูพรีเมียมและไม่อึดอัด
 */
export const SchoolLineGroupTable = () => {
  const { token } = theme.useToken();
  const {
    items,
    loading,
    pagination,
    filterSchoolId,
    sendingId,
    fetchData,
    setSendingId,
    setStatusModal,
    openCreateModal,
    openEditModal,
  } = useSchoolLineGroupStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const selectedItems = items.filter((item) =>
    selectedRowKeys.includes(item.LineGroupId),
  );

  /**
   * ส่ง LINE ทดสอบไปยังโรงเรียนที่เลือก
   */
  const handleSendLine = async (record: TLineGroupItem) => {
    if (!record.SchoolId) return;

    setSendingId(record.LineGroupId);
    try {
      const data = await sendTestLineReport(record.SchoolId);
      if ((data?.status ?? data?.status_code) === 200) {
        const schoolLabel = record.school_name_th
          ? `${record.school_name_th} (${record.SchoolId})`
          : data.data?.school_name ?? `โรงเรียน ${record.SchoolId}`;
        setStatusModal({
          open: true,
          type: "success",
          title: "ส่งรายงานสำเร็จ",
          message: `ส่งรายงานสถานะเครื่องของ${schoolLabel} ไปยัง LINE สำเร็จ`,
        });
      } else {
        throw new Error(data?.message_th ?? "ส่งไม่สำเร็จ");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setStatusModal({
        open: true,
        type: "error",
        title: "ส่งรายงานไม่สำเร็จ",
        message: "ไม่สามารถส่งรายงานไปยัง LINE ได้ กรุณาตรวจสอบการเชื่อมต่อ",
        errorDetails: msg,
      });
    } finally {
      setSendingId(null);
    }
  };

  /**
   * ยืนยันการลบข้อมูล
   */
  const confirmDelete = (record: TLineGroupItem) => {
    const schoolLabel = record.school_name_th
      ? `${record.school_name_th} (${record.SchoolId})`
      : `โรงเรียน ${record.SchoolId}`;
    useSchoolLineGroupStore.getState().setDeleteId(record.LineGroupId);
    setStatusModal({
      open: true,
      type: "delete",
      title: "ยืนยันการลบกลุ่ม LINE",
      message: `คุณต้องการลบกลุ่ม LINE ของ${schoolLabel} ใช่หรือไม่?`,
    });
  };

  const columns: ColumnsType<TLineGroupItem> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 80,
      align: "center",
      render: (_: unknown, __: unknown, idx: number) => (
        <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
          {(pagination.page - 1) * pagination.page_size + idx + 1}
        </Text>
      ),
    },
    {
      title: "รหัสโรงเรียน",
      dataIndex: "SchoolId",
      key: "SchoolId",
      sorter: (a, b) => (a.SchoolId ?? 0) - (b.SchoolId ?? 0),
      render: (val: number | null) =>
        val ? (
          <Tag
            color="blue"
            className="rounded-lg font-mono font-bold px-3 py-0.5 border-blue-200"
          >
            {val}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "ชื่อโรงเรียน",
      key: "school_name",
      sorter: (a, b) =>
        (a.school_name_th ?? "").localeCompare(b.school_name_th ?? ""),
      render: (_: unknown, record: TLineGroupItem) => {
        const nameTH = record.school_name_th;
        const nameEN = record.school_name_en;
        if (!nameTH) return <Text type="secondary">-</Text>;
        return (
          <Flex vertical gap={2}>
            <Text style={{ fontSize: 13 }}>{nameTH}</Text>
            {nameEN && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {nameEN}
              </Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: "Group ID",
      dataIndex: "GroupId",
      key: "GroupId",
      sorter: (a, b) => (a.GroupId ?? "").localeCompare(b.GroupId ?? ""),
      render: (val: string | null) =>
        val ? (
          <Text
            code
            copyable
            className="text-[11px] max-w-[200px] truncate inline-block py-0.5 px-1"
          >
            {val}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "ประเภทกลุ่ม",
      dataIndex: "GroupType",
      key: "GroupType",
      sorter: (a, b) => (a.GroupType ?? "").localeCompare(b.GroupType ?? ""),
      render: (val: string | null) => (
        <Tag
          color={val ? "purple" : "default"}
          className="rounded-lg m-0 px-3 border-purple-100"
        >
          {val ?? "ไม่ระบุ"}
        </Tag>
      ),
    },
    {
      title: "สถานะ Token",
      dataIndex: "LineNotificationAccessToken",
      key: "hasToken",
      align: "center",
      render: (val: string | null) => (
        <Tag
          color={val ? "success" : "error"}
          className="rounded-full px-4 m-0 font-medium"
        >
          {val ? "มี Token" : "ไม่มี Token"}
        </Tag>
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreateDate",
      key: "CreateDate",
      sorter: (a, b) => dayjs(a.CreateDate).unix() - dayjs(b.CreateDate).unix(),
      render: (val: string | null) =>
        val ? (
          <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {dayjs(val).format("DD/MM/YYYY HH:mm")}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "การจัดการ",
      key: "action",
      align: "center",
      width: 200,
      render: (_: unknown, record: TLineGroupItem) => (
        <Space size={12}>
          <Tooltip title="ทดสอบส่ง LINE">
            <Button
              size="small"
              icon={<LineIcon />}
              loading={sendingId === record.LineGroupId}
              disabled={!record.SchoolId}
              onClick={() => handleSendLine(record)}
              className={`rounded-xl border-none flex items-center justify-center h-9 w-9 transition-all active:scale-90 ${
                record.SchoolId
                  ? "bg-[#06C755] hover:bg-[#05b14a] text-white shadow-md shadow-green-100"
                  : ""
              }`}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              className="rounded-xl h-9 w-9 flex items-center justify-center hover:text-blue-500 hover:border-blue-500 transition-all active:scale-90 bg-slate-50 dark:bg-slate-800 border-none"
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDelete(record)}
              className="rounded-xl h-9 w-9 flex items-center justify-center transition-all active:scale-90 shadow-md shadow-red-50 bg-red-50 dark:bg-red-900/20 border-none"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card
        className="shadow-sm border-none rounded-2xl overflow-hidden"
        styles={{ body: { padding: "32px" } }}
      >
        <Flex
          align="center"
          justify="space-between"
          style={{
            marginBottom: "1rem",
          }}
        >
          <Flex align="center" gap={12}>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <UnorderedListOutlined style={{ fontSize: "1.1rem" }} />
            </div>
            <Flex vertical gap={3}>
              <Text strong className="text-base tracking-tight">
                รายชื่อกลุ่ม LINE
              </Text>
              {filterSchoolId ? (
                <Text type="secondary" className="text-xs">
                  กำลังแสดงผลลัพธ์ของโรงเรียน:{" "}
                  <Text strong className="text-blue-500">
                    {filterSchoolId}
                  </Text>
                </Text>
              ) : (
                <Text
                  type="secondary"
                  className="text-[11px] uppercase tracking-widest font-medium"
                >
                  Group Management
                </Text>
              )}
            </Flex>
          </Flex>
          <Space size={16}>
            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                className="rounded-xl h-11 px-6 font-bold bg-[#06C755] hover:bg-[#05b14a] border-none shadow-lg shadow-green-100 transition-all active:scale-95"
                onClick={() => setBatchModalOpen(true)}
              >
                ส่ง LINE ({selectedRowKeys.length})
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-blue-100 dark:shadow-none border-none bg-blue-600 hover:bg-blue-500 transition-all active:scale-95"
            >
              เพิ่มข้อมูล
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => fetchData()}
              className="rounded-xl h-11 w-11 flex items-center justify-center border-slate-200 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95 bg-slate-50 dark:bg-slate-800 border-none"
            />
          </Space>
        </Flex>

        <Table
          rowKey="LineGroupId"
          columns={columns}
          dataSource={items}
          loading={loading}
          rowSelection={{
            type: "checkbox",
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            getCheckboxProps: (record: TLineGroupItem) => ({
              disabled: !record.SchoolId,
            }),
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            onChange: (page) => {
              setSelectedRowKeys([]);
              fetchData(page);
            },
            className: "pt-8",
          }}
          size="middle"
          scroll={{ x: 1000 }}
          className="modern-table"
          locale={{ emptyText: "ไม่พบข้อมูลกลุ่ม LINE ในระบบ" }}
        />

        <BatchSendModal
          open={batchModalOpen}
          selected={selectedItems}
          onClose={() => {
            setBatchModalOpen(false);
            setSelectedRowKeys([]);
          }}
        />
      </Card>
    </motion.div>
  );
};
