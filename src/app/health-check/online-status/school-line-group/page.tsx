"use client";

import {
  BankOutlined,
  FilterFilled,
  ReloadOutlined,
  SendOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import DashboardLayout from "@components/layouts/backend-layout";
import { StatusModalComponent } from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { callApiService } from "@services/axios-instance/sb-helper.axios";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

dayjs.locale("th");

const { Text } = Typography;

interface TLineGroupItem {
  LineGroupId: number;
  SchoolId: number | null;
  GroupId: string | null;
  LineNotificationAccessToken: string | null;
  GroupType: string | null;
  CreateDate: string | null;
}

interface ApiResponse {
  status_code: number;
  message_th: string;
  data: TLineGroupItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// ไอคอน LINE (SVG)
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

// หน้ารายการ LINE Group ตามโรงเรียน พร้อมการทดสอบส่งข้อความ
export default function SchoolLineGroupPage() {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  const [items, setItems] = useState<TLineGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });
  const [filterSchoolId, setFilterSchoolId] = useState<number | undefined>(
    undefined,
  );

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title: string;
    message: string;
  }>({ open: false, type: "success", title: "", message: "" });

  // ดึงข้อมูลรายชื่อกลุ่ม LINE จาก API
  const fetchData = useCallback(
    async (page = 1, school_id?: number) => {
      setLoading(true);
      try {
        const res = await callApiService.post<ApiResponse>(
          "/api/v1/hardware/machine-monitoring/channel/line/school-id",
          {
            page,
            limit: pagination.page_size,
            ...(school_id ? { school_id } : {}),
          },
        );
        const body = res.data;
        if (body.status_code === 200) {
          setItems(body.data);
          setPagination(body.pagination);
        }
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page_size],
  );

  useEffect(() => {
    void fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ส่ง LINE ทดสอบไปยังโรงเรียนที่เลือก
  const handleSendLine = async (record: TLineGroupItem) => {
    if (!record.SchoolId) {
      toast.error("ไม่พบรหัสโรงเรียนในรายการนี้");
      return;
    }
    setSendingId(record.LineGroupId);
    try {
      const res = await callApiService.get(
        `/api/v1/hardware/machine-monitoring/channel/line/${record.SchoolId}`,
      );
      const data = res.data;
      if (data?.status_code === 200) {
        setStatusModal({
          open: true,
          type: "success",
          title: "ส่งรายงานสำเร็จ",
          message: `ส่งรายงานสถานะเครื่องของโรงเรียน ${
            data.data?.school_name ?? record.SchoolId
          } ไปยัง LINE สำเร็จ`,
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
        message: msg,
      });
    } finally {
      setSendingId(null);
    }
  };

  // ค้นหาตาม school_id
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setFilterSchoolId(values.school_id ?? undefined);
    void fetchData(1, values.school_id ?? undefined);
  };

  // ล้างการค้นหา
  const handleClear = () => {
    form.resetFields();
    setFilterSchoolId(undefined);
    void fetchData(1, undefined);
  };

  const columns: ColumnsType<TLineGroupItem> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 70,
      align: "center",
      render: (_: unknown, __: unknown, idx: number) =>
        (pagination.page - 1) * pagination.page_size + idx + 1,
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
            style={{ fontFamily: "monospace", fontWeight: 600 }}
          >
            {val}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
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
            style={{
              fontSize: 11,
              maxWidth: 220,
              display: "inline-block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
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
      render: (val: string | null) =>
        val ? (
          <Tag color="purple">{val}</Tag>
        ) : (
          <Tag color="default">ไม่ระบุ</Tag>
        ),
    },
    {
      title: "มี Token",
      dataIndex: "LineNotificationAccessToken",
      key: "hasToken",
      align: "center",
      render: (val: string | null) =>
        val ? (
          <Tag color="green">มี Token</Tag>
        ) : (
          <Tag color="red">ไม่มี Token</Tag>
        ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "CreateDate",
      key: "CreateDate",
      sorter: (a, b) => dayjs(a.CreateDate).unix() - dayjs(b.CreateDate).unix(),
      render: (val: string | null) =>
        val ? (
          <Text style={{ fontSize: 12 }}>
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
      width: 150,
      render: (_: unknown, record: TLineGroupItem) => (
        <Tooltip
          title={`ส่งรายงานสถานะเครื่องของโรงเรียน ${
            record.SchoolId ?? "-"
          } ไปยัง LINE`}
        >
          <Button
            size="small"
            icon={<LineIcon />}
            loading={sendingId === record.LineGroupId}
            disabled={!record.SchoolId}
            onClick={() => handleSendLine(record)}
            style={{
              background: record.SchoolId ? "#06C755" : undefined,
              color: record.SchoolId ? "#fff" : undefined,
              border: "none",
              fontWeight: 600,
              borderRadius: 8,
            }}
          >
            ส่ง LINE
          </Button>
        </Tooltip>
      ),
    },
  ];

  // นับ summary จาก items ที่โหลดมา
  const hasTokenCount = items.filter(
    (i) => !!i.LineNotificationAccessToken,
  ).length;
  const uniqueSchools = new Set(items.map((i) => i.SchoolId).filter(Boolean))
    .size;

  return (
    <DashboardLayout>
      <div style={{ width: "100%", paddingBottom: 48 }}>
        <HeaderBar
          icon={<TeamOutlined />}
          title="รายชื่อกลุ่ม LINE ตามโรงเรียน"
          subTitle="จัดการและทดสอบการส่งรายงานสถานะฮาร์ดแวร์ไปยังกลุ่ม LINE ของแต่ละโรงเรียน"
        />

        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="รายการทั้งหมด"
              value={pagination.total}
              unit="รายการ"
              icon={<UnorderedListOutlined />}
              color={token.colorPrimary}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="โรงเรียน (หน้านี้)"
              value={uniqueSchools}
              unit="โรงเรียน"
              icon={<BankOutlined />}
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="มี Token (หน้านี้)"
              value={hasTokenCount}
              unit="รายการ"
              icon={<SendOutlined />}
              color="#06C755"
            />
          </Col>
        </Row>

        {/* Filter Section */}
        <Card
          style={{ marginBottom: 16, borderRadius: 12 }}
          styles={{ body: { padding: 16 } }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
            <FilterFilled
              style={{ fontSize: "1rem", color: token.colorPrimary }}
            />
            <Text strong style={{ fontSize: 14, fontWeight: 600 }}>
              ตัวกรอง
            </Text>
          </Flex>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="รหัสโรงเรียน" name="school_id">
                  <InputNumber
                    placeholder="เช่น 1234"
                    style={{ width: "100%" }}
                    min={1}
                    controls={false}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label=" " colon={false}>
                  <Flex justify="flex-end" gap={8}>
                    <Button
                      icon={<FilterFilled />}
                      type="primary"
                      onClick={handleSearch}
                      loading={loading}
                    >
                      ค้นหา
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleClear}>
                      ล้างการค้นหา
                    </Button>
                  </Flex>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Table */}
        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
          <Flex
            align="center"
            justify="space-between"
            style={{ marginBottom: 12 }}
          >
            <Flex align="center" gap={8}>
              <UnorderedListOutlined style={{ fontSize: "1rem" }} />
              <Text strong style={{ fontSize: 14 }}>
                รายชื่อกลุ่ม LINE
              </Text>
              {filterSchoolId && (
                <Tag color="blue" closable onClose={handleClear}>
                  โรงเรียน: {filterSchoolId}
                </Tag>
              )}
            </Flex>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                loading={loading}
                onClick={() => fetchData(pagination.page, filterSchoolId)}
              >
                รีเฟรช
              </Button>
            </Space>
          </Flex>

          <Table
            rowKey="LineGroupId"
            columns={columns}
            dataSource={items}
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.page_size,
              total: pagination.total,
              showSizeChanger: false,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              onChange: (page) => fetchData(page, filterSchoolId),
            }}
            size="small"
            scroll={{ x: 900 }}
            locale={{ emptyText: "ไม่พบข้อมูล" }}
          />
        </Card>

        <StatusModalComponent
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() => setStatusModal((p) => ({ ...p, open: false }))}
          onConfirm={() => setStatusModal((p) => ({ ...p, open: false }))}
        />
      </div>
    </DashboardLayout>
  );
}
