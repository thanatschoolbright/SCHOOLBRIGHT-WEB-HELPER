"use client";

import { UnlockOutlined, UnorderedListOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Table from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { LockedCustomer, useCustomerStore } from "../_stores/use-customer-store";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

// ตารางแสดงรายชื่อลูกค้าที่ถูกล็อกบัญชี
export default function CustomerTable() {
  const {
    customers,
    pagination,
    isLoading,
    setFilters,
    fetchCustomers,
    openUnlockConfirm,
    openUnlockAllConfirm,
  } = useCustomerStore();

  const columns: ColumnsType<LockedCustomer> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 60,
      render: (_, __, index) => (pagination.page - 1) * pagination.page_size + index + 1,
    },
    {
      title: "ชื่อ-นามสกุล",
      key: "fullname",
      sorter: (a, b) => (a.sName ?? "").localeCompare(b.sName ?? ""),
      render: (_, r) => (
        <div>
          <Typography.Text strong>
            {r.sName ?? "-"} {r.sLastname ?? ""}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            @{r.username ?? "-"}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "อีเมล / เบอร์โทร",
      key: "contact",
      render: (_, r) => (
        <div>
          <Typography.Text style={{ fontSize: 13 }}>{r.sEmail ?? "-"}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.sPhone ?? "-"}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "โรงเรียน",
      key: "school",
      sorter: (a, b) => (a.school_name ?? "").localeCompare(b.school_name ?? ""),
      render: (_, r) => (
        <div>
          <Typography.Text style={{ fontSize: 13 }}>{r.school_name ?? "-"}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            ID: {r.nCompany}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "ครั้งที่ล้มเหลว",
      dataIndex: "CurrentFailedAttempts",
      key: "attempts",
      width: 120,
      sorter: (a, b) => a.CurrentFailedAttempts - b.CurrentFailedAttempts,
      render: (v) => (
        <Tag color={v >= 5 ? "red" : "orange"} icon={<WarningOutlined />}>
          {v} ครั้ง
        </Tag>
      ),
    },
    {
      title: "ล็อกจนถึง",
      dataIndex: "AccountLockedUntil",
      key: "lockedUntil",
      sorter: (a, b) =>
        dayjs(a.AccountLockedUntil ?? 0).unix() - dayjs(b.AccountLockedUntil ?? 0).unix(),
      render: (v) => {
        if (!v) return <Tag color="success">ปกติ</Tag>;
        const lockTime = dayjs(v).tz("Asia/Bangkok");
        const isExpired = lockTime.isBefore(dayjs());
        return (
          <Tooltip title={lockTime.format("DD/MM/YYYY HH:mm:ss")}>
            <Tag color={isExpired ? "default" : "error"}>
              {isExpired ? "หมดอายุแล้ว" : lockTime.fromNow()}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "ดำเนินการ",
      key: "action",
      width: 110,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<UnlockOutlined />}
          onClick={() => openUnlockConfirm(r.sID)}
        >
          ปลดล็อก
        </Button>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Flex align="center" gap={8}>
          <UnorderedListOutlined style={{ fontSize: "1rem" }} />
          <Typography.Text strong>รายชื่อลูกค้าที่ถูกล็อกบัญชี</Typography.Text>
          <Tag color="red">{pagination.total} รายการ</Tag>
        </Flex>
        <Button
          danger
          icon={<UnlockOutlined />}
          onClick={openUnlockAllConfirm}
          disabled={pagination.total === 0}
        >
          ปลดล็อกทั้งหมด
        </Button>
      </Flex>

      <Table<LockedCustomer>
        columns={columns}
        dataSource={customers}
        rowKey="sID"
        loading={isLoading}
        size="small"
        scroll={{ x: 1000 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.page_size,
          total: pagination.total,
          showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          onChange: (page, pageSize) => {
            setFilters({ page, page_size: pageSize });
            fetchCustomers();
          },
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
      />
    </Card>
  );
}
