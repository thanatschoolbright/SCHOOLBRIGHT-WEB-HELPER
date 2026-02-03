"use client";

import SummaryCard from "@/components/card/summary-card";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  BankOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  LoginOutlined,
  SearchOutlined,
  TableOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BypassSelectionModal from "./components/bypass-selection-modal.component";
import ProvinceRankingModal from "./components/province-ranking-modal.component";
import SaleRankingModal from "./components/sale-ranking-modal.component";
import { useBypassPageData } from "./hooks/bypass.data";
import type { SchoolDetail } from "./types/bypass.types";
import { calculateStatistics } from "./utils/bypass.helpers";
import { calculateProvinceStatistics } from "./utils/province-stats.helpers";
import { calculateSaleStatistics } from "./utils/sale-stats.helpers";

const { Title, Text } = Typography;

/**
 * ฟังก์ชันเลือกสี Avatar ตามชื่อ
 * @param name ชื่อที่ต้องการสร้างสี
 */
const getAvatarColor = (name: string) => {
  const colors = [
    "#f5222d",
    "#fa541c",
    "#fa8c16",
    "#faad14",
    "#fadb14",
    "#a0d911",
    "#52c41a",
    "#13c2c2",
    "#1890ff",
    "#2f54eb",
    "#722ed1",
    "#eb2f96",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function BypassPage(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const { state, handlers } = useBypassPageData();

  // * Local UI State
  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);
  const [bypassModal, setBypassModal] = useState<{
    open: boolean;
    school: SchoolDetail | null;
  }>({
    open: false,
    school: null,
  });

  // * Calculate Statistics from original data as per requirement (Instruction 2.b)
  // * สรุปภาพรวมจากข้อมูลทั้งหมด (ไม่สน Filter)
  const overallStatistics = useMemo(
    () => calculateStatistics(state.schoolDetails ?? []),
    [state.schoolDetails],
  );

  // * Calculate Province Ranking Data (Standalone from table filters)
  const provinceStatistics = useMemo(
    () => calculateProvinceStatistics(state.schoolDetails),
    [state.schoolDetails],
  );

  // * Calculate Sale Ranking Data (Standalone from table filters)
  const saleStatistics = useMemo(
    () => calculateSaleStatistics(state.schoolDetails),
    [state.schoolDetails],
  );

  // * Define Table Columns with sorting enabled
  const columns: ColumnsType<SchoolDetail> = useMemo(
    () => [
      {
        title: "#",
        key: "index",
        width: 70,
        align: "center",
        render: (_v, _r, index) => (
          <Text strong style={{ opacity: 0.4, fontSize: 13 }}>
            {(index + 1).toString().padStart(2, "0")}
          </Text>
        ),
      },
      {
        title: "โรงเรียน",
        key: "school",
        width: 350,
        sorter: (a, b) =>
          (a.company_name ?? "").localeCompare(b.company_name ?? ""),
        render: (_, record) => (
          <Space size={12}>
            <Avatar
              style={{
                backgroundColor: getAvatarColor(record.company_name ?? ""),
              }}
              shape="square"
              size={40}
            >
              {record.company_name?.charAt(0)}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text strong style={{ fontSize: 14, fontWeight: 600 }}>
                {record.company_name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ไอดี: {record.school_id} | รหัส: {record.school_code}
              </Text>
            </div>
          </Space>
        ),
      },
      {
        title: "จังหวัด",
        dataIndex: "province",
        key: "province",
        width: 150,
        sorter: (a, b) => (a.province ?? "").localeCompare(b.province ?? ""),
      },
      {
        title: "ประเภท",
        dataIndex: "school_type",
        key: "school_type",
        width: 150,
        sorter: (a, b) =>
          (a.school_type ?? "").localeCompare(b.school_type ?? ""),
        render: (type) => {
          const label = type === "Software" ? "ซอฟต์แวร์" : type || "-";
          return <Tag bordered={false}>{label}</Tag>;
        },
      },
      {
        title: "เกรด",
        dataIndex: "school_grade",
        key: "school_grade",
        width: 100,
        align: "center",
        sorter: (a, b) =>
          (a.school_grade ?? "").localeCompare(b.school_grade ?? ""),
        render: (grade) => (
          <Badge
            count={grade || "-"}
            style={{
              backgroundColor:
                grade === "A" ? token.colorWarning : token.colorInfo,
              fontWeight: 600,
            }}
          />
        ),
      },
      {
        title: "นักเรียน",
        dataIndex: "student_count",
        key: "student_count",
        width: 120,
        align: "right",
        sorter: (a, b) =>
          Number(a.student_count || 0) - Number(b.student_count || 0),
        render: (count) => (
          <Text strong>{Number(count || 0).toLocaleString()}</Text>
        ),
      },
      {
        title: "สถานะ",
        dataIndex: "isActive",
        key: "isActive",
        width: 120,
        sorter: (a, b) => (a.isActive ?? "").localeCompare(b.isActive ?? ""),
        render: (status) => (
          <Tag
            icon={
              status === "active" ? (
                <CheckCircleOutlined />
              ) : (
                <CloseCircleOutlined />
              )
            }
            color={status === "active" ? "success" : "error"}
            bordered={false}
            style={{ fontWeight: 600 }}
          >
            {status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </Tag>
        ),
      },
      {
        title: "จัดการ",
        key: "action",
        width: 150,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => setBypassModal({ open: true, school: record })}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            เข้าใช้ระบบ
          </Button>
        ),
      },
    ],
    [token, TRANSLATION],
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-8">
        {/* ส่วนที่ 1: หัวข้อหน้าเว็ป */}
        <HeaderBar
          icon={<LoginOutlined />}
          title="ระบบเข้าใช้โรงเรียน (School Bypass)"
          subTitle="เครื่องมือสำหรับทีมซัพพอร์ตในการเข้าสู่ระบบโรงเรียนต่าง ๆ ได้อย่างรวดเร็ว"
        />

        {/* ส่วนที่ 2: บัตรสรุปข้อมูล (Summary Cards) - สรุปจากข้อมูลเดิมเสมอ */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="โรงเรียนทั้งหมด"
              value={overallStatistics.total.toLocaleString()}
              subtitle="จำนวนโรงเรียนในระบบ"
              icon={<BankOutlined />}
              color={token.colorPrimary}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="เปิดการใช้งาน"
              value={overallStatistics.active.toLocaleString()}
              subtitle="ออนไลน์ปกติ"
              icon={<ThunderboltOutlined />}
              color={token.colorSuccess}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="ยังไม่เปิดการใช้งาน"
              value={overallStatistics.inactive.toLocaleString()}
              subtitle="ควรตรวจสอบระบบ"
              icon={<CloseCircleOutlined />}
              color={token.colorError}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="เกรด A (ดีเยี่ยม)"
              value={overallStatistics.gradeA.toLocaleString()}
              subtitle="ประสิทธิภาพสูง"
              icon={<TrophyOutlined />}
              color={token.colorWarning}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: ฟิลเตอร์และปุ่มค้นหา */}
        <Card
          bordered={false}
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Flex align="center" gap={8} className="mb-6">
            <FilterOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
            <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              ตัวกรอง
            </Title>
          </Flex>

          <Row gutter={[24, 16]}>
            {/* Column 1 */}
            <Col xs={24} lg={12}>
              <Space direction="vertical" className="w-full" size={16}>
                <div>
                  <Text
                    strong
                    style={{ fontSize: 13, display: "block", marginBottom: 8 }}
                  >
                    ค้นหาโรงเรียน
                  </Text>
                  <Input
                    size="large"
                    placeholder="ค้นหาด้วยชื่อ, รหัสโรงเรียน..."
                    prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                    value={state.filters.search}
                    onChange={(e) =>
                      handlers.handleFilterChange("search", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Text
                    strong
                    style={{ fontSize: 13, display: "block", marginBottom: 8 }}
                  >
                    โครงการ/กลุ่มโรงเรียน
                  </Text>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="เลือกกลุ่มโรงเรียน"
                    options={state.filterOptions.schoolGroups}
                    value={state.filters.schoolGroup}
                    onChange={(v) =>
                      handlers.handleFilterChange("schoolGroup", v)
                    }
                    allowClear
                  />
                </div>
              </Space>
            </Col>

            {/* Column 2 */}
            <Col xs={24} lg={12}>
              <Space direction="vertical" className="w-full" size={16}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      จังหวัด
                    </Text>
                    <Select
                      className="w-full"
                      size="large"
                      placeholder="ทุกจังหวัด"
                      showSearch
                      options={state.filterOptions.provinces}
                      value={state.filters.province}
                      onChange={(v) =>
                        handlers.handleFilterChange("province", v)
                      }
                      allowClear
                    />
                  </Col>
                  <Col span={12}>
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      เกรด
                    </Text>
                    <Select
                      className="w-full"
                      size="large"
                      placeholder="เลือกเกรด"
                      options={state.filterOptions.grades}
                      value={state.filters.grade}
                      onChange={(v) => handlers.handleFilterChange("grade", v)}
                      allowClear
                    />
                  </Col>
                </Row>
                <div>
                  <Text
                    strong
                    style={{ fontSize: 13, display: "block", marginBottom: 8 }}
                  >
                    สถานะ
                  </Text>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="เลือกสถานะ"
                    value={state.filters.status}
                    onChange={(v) => handlers.handleFilterChange("status", v)}
                    allowClear
                    options={[
                      { label: "เปิดใช้งาน", value: "active" },
                      { label: "ปิดใช้งาน", value: "inactive" },
                    ]}
                  />
                </div>
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          <Flex justify="end" gap={12}>
            <Button
              size="large"
              icon={<ClearOutlined />}
              onClick={handlers.handleClearFilters}
              style={{ fontWeight: 600 }}
            >
              ล้างการค้นหา
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              style={{ fontWeight: 600, padding: "0 32px" }}
            >
              ค้นหาข้อมูล
            </Button>
          </Flex>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex justify="space-between" align="center" className="mb-4">
            <Space size={12}>
              <TableOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                รายชื่อโรงเรียนในระบบ
              </Title>
              <Badge
                count={state.filteredSchools.length}
                overflowCount={9999}
                showZero
                style={{ backgroundColor: token.colorSuccess, fontWeight: 600 }}
              />
            </Space>

            <Space>
              <Button
                onClick={() => setShowProvinceRanking(true)}
                icon={<TrophyOutlined />}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#8b5cf6",
                  fontWeight: 600,
                }}
              >
                อันดับตามจังหวัด
              </Button>
              <Button
                onClick={() => setShowSaleRanking(true)}
                icon={<TeamOutlined />}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#f59e0b",
                  fontWeight: 600,
                }}
              >
                อันดับคนขาย
              </Button>
            </Space>
          </Flex>

          <Table<SchoolDetail>
            columns={columns}
            dataSource={state.filteredSchools}
            loading={state.loading}
            rowKey={(record) => String(record.school_id)}
            pagination={{
              pageSize: state.pageSize,
              showSizeChanger: true,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 1200 }}
            onChange={handlers.handleTableChange}
          />
        </Card>

        {/* Modals Section */}
        <ProvinceRankingModal
          open={showProvinceRanking}
          onClose={() => setShowProvinceRanking(false)}
          data={provinceStatistics}
        />
        <SaleRankingModal
          open={showSaleRanking}
          onClose={() => setShowSaleRanking(false)}
          data={saleStatistics}
        />

        <BypassSelectionModal
          open={bypassModal.open}
          school={bypassModal.school}
          onClose={() => setBypassModal({ open: false, school: null })}
          onSelect={(targetKey, envKey) => {
            if (bypassModal.school) {
              void handlers.handleBypassClick(
                `${targetKey}|${envKey}`,
                bypassModal.school,
              );
              setBypassModal({ open: false, school: null });
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
