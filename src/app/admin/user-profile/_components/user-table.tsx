"use client";

import {
  ApartmentOutlined,
  CalendarOutlined,
  ControlOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  IdcardOutlined,
  LinkOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UnlockOutlined,
  UnorderedListOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Flex,
  Input,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo } from "react";
import { toast } from "sonner";

import { UserProfile } from "@stores/type";
import { useUserProfileStore } from "../_stores/user-profile-store";

// คำนวณอายุงานจากวันเริ่มต้น-สิ้นสุด
const calculateDuration = (start: unknown, endInput: unknown = null) => {
  if (!start) return "-";
  const s = dayjs(start as string).startOf("day");
  if (!s.isValid()) return "-";
  const e =
    endInput && endInput !== ""
      ? dayjs(endInput as string).startOf("day")
      : dayjs().startOf("day");
  if (!e.isValid()) return "-";
  if (s.isAfter(e)) return "0 วัน";
  const years = e.diff(s, "year");
  const tempDate = s.add(years, "year");
  const months = e.diff(tempDate, "month");
  const tempDate2 = tempDate.add(months, "month");
  const days = e.diff(tempDate2, "day");
  const result = [];
  if (years > 0) result.push(`${years} ปี`);
  if (months > 0) result.push(`${months} เดือน`);
  if (days > 0) result.push(`${days} วัน`);
  return result.join(" ") || "0 วัน";
};

// แปลงประเภทการจ้างงานเป็น label + color
const getEmpType = (type?: string) => {
  switch (type) {
    case "FULL_TIME":
      return { color: "green", label: "พนักงานประจำ" };
    case "PART_TIME":
      return { color: "cyan", label: "พาร์ทไทม์" };
    case "CONTRACT":
      return { color: "gold", label: "สัญญาจ้าง" };
    case "INTERN":
      return { color: "purple", label: "นักศึกษาฝึกงาน" };
    default:
      return { color: "gray", label: "ไม่ระบุ" };
  }
};

// คัดลอกข้อความไปยังคลิปบอร์ดพร้อม fallback สำหรับ browser ที่ไม่รองรับโดยตรง
const copyTextToClipboard = async (valueToCopy: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(valueToCopy);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard not available");
  }

  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.value = valueToCopy;
  temporaryTextArea.setAttribute("readonly", "true");
  temporaryTextArea.style.position = "absolute";
  temporaryTextArea.style.left = "-9999px";
  document.body.appendChild(temporaryTextArea);
  temporaryTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(temporaryTextArea);
};

interface CopyableValueProps {
  value: string;
  textType?: "secondary";
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// แสดงข้อความพร้อมปุ่มคัดลอกที่ปรากฏเมื่อ hover เพื่อใช้งานได้ทันทีจากตาราง
const CopyableValue = ({
  value,
  textType,
  icon,
  className,
  style,
}: CopyableValueProps) => {
  const handleCopyValue = async () => {
    if (!value || value === "-") return;

    try {
      await copyTextToClipboard(value);
      toast.success("คัดลอกข้อมูลเรียบร้อยแล้ว");
    } catch {
      toast.error("ไม่สามารถคัดลอกข้อมูลได้");
    }
  };

  return (
    <Flex align="center" gap={4} className="group w-fit max-w-full">
      <Typography.Text
        type={textType}
        className={className}
        style={{ ...style, margin: 0 }}
      >
        <Flex align="center" gap={4} wrap="wrap">
          {icon}
          <span>{value || "-"}</span>
        </Flex>
      </Typography.Text>
      {value && value !== "-" ? (
        <Tooltip title="คัดลอกข้อมูล">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopyValue}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: "inherit" }}
          />
        </Tooltip>
      ) : null}
    </Flex>
  );
};

export const UserTable = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const {
    isLoading,
    exportLoading,
    filters,
    pagination,
    selectedRowKeys,
    setPagination,
    setSelectedRowKeys,
    openDetailModal,
    openDeleteModal,
    unlockAccount,
    resetPassword,
    openTrackingModal,
    setBulkMode,
    bulkResetPassword,
    bulkResetPasswordToPhone,
    exportUserExcel,
    sendWelcomeEmail,
    copyLoginInfo,
    users,
  } = useUserProfileStore();

  // กรองข้อมูลจาก Raw State ตาม filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const s = filters.search.toLowerCase();
      const matchSearch =
        u.firstname_th?.toLowerCase().includes(s) ||
        u.lastname_th?.toLowerCase().includes(s) ||
        u.firstname_en?.toLowerCase().includes(s) ||
        u.lastname_en?.toLowerCase().includes(s) ||
        u.employee_code?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.nickname?.toLowerCase().includes(s);

      const matchPosition =
        !filters.position || u.position_id === filters.position;
      const matchStatus = !filters.status
        ? true
        : filters.status === "BLOCKED"
        ? (u.failed_login_attempts ?? 0) >= 5
        : u.status === filters.status;
      const matchDept =
        !filters.department || u.department_id === filters.department;

      return matchSearch && matchPosition && matchStatus && matchDept;
    });
  }, [users, filters]);

  // Column search dropdown factory
  const getColumnSearchProps = (
    dataIndex: string | string[],
    title: string,
    customOnFilter?: (value: unknown, record: UserProfile) => boolean,
  ) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: {
      setSelectedKeys: (keys: React.Key[]) => void;
      selectedKeys: React.Key[];
      confirm: () => void;
      clearFilters?: () => void;
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`ค้นหา ${title}`}
          value={selectedKeys[0] as string}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            ค้นหา
          </Button>
          <Button
            onClick={() => {
              clearFilters?.();
              confirm();
            }}
            size="small"
            style={{ width: 90 }}
          >
            ล้าง
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined
        style={{ color: filtered ? token.colorPrimary : undefined }}
      />
    ),
    onFilter: (value: unknown, record: UserProfile) => {
      if (customOnFilter) return customOnFilter(value, record);
      const getNestedValue = (
        obj: unknown,
        path: string | string[],
      ): unknown => {
        if (Array.isArray(path))
          return path.reduce(
            (acc: unknown, key) => (acc as Record<string, unknown>)?.[key],
            obj,
          );
        return (obj as Record<string, unknown>)?.[path];
      };
      const val = getNestedValue(record, dataIndex);
      return val
        ? val
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase())
        : false;
    },
  });

  const columns: ColumnsType<UserProfile> = [
    {
      title: "รหัสพนักงาน",
      key: "codes",
      width: 150,
      sorter: (a, b) =>
        (a.employee_code || "").localeCompare(b.employee_code || ""),
      ...getColumnSearchProps(
        ["employee_code"],
        "รหัสพนักงานหรือเลขพนักงาน",
        (value, record) =>
          (record.employee_code || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record.admin_id?.toString() || "").includes(value as string),
      ),
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>
            รหัส: {r.employee_code || "-"}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            <LinkOutlined style={{ marginRight: 4 }} />
            รหัสอ้างอิง: {r.admin_id || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "ข้อมูลพนักงาน",
      key: "fullname",
      width: 300,
      sorter: (a, b) =>
        (a.firstname_th || "").localeCompare(b.firstname_th || ""),
      ...getColumnSearchProps(
        ["firstname_th"],
        "ชื่อ อีเมล หรือเบอร์โทรศัพท์",
        (value, record) =>
          (record.firstname_th || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record.lastname_th || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record.nickname || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record.email || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record.phone || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()),
      ),
      render: (_, r) => (
        <div className="flex items-start gap-3 py-1">
          <Avatar
            src={r.profile_image_path}
            icon={<UserOutlined />}
            size={48}
            className="shadow-sm"
            style={{ border: `2px solid ${token.colorBgContainer}` }}
          />
          <div className="flex flex-col">
            <Space size={4} align="center">
              <CopyableValue
                value={
                  `${r.firstname_th || ""} ${r.lastname_th || ""}`.trim() || "-"
                }
                style={{
                  color: token.colorText,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              />
              {r.nickname && (
                <Tag
                  color="warning"
                  className="text-[10px] m-0 px-1 leading-4 h-4 border-none rounded-full"
                >
                  {r.nickname}
                </Tag>
              )}
            </Space>
            <CopyableValue
              value={r.email || "-"}
              textType="secondary"
              className="text-[11px] mt-0.5"
              icon={<MailOutlined style={{ fontSize: 10 }} />}
            />
            <CopyableValue
              value={r.phone || "-"}
              textType="secondary"
              className="text-[11px]"
              icon={<PhoneOutlined style={{ fontSize: 10 }} />}
            />
            {!r.phone && (
              <div className="mt-1">
                <Badge
                  status="warning"
                  text={
                    <Typography.Text
                      type="warning"
                      style={{ fontSize: 10, display: "block" }}
                    >
                      ยังไม่ตั้งรหัสผ่าน
                    </Typography.Text>
                  }
                />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "การทำงาน",
      key: "work_info",
      width: 250,
      sorter: (a, b) =>
        (a.position_ref?.name_th || "").localeCompare(
          b.position_ref?.name_th || "",
        ),
      ...getColumnSearchProps(
        ["position_ref", "name_th"],
        "ตำแหน่งหรือแผนก",
        (value, record) =>
          (record.position_ref?.name_th || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record.department?.name_th || "")
            .toLowerCase()
            .includes((value as string).toLowerCase()),
      ),
      render: (_, record) => {
        const emp = getEmpType(record.employment_type);
        return (
          <div className="flex flex-col gap-1">
            <Typography.Text style={{ fontWeight: 600 }} className="text-sm">
              {record.position_ref?.name_th || "ไม่มีตำแหน่ง"}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
              }}
            >
              <ApartmentOutlined />
              {record.department?.name_th || "ไม่มีแผนก"}
            </Typography.Text>
            <div className="flex flex-wrap gap-1 mt-1">
              <Tag
                color={emp.color}
                className="text-[10px] m-0 border-none rounded-full h-5 leading-5"
              >
                {emp.label}
              </Tag>
              {record.joined_date && (
                <Tag
                  icon={<CalendarOutlined />}
                  className="text-[10px] m-0 border-none rounded-full h-5 leading-5"
                  style={{ backgroundColor: token.colorFillAlter }}
                >
                  เริ่ม {dayjs(record.joined_date).format("DD MMM YY")}
                </Tag>
              )}
            </div>
            {(record.joined_date || record.birth_date) && (
              <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-dashed border-gray-100 dark:border-gray-800">
                {record.joined_date && (
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    อายุงาน:{" "}
                    <span className="text-blue-500 font-medium">
                      {calculateDuration(
                        record.joined_date,
                        record.resigned_date,
                      )}
                    </span>
                  </Typography.Text>
                )}
                {record.birth_date && (
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                    <SolutionOutlined style={{ marginRight: 4 }} />
                    อายุพนักงาน:{" "}
                    <span className="text-orange-500 font-medium">
                      {calculateDuration(record.birth_date)}
                    </span>
                  </Typography.Text>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "สถานะบัญชี",
      key: "account_status",
      width: 180,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      ...getColumnSearchProps(
        ["status"],
        "สถานะหรือสิทธิ์",
        (value, record) => {
          const isBlocked = (record.failed_login_attempts ?? 0) >= 5;
          const statusStr = isBlocked
            ? "โดนระงับชั่วคราว"
            : record.status === "ACTIVE"
            ? "ออนไลน์และเป็นปกติ"
            : "ระงับการใช้งาน";
          return (
            statusStr.toLowerCase().includes((value as string).toLowerCase()) ||
            (record.role?.role_name || "")
              .toLowerCase()
              .includes((value as string).toLowerCase())
          );
        },
      ),
      render: (_, r) => {
        const isBlocked = (r.failed_login_attempts ?? 0) >= 5;
        const statusText = isBlocked
          ? "โดนระงับชั่วคราว"
          : r.status === "ACTIVE"
          ? "ออนไลน์และเป็นปกติ"
          : "ระงับการใช้งาน";
        const statusType = isBlocked
          ? "error"
          : r.status === "ACTIVE"
          ? "success"
          : "default";
        return (
          <div className="flex flex-col gap-1">
            <Badge
              status={statusType as "error" | "success" | "default"}
              text={
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      statusType === "success"
                        ? token.colorSuccess
                        : statusType === "error"
                        ? token.colorError
                        : token.colorTextDescription,
                  }}
                >
                  {statusText}
                </span>
              }
            />
            {isBlocked && (
              <Tag
                color="error"
                className="m-0 text-[9px] py-0 px-1 border-none rounded"
                icon={<WarningOutlined className="text-[9px]" />}
              >
                เข้าผิด {r.failed_login_attempts} ครั้ง
              </Tag>
            )}
            <div className="mt-1">
              <Typography.Text type="secondary" className="text-[10px] block">
                สิทธิ์: {r.role?.role_name || "ผู้ใช้งาน"}
              </Typography.Text>
              {r.last_login && (
                <Typography.Text type="secondary" className="text-[10px]">
                  ล่าสุด: {dayjs(r.last_login).format("DD/MM/YY HH:mm")}
                </Typography.Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 150,
      sorter: () => 0,
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => openDetailModal(r)}
            />
          </Tooltip>
          {((r as unknown as Record<string, number>).failed_login_attempts ??
            0) >= 5 && (
            <Tooltip title="ปลดล็อกบัญชี">
              <Button
                type="text"
                size="small"
                icon={<UnlockOutlined style={{ color: token.colorSuccess }} />}
                onClick={() => unlockAccount(r)}
              />
            </Tooltip>
          )}
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorWarning }} />}
              onClick={() => router.push(`/admin/user-profile/${r.id}`)}
            />
          </Tooltip>
          <Tooltip title="คัดลอกข้อมูลเข้าสู่ระบบ">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorTextSecondary }} />}
              onClick={() => copyLoginInfo(r)}
            />
          </Tooltip>
          <Tooltip title={r.email ? "ส่งอีเมลข้อมูลเข้าสู่ระบบ" : "ไม่มีอีเมล"}>
            <Button
              type="text"
              size="small"
              icon={<SendOutlined style={{ color: r.email ? token.colorInfo : token.colorTextDisabled }} />}
              onClick={() => sendWelcomeEmail(r)}
              disabled={!r.email}
            />
          </Tooltip>
          <Tooltip title="ตั้งค่าเริ่มต้นรหัสผ่าน (ใช้เบอร์มือถือ)">
            <Button
              type="text"
              size="small"
              icon={<ControlOutlined style={{ color: token.colorSuccess }} />}
              onClick={() => openTrackingModal([r])}
              disabled={
                !(r.phone || (r as unknown as Record<string, unknown>).tel)
              }
            />
          </Tooltip>
          <Tooltip title="รีเซ็ตรหัสผ่าน (สุ่มชุดใหม่)">
            <Button
              type="text"
              size="small"
              icon={<LockOutlined style={{ color: token.colorInfo }} />}
              onClick={() => resetPassword(r)}
              disabled={!r.email}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => openDeleteModal(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <Flex align="center" gap={12}>
          <UnorderedListOutlined
            style={{ color: token.colorPrimary, fontSize: "1rem" }}
          />
          <Typography.Title
            level={4}
            style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}
          >
            รายชื่อพนักงานทั้งหมด
            <Typography.Text
              type="secondary"
              style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}
            >
              ({filteredUsers.length} รายการ)
            </Typography.Text>
          </Typography.Title>
          {selectedRowKeys.length > 0 && (
            <Tag
              color="processing"
              style={{ borderRadius: 20, padding: "2px 12px" }}
            >
              เลือกอยู่ {selectedRowKeys.length} รายการ
            </Tag>
          )}
        </Flex>

        <Space size={12}>
          {selectedRowKeys.length > 0 && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "reset-to-phone",
                    label: "ใช้เบอร์มือถือเป็นรหัสผ่าน",
                    icon: (
                      <ControlOutlined style={{ color: token.colorSuccess }} />
                    ),
                    onClick: bulkResetPasswordToPhone,
                  },
                  {
                    key: "bulk-position",
                    label: "ปรับตำแหน่ง",
                    icon: <ApartmentOutlined />,
                    onClick: () => setBulkMode("position"),
                  },
                  {
                    key: "bulk-department",
                    label: "ปรับแผนก",
                    icon: <TeamOutlined />,
                    onClick: () => setBulkMode("department"),
                  },
                  {
                    key: "bulk-role",
                    label: "ปรับสิทธิ์",
                    icon: <SafetyCertificateOutlined />,
                    onClick: () => setBulkMode("role"),
                  },
                  {
                    key: "bulk-employment-type",
                    label: "จัดการประเภทการจ้างงาน",
                    icon: <IdcardOutlined />,
                    onClick: () => setBulkMode("employment-type"),
                  },
                  { type: "divider" },
                  {
                    key: "reset-password",
                    label: "รีเซ็ตรหัสผ่านใหม่",
                    icon: <LockOutlined />,
                    danger: true,
                    onClick: bulkResetPassword,
                  },
                ],
              }}
            >
              <Button
                type="primary"
                ghost
                icon={<SettingOutlined />}
                shape="round"
              >
                จัดการข้อมูลแบบกลุ่ม
              </Button>
            </Dropdown>
          )}
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportUserExcel}
            loading={exportLoading}
            shape="round"
            style={{
              backgroundColor: "#217346",
              color: "#fff",
              borderColor: "#217346",
            }}
          >
            ส่งออก Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            shape="round"
            onClick={() => router.push("/admin/user-profile/create")}
          >
            เพิ่มพนักงาน
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={isLoading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: (page, pageSize) =>
            setPagination({ current: page, pageSize }),
          showTotal: (total, range) =>
            `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} รายการ`,
        }}
        scroll={{ x: 1200 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />
    </Card>
  );
};
