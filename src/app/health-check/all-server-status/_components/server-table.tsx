import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  GlobalOutlined,
  HistoryOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
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
import dayjs from "dayjs";
import "dayjs/locale/th";
import CustomParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React from "react";
import {
  ServerStatus,
  useServerStatusStore,
} from "../_state/server-status.state";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(CustomParseFormat);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

dayjs.extend(relativeTime);
dayjs.locale("th");

interface ServerTableProps {
  data: ServerStatus[];
  onViewDetails: (server: ServerStatus) => void;
  onEditDescription: (server: ServerStatus) => void;
}

/**
 * ตารางแสดงรายการเซิร์ฟเวอร์ (Server Table)
 * ออกแบบตามมาตรฐาน Modular UI พร้อมการตกแต่งที่ทันสมัยและสมดุล
 */
const ServerTable: React.FC<ServerTableProps> = ({
  data,
  onViewDetails,
  onEditDescription,
}) => {
  const { token } = theme.useToken();
  const { isLoading } = useServerStatusStore();

  const columns = [
    {
      title: "เซิร์ฟเวอร์ และ ระบบงาน",
      key: "name",
      render: (_: any, record: ServerStatus) => (
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background:
                record.status === "Online"
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${
                record.status === "Online"
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(239, 68, 68, 0.2)"
              }`,
            }}
          >
            <GlobalOutlined
              style={{
                color: record.status === "Online" ? "#22c55e" : "#ef4444",
                fontSize: 16,
              }}
            />
          </div>
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ fontSize: 14, fontWeight: 600 }}>
              {record.server_name_th || record.server_name || "-"}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AntLink copyable={{ text: record.endpoint }}>
                {record.endpoint || "-"}
              </AntLink>
            </Typography.Text>
          </Space>
        </Flex>
      ),
      sorter: (a: ServerStatus, b: ServerStatus) =>
        (a.server_name_th || a.server_name || "").localeCompare(
          b.server_name_th || b.server_name || "",
        ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 140,
      render: (_: any, record: ServerStatus) => {
        const isOnline = record.status === "Online";
        return (
          <Badge
            status={isOnline ? "processing" : "error"}
            text={
              <Tag
                color={isOnline ? "success" : "error"}
                icon={
                  isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                }
                style={{
                  borderRadius: 20,
                  padding: "2px 12px",
                  border: "none",
                  fontWeight: 500,
                }}
              >
                {isOnline ? "Online" : "Offline"}
              </Tag>
            }
          />
        );
      },
      sorter: (a: ServerStatus, b: ServerStatus) =>
        a.status.localeCompare(b.status),
    },
    {
      title: "การตอบสนอง",
      dataIndex: "response_time",
      key: "response_time",
      width: 160,
      render: (time: number) => {
        const color = time < 1 ? "#22c55e" : time < 2 ? "#eab308" : "#ef4444";
        const bg =
          time < 1
            ? "rgba(34, 197, 94, 0.05)"
            : time < 2
            ? "rgba(234, 179, 8, 0.05)"
            : "rgba(239, 68, 68, 0.05)";
        return (
          <Flex
            align="center"
            gap={8}
            style={{
              background: bg,
              padding: "4px 10px",
              borderRadius: 8,
              width: "fit-content",
            }}
          >
            <ClockCircleOutlined style={{ color, fontSize: 12 }} />
            <Typography.Text style={{ color, fontWeight: 700, fontSize: 13 }}>
              {time.toFixed(3)}{" "}
              <small style={{ fontWeight: 400, opacity: 0.8 }}>ms</small>
            </Typography.Text>
          </Flex>
        );
      },
      sorter: (a: ServerStatus, b: ServerStatus) =>
        (a.response_time || 0) - (b.response_time || 0),
    },
    {
      title: "ตรวจสอบล่าสุด",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 200,
      render: (ts: string) => {
        // ✨ จัดการเรื่องรูปแบบวันที่ (พยายาม parse แบบ DD/MM/YYYY ก่อน ถ้าไม่ได้ให้ตกกลับไป default)
        // และจัดการเรื่องปี พ.ศ. (BE) เป็น ค.ศ. (AD)
        let date = dayjs(ts, "DD/MM/YYYY HH:mm:ss");
        if (!date.isValid()) {
          date = dayjs(ts);
        }

        if (date.year() > 2500) {
          date = date.subtract(543, "year");
        }

        return (
          <Tooltip title={date.tz().format("DD/MM/YYYY HH:mm:ss")}>
            <Space size={6}>
              <HistoryOutlined
                style={{ fontSize: 13, color: token.colorTextDescription }}
              />
              <Typography.Text style={{ fontSize: 13 }}>
                {date.tz().fromNow()}
              </Typography.Text>
            </Space>
          </Tooltip>
        );
      },
      sorter: (a: ServerStatus, b: ServerStatus) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "ดำเนินการ",
      key: "actions",
      align: "right" as const,
      width: 140,
      render: (_: any, record: ServerStatus) => (
        <Space>
          <Tooltip title="แก้ไขหมายเหตุ">
            <Button
              type="text"
              shape="circle"
              icon={
                <EditOutlined style={{ color: token.colorTextDescription }} />
              }
              onClick={() => onEditDescription(record)}
            />
          </Tooltip>
          <Button
            size="middle"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record)}
            style={{ borderRadius: 8 }}
          >
            ดูรายละเอียด
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid rgba(128,128,128,0.15)`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      }}
      title={
        <Flex align="center" gap={12} style={{ padding: "8px 0" }}>
          <div
            style={{
              background: token.colorPrimary,
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 6px ${token.colorPrimary}40`,
            }}
          >
            <UnorderedListOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Space direction="vertical" size={0}>
            <Typography.Text style={{ fontSize: 16, fontWeight: 700 }}>
              รายการเซิร์ฟเวอร์
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              ตรวจสอบสถานะการทำงานและความเร็วของระบบทั้งหมด
            </Typography.Text>
          </Space>
        </Flex>
      }
      extra={
        <Typography.Text
          type="secondary"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          ทั้งหมด {data.length.toLocaleString()} เครื่อง
        </Typography.Text>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={isLoading}
        rowKey={(record) => `${record.server_name}-${record.timestamp}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          style: { padding: "0px" },
        }}
        style={{
          padding: "1rem",
        }}
        size="middle"
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};

const AntLink = Typography.Link;

export default ServerTable;
