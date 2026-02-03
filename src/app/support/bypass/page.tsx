"use client";

import SummaryCard from "@/components/card/summary-card";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  BankOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CustomerServiceOutlined,
  FilterOutlined,
  LoginOutlined,
  SearchOutlined,
  StarFilled,
  TableOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
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
        title: "School ID",
        dataIndex: "school_id",
        key: "school_id",
        width: 120,
        fixed: "left",
        align: "center",
        sorter: (a, b) => Number(a.school_id) - Number(b.school_id),
        render: (id) => (
          <Tag
            color="geekblue"
            bordered={false}
            style={{
              margin: 0,
              fontWeight: "bold",
              fontSize: 14,
              padding: "4px 12px",
            }}
          >
            {id}
          </Tag>
        ),
      },
      {
        title: "โรงเรียน",
        key: "school",
        width: 300,
        sorter: (a, b) =>
          (a.company_name ?? "").localeCompare(b.company_name ?? ""),
        render: (_, record) => (
          <Flex align="center" gap={12}>
            <Avatar
              style={{
                backgroundColor: getAvatarColor(record.company_name ?? ""),
              }}
              shape="square"
              size={40}
            >
              {record.company_name?.charAt(0)}
            </Avatar>
            <Flex vertical>
              <Text strong style={{ fontSize: 13 }}>
                {record.company_name}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Code: {record.school_code || "-"}
              </Text>
            </Flex>
          </Flex>
        ),
      },

      {
        title: "จังหวัด",
        dataIndex: "province",
        key: "province",
        width: 140,
        sorter: (a, b) => (a.province ?? "").localeCompare(b.province ?? ""),
      },
      {
        title: "ประเภท & ชั้น",
        key: "type_class",
        width: 180,
        render: (_, record) => (
          <Flex vertical gap={4}>
            <Tag
              color="cyan"
              bordered={false}
              style={{ fontSize: 11, width: "fit-content", margin: 0 }}
            >
              {record.school_type || "-"}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.school_class || "ไม่ระบุชั้น"}
            </Text>
          </Flex>
        ),
      },
      {
        title: "ทีมดูแล (Sale & Support)",
        key: "team",
        width: 220,
        render: (_, record) => (
          <Flex vertical gap={4}>
            <Flex align="center" gap={8}>
              <UserOutlined style={{ color: "#f59e0b", fontSize: 12 }} />
              <Text style={{ fontSize: 12 }}>{record.sale_name || "-"}</Text>
            </Flex>
            <Flex align="center" gap={8}>
              <CustomerServiceOutlined
                style={{ color: "#10b981", fontSize: 12 }}
              />
              <Text style={{ fontSize: 12 }}>{record.support_name || "-"}</Text>
            </Flex>
          </Flex>
        ),
      },
      {
        title: "ข้อมูลสัญญญา",
        dataIndex: "school_data_type",
        key: "school_data_type",
        width: 130,
        render: (type) => (
          <Tag bordered={false} style={{ margin: 0 }}>
            {type || "-"}
          </Tag>
        ),
      },
      {
        title: "วันที่เปิด",
        dataIndex: "active_date",
        key: "active_date",
        width: 120,
        align: "center",
      },
      {
        title: "เกรด",
        dataIndex: "school_grade",
        key: "school_grade",
        width: 80,
        align: "center",
        render: (grade) => (
          <Flex justify="center">
            <Tag
              color={token.colorWarning}
              bordered={false}
              icon={<StarFilled />}
              style={{ margin: 0 }}
            >
              {grade || "-"}
            </Tag>
          </Flex>
        ),
      },
      {
        title: "นักเรียน",
        dataIndex: "student_count",
        key: "student_count",
        width: 100,
        align: "right",
        render: (count) => (
          <Text style={{ fontFamily: "monospace" }}>
            {Number(count || 0).toLocaleString()}
          </Text>
        ),
      },
      {
        title: "สถานะ",
        dataIndex: "isActive",
        key: "isActive",
        width: 120,
        sorter: (a, b) =>
          (a.isActive ?? "active").localeCompare(b.isActive ?? "active"),
        render: (status) => {
          const isInactive = status === "inactive";
          return (
            <Badge
              status={isInactive ? "error" : "success"}
              text={
                <Text
                  strong
                  style={{
                    color: isInactive ? token.colorError : token.colorSuccess,
                    fontSize: 12,
                  }}
                >
                  {isInactive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </Text>
              }
            />
          );
        },
      },
      {
        title: "จัดการ",
        key: "action",
        width: 140,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => setBypassModal({ open: true, school: record })}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            เข้าสู่ระบบ
          </Button>
        ),
      },
    ],
    [token, TRANSLATION],
  );

  return (
    <DashboardLayout>
      <Flex vertical gap={32}>
        {/* ส่วนที่ 1: หัวข้อหน้าเว็ป */}
        <HeaderBar
          icon={<LoginOutlined />}
          title="ระบบเข้าใช้โรงเรียน (School Bypass)"
          subTitle="เครื่องมือสำหรับทีมซัพพอร์ตในการเข้าสู่ระบบโรงเรียนต่าง ๆ ได้อย่างรวดเร็ว"
        />

        {/* ส่วนที่ 2: บัตรสรุปข้อมูล (Summary Cards) */}
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
        <Card variant="borderless" styles={{ body: { padding: 24 } }}>
          <Flex vertical gap={24}>
            <Flex align="center" gap={8}>
              <FilterOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Title level={5} style={{ margin: 0 }}>
                ตัวกรอง
              </Title>
            </Flex>

            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Flex vertical gap={16}>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
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
                  </Flex>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      โครงการ/กลุ่มโรงเรียน
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="เลือกกลุ่มโรงเรียน"
                      options={state.filterOptions.schoolGroups}
                      value={state.filters.schoolGroup}
                      onChange={(v) =>
                        handlers.handleFilterChange("schoolGroup", v)
                      }
                      allowClear
                    />
                  </Flex>
                </Flex>
              </Col>

              <Col xs={24} lg={12}>
                <Flex vertical gap={16}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Flex vertical gap={8}>
                        <Text strong style={{ fontSize: 13 }}>
                          จังหวัด
                        </Text>
                        <Select
                          style={{ width: "100%" }}
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
                      </Flex>
                    </Col>
                    <Col span={12}>
                      <Flex vertical gap={8}>
                        <Text strong style={{ fontSize: 13 }}>
                          เกรด
                        </Text>
                        <Select
                          style={{ width: "100%" }}
                          size="large"
                          placeholder="เลือกเกรด"
                          options={state.filterOptions.grades}
                          value={state.filters.grade}
                          onChange={(v) =>
                            handlers.handleFilterChange("grade", v)
                          }
                          allowClear
                        />
                      </Flex>
                    </Col>
                  </Row>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      สถานะ
                    </Text>
                    <Select
                      style={{ width: "100%" }}
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
                  </Flex>
                </Flex>
              </Col>
            </Row>

            <Divider style={{ margin: 0 }} />

            <Flex justify="end" gap={12}>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={handlers.handleClearFilters}
              >
                ล้างการค้นหา
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                style={{ padding: "0 32px" }}
              >
                ค้นหาข้อมูล
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
        <Card
          variant="borderless"
          styles={{ body: { padding: 16 } }}
          style={{ border: `1px solid ${token.colorBorderSecondary}` }}
        >
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={12}>
                <TableOutlined
                  style={{ color: token.colorPrimary, fontSize: 18 }}
                />
                <Title level={5} style={{ margin: 0 }}>
                  รายชื่อโรงเรียนในระบบ
                </Title>
                <Badge
                  count={state.filteredSchools.length}
                  overflowCount={9999}
                  showZero
                  color={token.colorSuccess}
                />
              </Flex>

              <Flex gap={8}>
                <Button
                  onClick={() => setShowProvinceRanking(true)}
                  icon={<TrophyOutlined />}
                  type="text"
                  style={{ color: "#8b5cf6", fontWeight: 600 }}
                >
                  อันดับตามจังหวัด
                </Button>
                <Button
                  onClick={() => setShowSaleRanking(true)}
                  icon={<TeamOutlined />}
                  type="text"
                  style={{ color: "#f59e0b", fontWeight: 600 }}
                >
                  อันดับคนขาย
                </Button>
              </Flex>
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
              scroll={{ x: 2000 }}
              onChange={handlers.handleTableChange}
            />
          </Flex>
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
      </Flex>
    </DashboardLayout>
  );
}
