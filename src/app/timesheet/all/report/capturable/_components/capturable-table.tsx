"use client";

import {
  FileExcelOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Flex,
  Popover,
  Progress,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

import { CapturableData } from "../_api/capturable-api";
import { useCapturableStore } from "../_state/use-capturable-store";

const { Text, Title } = Typography;

const defaultCheckedList = [
  "index",
  "project_code",
  "project_name",
  "capturable_percent",
  "uncapturable_percent",
  "hours",
  "hours_percent",
  "actions",
];

const columnOptions = [
  { label: "# ลำดับ", value: "index" },
  { label: "รหัส (Code)", value: "project_code" },
  { label: "ชื่อโครงการ", value: "project_name" },
  { label: "งานสร้างใหม่ (%)", value: "capturable_percent" },
  { label: "งานบำรุงรักษา (%)", value: "uncapturable_percent" },
  { label: "ชั่วโมงรวม", value: "hours" },
  { label: "สัดส่วน (%)", value: "hours_percent" },
  { label: "จัดการ", value: "actions" },
];

export const CapturableTable: React.FC = () => {
  const { token } = theme.useToken();
  const { data, searchText, loading, openDetails, exportLoading, setExportModalVisible, setCountdown, setIsCounting } =
    useCapturableStore();
  const [visibleColumns, setVisibleColumns] = useState<any[]>(defaultCheckedList);

  const filteredTableData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter(
      (item) =>
        item.project_name.toLowerCase().includes(lower) ||
        item.project_code.toLowerCase().includes(lower),
    );
  }, [data, searchText]);

  const allColumns: ColumnsType<CapturableData> = useMemo(
    () => [
      {
        title: "#",
        key: "index",
        align: "center",
        width: 60,
        render: (_: any, __: any, index: number) => (
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            {index + 1}
          </Text>
        ),
      },
      {
        title: "รหัส",
        dataIndex: "project_code",
        key: "project_code",
        width: 100,
        align: "center",
        sorter: (a, b) => a.project_code.localeCompare(b.project_code),
        render: (code: string) => (
          <Tag bordered={false} color="blue" style={{ fontWeight: 600 }}>
            {code}
          </Tag>
        ),
      },
      {
        title: "ชื่อโครงการ",
        dataIndex: "project_name",
        key: "project_name",
        width: 280,
        sorter: (a, b) => a.project_name.localeCompare(b.project_name),
        render: (name: string, record: CapturableData) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontWeight: 600 }}>
              {name}
            </Text>
            {record.is_deleted && (
              <Tag
                color="error"
                bordered={false}
                style={{ fontSize: 10, lineHeight: "14px", marginTop: 2 }}
              >
                ถูกลบ
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: (
          <Space size={4}>
            งานสร้างใหม่ (%)
            <Tooltip title="สัดส่วนงบลงทุน (Capitalization ทรัพย์สิน)">
              <InfoCircleOutlined style={{ fontSize: 12, cursor: "help" }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "capturable_percent",
        key: "capturable_percent",
        width: 170,
        sorter: (a, b) => a.capturable_percent - b.capturable_percent,
        render: (value: number, record: CapturableData) => (
          <Flex vertical gap={2}>
            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 11 }}>
                Capitalization ทรัพย์สิน
              </Text>
              <Text strong style={{ color: token.colorSuccess, fontSize: 12 }}>
                {value.toFixed(1)}%
              </Text>
            </Flex>
            <Text strong style={{ fontSize: 13 }}>
              {record.capturable_hours.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              ชม.
            </Text>
            <Progress
              percent={value}
              showInfo={false}
              strokeColor={token.colorSuccess}
              size="small"
              style={{ margin: 0 }}
            />
          </Flex>
        ),
      },
      {
        title: (
          <Space size={4}>
            ค่าใช้จ่าย (%)
            <Tooltip title="สัดส่วนค่าใช้จ่าย (Expense รายจ่าย)">
              <InfoCircleOutlined style={{ fontSize: 12, cursor: "help" }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "uncapturable_percent",
        key: "uncapturable_percent",
        width: 170,
        sorter: (a, b) => a.uncapturable_percent - b.uncapturable_percent,
        render: (value: number, record: CapturableData) => (
          <Flex vertical gap={2}>
            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 11 }}>
                Expense รายจ่าย
              </Text>
              <Text strong style={{ color: token.colorError, fontSize: 12 }}>
                {value.toFixed(1)}%
              </Text>
            </Flex>
            <Text strong style={{ fontSize: 13 }}>
              {record.uncapturable_hours.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              ชม.
            </Text>
            <Progress
              percent={value}
              showInfo={false}
              strokeColor={token.colorError}
              size="small"
              style={{ margin: 0 }}
            />
          </Flex>
        ),
      },
      {
        title: "ชั่วโมงรวม",
        dataIndex: "hours",
        key: "hours",
        width: 120,
        align: "right",
        sorter: (a, b) => a.hours - b.hours,
        render: (value: number) => (
          <Text strong style={{ color: token.colorInfoText }}>
            {value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        ),
      },
      {
        title: (
          <Space size={4}>
            สัดส่วน
            <Tooltip title="สัดส่วนชั่วโมงของโครงการนี้เทียบกับชั่วโมงรวมทั้งหมดที่วิเคราะห์ในหน้านี้">
              <InfoCircleOutlined style={{ fontSize: 12, cursor: "help" }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "hours_percent",
        key: "hours_percent",
        width: 100,
        align: "center",
        sorter: (a, b) => a.hours_percent - b.hours_percent,
        render: (value: number) => (
          <Tag bordered={false} color="cyan" style={{ fontWeight: 600 }}>
            {value.toFixed(2)}%
          </Tag>
        ),
      },
      {
        title: "จัดการ",
        key: "actions",
        width: 120,
        align: "center",
        fixed: "right",
        render: (_: any, record: CapturableData) => (
          <Button
            size="small"
            type="primary"
            ghost
            icon={<InfoCircleOutlined />}
            onClick={() => openDetails(record)}
            style={{ fontWeight: 600 }}
          >
            รายละเอียด
          </Button>
        ),
      },
    ],
    [token, openDetails],
  );

  const filteredColumns = useMemo(
    () => allColumns.filter((col) => visibleColumns.includes(col.key as string)),
    [allColumns, visibleColumns],
  );

  const columnSelectorContent = (
    <Flex vertical gap={8} style={{ width: 240, padding: 12 }}>
      <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
        เลือกคอลัมน์แสดงผล
      </Title>
      <Checkbox.Group
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
        options={columnOptions}
        value={visibleColumns}
        onChange={(checkedValues) => setVisibleColumns(checkedValues)}
      />
    </Flex>
  );

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Space size={12}>
          <UnorderedListOutlined
            style={{ color: token.colorPrimary, fontSize: 16 }}
          />
          <Title level={4} style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
            รายการโครงการ
          </Title>
          <Popover
            content={columnSelectorContent}
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              size="small"
              icon={<SettingOutlined />}
              type="text"
              style={{ color: token.colorTextSecondary }}
            >
              ตั้งค่าคอลัมน์
            </Button>
          </Popover>
        </Space>

        <Badge count="ใหม่" color="red" offset={[5, -5]}>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => {
              setExportModalVisible(true);
              setCountdown(3);
              setIsCounting(false);
            }}
            loading={exportLoading}
            disabled={data.length === 0}
            style={{
              fontWeight: 600,
              ...(data.length > 0 && {
                color: token.colorSuccess,
                borderColor: token.colorSuccessBorder,
                background: token.colorSuccessBg,
              }),
            }}
          >
            ดาวน์โหลด Excel
          </Button>
        </Badge>
      </Flex>

      <Table<CapturableData>
        columns={filteredColumns}
        dataSource={filteredTableData}
        rowKey="project_id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `ทั้งหมด ${total} รายการ`,
        }}
        scroll={{ x: 1200 }}
        style={{ marginTop: 16 }}
        summary={(pageData) => {
          if (pageData.length === 0) return undefined;
          const hoursIdx = filteredColumns.findIndex(
            (c) => (c as any).dataIndex === "hours" || c.key === "hours",
          );
          if (hoursIdx === -1) return undefined;
          const total = pageData.reduce((acc, curr) => acc + curr.hours, 0);
          return (
            <Table.Summary.Row
              style={{
                backgroundColor: token.colorFillQuaternary,
                fontWeight: 600,
              }}
            >
              <Table.Summary.Cell index={0} colSpan={hoursIdx} align="right">
                <Text
                  type="secondary"
                  style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 600 }}
                >
                  รวมเฉพาะหน้านี้
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ color: token.colorInfoText }}>
                  {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          );
        }}
      />
    </Card>
  );
};
