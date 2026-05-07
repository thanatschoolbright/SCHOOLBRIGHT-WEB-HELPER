"use client";

import {
  AndroidOutlined,
  AppleOutlined,
  CodeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  GlobalOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  WindowsOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Modal,
  Popover,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import type { ApplicationRecord, VersionRecord } from "@/types/canteen.type";

const ENVIRONMENT_OPTIONS = [
  { label: "ใช้งานจริง (Production)", value: "Production", color: "green" },
  { label: "ทดสอบเบต้า (Beta)", value: "Beta", color: "orange" },
  { label: "กำลังพัฒนา (Development)", value: "Development", color: "blue" },
];

// ✨ แสดง Icon ตามประเภทแพลตฟอร์มของแอปพลิเคชัน
const getPlatformIcon = (platformType: string) => {
  const lowercaseType = platformType?.toLowerCase() ?? "";
  if (lowercaseType.includes("android"))
    return <AndroidOutlined style={{ color: "#3DDC84", fontSize: 18 }} />;
  if (lowercaseType.includes("ios") || lowercaseType.includes("apple"))
    return <AppleOutlined style={{ fontSize: 18 }} />;
  if (lowercaseType.includes("windows"))
    return <WindowsOutlined style={{ color: "#0078D7", fontSize: 18 }} />;
  if (lowercaseType.includes("web"))
    return <GlobalOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
  return <CodeOutlined style={{ fontSize: 18 }} />;
};

// ✨ คืน color ของ Tag ตาม environment
const getEnvironmentTagColor = (environment: string) =>
  ENVIRONMENT_OPTIONS.find((opt) => opt.value === environment)?.color ?? "default";

interface VersionHistoryModalProps {
  open: boolean;
  selectedApplication: ApplicationRecord | null;
  versionData: VersionRecord[];
  versionLoading: boolean;
  schoolOptions: Array<{ label: string; value: string }>;
  onClose: () => void;
  onAddVersion: () => void;
  onEditVersion: (record: VersionRecord) => void;
  onDeleteVersion: (record: VersionRecord) => void;
  onExportHistory: () => Promise<void>;
  onOpenCheckUpdate: () => void;
}

// ✨ Modal แสดงประวัติเวอร์ชันและ action buttons สำหรับแอปพลิเคชันที่เลือก
export const VersionHistoryModal = ({
  open,
  selectedApplication,
  versionData,
  versionLoading,
  schoolOptions,
  onClose,
  onAddVersion,
  onEditVersion,
  onDeleteVersion,
  onExportHistory,
  onOpenCheckUpdate,
}: VersionHistoryModalProps) => {
  const { token } = theme.useToken();

  const columns: ColumnsType<VersionRecord> = [
    {
      title: "ชื่อเวอร์ชัน",
      dataIndex: "version_name",
      fixed: "left",
      width: 180,
      sorter: (a, b) => (a.version_name ?? "").localeCompare(b.version_name ?? ""),
      render: (versionName: string, record) => (
        <Flex vertical gap={4}>
          <Typography.Text strong>{versionName}</Typography.Text>
          <Space size={4} wrap>
            {(record.is_lastest_version === 1 || record.is_lastest_version === true) && (
              <Tag color="green" bordered={false} style={{ fontSize: 10 }}>
                ล่าสุด
              </Tag>
            )}
            {(record.force_update === 1 || record.force_update === true) && (
              <Tag color="red" bordered={false} style={{ fontSize: 10 }}>
                บังคับอัปเดต
              </Tag>
            )}
          </Space>
        </Flex>
      ),
    },
    {
      title: "กลุ่มเป้าหมาย",
      dataIndex: "school_id",
      width: 150,
      sorter: (a, b) => (a.school_id?.length ?? 0) - (b.school_id?.length ?? 0),
      render: (schoolIds: any[]) => {
        if (!schoolIds || schoolIds.length === 0) {
          return <Tag color="default">ทุกโรงเรียน</Tag>;
        }
        const schoolNames = schoolIds
          .map((id) => {
            const school = schoolOptions.find((opt) => opt.value === String(id));
            return school ? school.label : `ID: ${id}`;
          })
          .filter(Boolean);

        return (
          <Popover
            title="รายชื่อโรงเรียนที่ปล่อยให้อัปเดต"
            content={
              <ul style={{ maxHeight: 250, overflowY: "auto", paddingLeft: 20, margin: 0 }}>
                {schoolNames.map((name, idx) => (
                  <li key={idx}>
                    <Typography.Text style={{ fontSize: 12 }}>{name}</Typography.Text>
                  </li>
                ))}
              </ul>
            }
          >
            <Button size="small" icon={<TeamOutlined />}>
              {schoolIds.length} โรงเรียน
            </Button>
          </Popover>
        );
      },
    },
    {
      title: "สภาพแวดล้อม",
      dataIndex: "env",
      width: 120,
      sorter: (a, b) => (a.env ?? "").localeCompare(b.env ?? ""),
      render: (environment: string) => (
        <Tag color={getEnvironmentTagColor(environment)}>{environment}</Tag>
      ),
    },
    {
      title: "วันที่อัปเดต",
      dataIndex: "updated_at",
      width: 160,
      sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
      render: (updatedDate: string) =>
        updatedDate ? dayjs(updatedDate).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "จัดการ",
      align: "center",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => record.url && window.open(record.url, "_blank")}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditVersion(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteVersion(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space size="middle">
          <div
            style={{
              background: token.colorFillSecondary,
              padding: 8,
              borderRadius: 8,
            }}
          >
            {getPlatformIcon(selectedApplication?.app_type ?? "")}
          </div>
          <Flex vertical>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {selectedApplication?.app_name}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ประวัติการปล่อยเวอร์ชัน
            </Typography.Text>
          </Flex>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
      <Flex justify="flex-end" gap="small" style={{ marginBottom: 16 }}>
        <Button
          icon={<FileTextOutlined />}
          onClick={onExportHistory}
          disabled={versionLoading || versionData.length === 0}
        >
          ส่งออกประวัติ (Excel)
        </Button>
        <Button
          icon={<SearchOutlined />}
          onClick={onOpenCheckUpdate}
        >
          จำลองการตรวจสอบอัปเดต
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddVersion}>
          สร้างเวอร์ชันใหม่
        </Button>
      </Flex>

      <Table
        columns={columns}
        dataSource={versionData}
        loading={versionLoading}
        rowKey="version_id"
        size="small"
        scroll={{ x: true }}
      />
    </Modal>
  );
};
