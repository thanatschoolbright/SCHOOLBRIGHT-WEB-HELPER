"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { CallAPI as GET_HEARTBEATS } from "@/stores/actions/health-check/heartbeats/action";
import { ResponseHeartbeats } from "@/stores/type";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";

export type ApiTableData = ResponseHeartbeats["data"]["data"][number];

type SearchableColumnKey = "JobName" | "Description" | "Remarks" | "Status";

type TableColumn = ColumnType<ApiTableData> & {
  key: keyof ApiTableData | string;
};

const formatInterval = (minutes: number) => {
  const totalMinutes = Number(minutes) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0 && remainingMinutes === 0) {
    return "0 นาที";
  }

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ชั่วโมง`);
  }

  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} นาที`);
  }

  return parts.join(" ");
};

const formatTimestamp = (value: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const heartbeatState = useAppSelector((state) => state.heartbeatReducer);

  const [form] = Form.useForm<{ description: string }>();
  const [editingRow, setEditingRow] = useState<ApiTableData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const isLoading = Boolean(heartbeatState.loading);

  const dataSource = useMemo(() => {
    const raw = heartbeatState?.response?.data?.data;
    return Array.isArray(raw) ? (raw as ApiTableData[]) : [];
  }, [heartbeatState?.response?.data?.data]);

  const refreshHeartbeats = useCallback(async () => {
    try {
      await dispatch(GET_HEARTBEATS()).unwrap();
      toast.success("รีเฟรชสำเร็จ", {
        duration: 3000,
      });
    } catch (error: any) {
      toast.error("รีเฟรชล้มเหลว", {
        description: error?.message ?? "Unexpected error",
        duration: 3000,
      });
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(GET_HEARTBEATS());
  }, [dispatch]);

  const closeEditModal = useCallback(() => {
    setEditingRow(null);
    form.resetFields();
  }, [form]);

  const openEditModal = useCallback(
    (record: ApiTableData) => {
      setEditingRow(record);
      form.setFieldsValue({ description: record.Description ?? "" });
    },
    [form]
  );

  const handleUpdateDescription = useCallback(async () => {
    if (!editingRow) {
      return;
    }

    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      const response = await fetch(
        `/api/v1/health-check/server/heartbeats/update/${editingRow.ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Description: values.description }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update description");
      }

      toast.success("อัปเดตคำอธิบายสำเร็จ", {
        duration: 3000,
      });

      closeEditModal();
      await dispatch(GET_HEARTBEATS());
    } catch (error: any) {
      toast.error("อัปเดตคำอธิบายล้มเหลว", {
        description: error?.message ?? "Unexpected error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [closeEditModal, dispatch, editingRow, form]);

  const getColumnSearchProps = useCallback(
    (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const value = (selectedKeys[0] as string | undefined) ?? "";

        return (
          <div
            style={{ padding: 12 }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node;
              }}
              placeholder={`ค้นหา ${title}`}
              value={value}
              onChange={(event) => {
                const { value: inputValue } = event.target;
                setSelectedKeys(inputValue ? [inputValue] : []);
              }}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
              >
                ค้นหา
              </Button>
              <Button
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
                size="small"
              >
                รีเซ็ต
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record: ApiTableData) => {
        const raw = record[dataIndex as keyof ApiTableData];
        if (raw === undefined || raw === null) {
          return false;
        }
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible) {
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
          }
        },
      },
    }),
    []
  );

  const columns = useMemo<ColumnsType<ApiTableData>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        width: 80,
        align: "center",
        render: (_value, _record, index) => (
          <Typography.Text strong>{index + 1}</Typography.Text>
        ),
      },
      {
        title: "ชื่อของบอท",
        dataIndex: "JobName",
        render: (value: string) => (
          <Typography.Text copyable strong type="secondary">
            {value}
          </Typography.Text>
        ),
        sorter: (a, b) => a.JobName.localeCompare(b.JobName),
        width: 280,
        ...getColumnSearchProps("JobName", "ชื่อของบอท"),
      },
      {
        title: "รายละเอียด",
        dataIndex: "Description",
        render: (_value, record) => {
          const text = record.Description ?? "โปรดกรอกการทำงานของบอท";
          return (
            <Space size={6}>
              <Tooltip title={text.length > 50 ? text : undefined}>
                <Typography.Paragraph
                  ellipsis={{ rows: 2, expandable: true }}
                  style={{ margin: 0 }}
                >
                  {text}
                </Typography.Paragraph>
              </Tooltip>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Space>
          );
        },
        ...getColumnSearchProps("Description", "รายละเอียด"),
      },
      {
        title: "หมายเหตุ",
        dataIndex: "Remarks",
        render: (value: string | null) => {
          if (!value) return "-";
          const color = value === "Always Running" ? "green" : "blue";
          return <Tag color={color}>{value}</Tag>;
        },
        ...getColumnSearchProps("Remarks", "หมายเหตุ"),
      },
      {
        title: "ทำงานทุก (ชั่วโมง/นาที)",
        dataIndex: "Interval",
        key: "Interval",
        align: "center",
        width: 220,
        render: (value: number) => {
          let color = "blue";
          if (value <= 5) {
            color = "red";
          } else if (value <= 15) {
            color = "orange";
          }
          return (
            <Tag color={color} icon={<ReloadOutlined />}>
              {formatInterval(value)}
            </Tag>
          );
        },
        sorter: (a, b) => a.Interval - b.Interval,
      },
      {
        title: "สถานะ",
        dataIndex: "Status",
        render: (status: string) => {
          const isOnline = status === "Online";
          return (
            <Tag
              color={isOnline ? "green" : "red"}
              icon={
                isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />
              }
            >
              {isOnline ? "Online" : "Offline"}
            </Tag>
          );
        },
        ...getColumnSearchProps("Status", "สถานะ"),
      },
      {
        title: "บอททำงานล่าสุดเมื่อเวลา",
        dataIndex: "LastUpdatedTime",
        key: "LastUpdatedTime",
        render: (value: string) => (
          <Tooltip title={value}>
            <Space>
              <ClockCircleOutlined />
              {formatTimestamp(value)}
            </Space>
          </Tooltip>
        ),
        sorter: (a, b) =>
          new Date(a.LastUpdatedTime).getTime() -
          new Date(b.LastUpdatedTime).getTime(),
        defaultSortOrder: "descend",
        sortDirections: ["descend", "ascend"],
      },
    ],
    [getColumnSearchProps, openEditModal]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="ทดสอบสถานะเซิร์ฟเวอร์อีกครั้ง" variant="borderless">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => void refreshHeartbeats()}
          >
            รีเฟรช
          </Button>
        </Card>

        <Card title="เช็กเวอร์ชันทุกระบบ" variant="borderless">
          <Table<ApiTableData>
            columns={columns}
            dataSource={dataSource}
            loading={isLoading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              showQuickJumper: true,
            }}
            rowKey={(record) => String(record.ID)}
            bordered
          />
        </Card>
      </Space>

      <Modal
        title="แก้ไขคำอธิบาย"
        open={Boolean(editingRow)}
        onCancel={closeEditModal}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={closeEditModal}>
            ยกเลิก
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleUpdateDescription}
            loading={isSubmitting}
          >
            บันทึก
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="คำอธิบาย"
            name="description"
            rules={[{ required: true, message: "กรุณากรอกคำอธิบาย" }]}
          >
            <Input.TextArea
              placeholder="กรอกคำอธิบาย"
              autoSize={{ minRows: 2, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
