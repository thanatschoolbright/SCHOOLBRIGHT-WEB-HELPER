"use client";

import SummaryCard from "@/components/card/summary-card";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  BankOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  CustomerServiceOutlined,
  FilterOutlined,
  LoginOutlined,
  SearchOutlined,
  SettingOutlined,
  StarFilled,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Avatar,
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
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import BypassSelectionModal from "./components/bypass-selection-modal.component";
import SchoolStatusModal from "./components/school-status-modal.component";
import { useBypassPageData } from "./hooks/bypass.data";
import type { SchoolDetail } from "./types/bypass.types";
import { calculateStatistics, filterSchools } from "./utils/bypass.helpers";
import { calculateProvinceStatistics } from "./utils/province-stats.helpers";
import { calculateSaleStatistics } from "./utils/sale-stats.helpers";

const ProvinceRankingModal = dynamic(
  () => import("./components/province-ranking-modal.component"),
  { ssr: false },
);
const SaleRankingModal = dynamic(
  () => import("./components/sale-ranking-modal.component"),
  { ssr: false },
);

const { Text } = Typography;

// ✨ สร้างสีพื้นหลัง Avatar จากชื่อโรงเรียน
const generateAvatarColor = (
  name: string,
  tokenMap: Record<string, string>,
): string => {
  const keys = [
    "red6",
    "volcano6",
    "orange6",
    "gold6",
    "lime6",
    "green6",
    "cyan6",
    "blue6",
    "geekblue6",
    "purple6",
    "magenta6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const key = keys[Math.abs(hash) % keys.length];
  return (key !== undefined ? tokenMap[key] : undefined) ?? "#722ed1";
};

export default function BypassPage(): JSX.Element {
  const { t: translate } = useTranslation("translate");
  const { token } = theme.useToken();
  const { state: bypassState, handlers: bypassHandlers } = useBypassPageData();

  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);
  const [bypassModalState, setBypassModalState] = useState<{
    open: boolean;
    school: SchoolDetail | null;
  }>({ open: false, school: null });
  const [statusModalState, setStatusModalState] = useState<{
    open: boolean;
    school: SchoolDetail | null;
  }>({ open: false, school: null });
  const [schoolStatusOverrides, setSchoolStatusOverrides] = useState<
    Record<number, { active: boolean | null; isActive: boolean | null }>
  >({});

  const filteredSchoolsWithOverrides = useMemo(() => {
    const merged = bypassState.schoolDetails.map((school) => {
      const override = schoolStatusOverrides[Number(school.school_id)];
      if (!override) return school;
      return {
        ...school,
        db_active: override.active,
        db_is_active: override.isActive,
      };
    });
    return filterSchools(merged, bypassState.filters);
  }, [bypassState.schoolDetails, bypassState.filters, schoolStatusOverrides]);

  const stats = useMemo(
    () => calculateStatistics(bypassState.schoolDetails ?? []),
    [bypassState.schoolDetails],
  );
  const provinceStats = useMemo(
    () => calculateProvinceStatistics(bypassState.schoolDetails),
    [bypassState.schoolDetails],
  );
  const saleStats = useMemo(
    () => calculateSaleStatistics(bypassState.schoolDetails),
    [bypassState.schoolDetails],
  );

  const columns: ColumnsType<SchoolDetail> = useMemo(
    () => [
      {
        title: translate("bypass_page.col_school_id"),
        dataIndex: "school_id",
        key: "school_id",
        width: 100,
        fixed: "left",
        align: "center",
        sorter: (a, b) => Number(a.school_id) - Number(b.school_id),
        render: (id) => (
          <Tag
            color="geekblue"
            bordered={false}
            style={{ margin: 0, fontWeight: 600 }}
          >
            {id}
          </Tag>
        ),
      },
      {
        title: translate("bypass_page.col_institution"),
        key: "school",
        width: 300,
        sorter: (a, b) =>
          (a.company_name ?? "").localeCompare(b.company_name ?? ""),
        render: (_, record) => (
          <Flex align="center" gap={12}>
            <Avatar
              style={{
                backgroundColor: generateAvatarColor(
                  record.company_name ?? "",
                  token as unknown as Record<string, string>,
                ),
                flexShrink: 0,
              }}
              shape="square"
              size={40}
            >
              {record.company_name?.charAt(0)}
            </Avatar>
            <Flex vertical gap={2}>
              <Text strong style={{ fontSize: 13 }}>
                {record.company_name}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {translate("bypass_page.col_school_code")}:{" "}
                {record.school_code || "-"}
              </Text>
            </Flex>
          </Flex>
        ),
      },
      {
        title: translate("bypass_page.col_province"),
        dataIndex: "province",
        key: "province",
        width: 130,
        sorter: (a, b) => (a.province ?? "").localeCompare(b.province ?? ""),
        render: (province) => (
          <Text style={{ fontSize: 13 }}>{province || "-"}</Text>
        ),
      },
      {
        title: translate("bypass_page.col_type_level"),
        key: "type_class",
        width: 160,
        sorter: (a, b) =>
          (a.school_type ?? "").localeCompare(b.school_type ?? ""),
        render: (_, record) => (
          <Flex vertical gap={4}>
            <Tag
              color="cyan"
              bordered={false}
              style={{ margin: 0, fontSize: 11, width: "fit-content" }}
            >
              {record.school_type || translate("bypass_page.not_specified")}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.school_class || translate("bypass_page.not_specified")}
            </Text>
          </Flex>
        ),
      },
      {
        title: translate("bypass_page.col_team"),
        key: "team",
        width: 200,
        sorter: (a, b) => (a.sale_name ?? "").localeCompare(b.sale_name ?? ""),
        render: (_, record) => (
          <Flex vertical gap={6}>
            <Flex align="center" gap={6}>
              <UserOutlined
                style={{ fontSize: 11, color: token.colorWarning }}
              />
              <Text style={{ fontSize: 12 }}>{record.sale_name || "-"}</Text>
            </Flex>
            <Flex align="center" gap={6}>
              <CustomerServiceOutlined
                style={{ fontSize: 11, color: token.colorSuccess }}
              />
              <Text style={{ fontSize: 12 }}>{record.support_name || "-"}</Text>
            </Flex>
          </Flex>
        ),
      },
      {
        title: translate("bypass_page.col_contract"),
        dataIndex: "school_data_type",
        key: "school_data_type",
        width: 120,
        align: "center",
        sorter: (a, b) =>
          (a.school_data_type ?? "").localeCompare(b.school_data_type ?? ""),
        render: (type) => (
          <Tag bordered style={{ margin: 0, fontSize: 11 }}>
            {type || "-"}
          </Tag>
        ),
      },
      {
        title: translate("bypass_page.col_launch"),
        dataIndex: "active_date",
        key: "active_date",
        width: 130,
        align: "center",
        sorter: (a, b) =>
          (a.active_date ?? "").localeCompare(b.active_date ?? ""),
        render: (activeDate: string | undefined) => {
          if (!activeDate) return <Text type="secondary">-</Text>;
          const days = Math.floor(
            (Date.now() - new Date(activeDate).getTime()) / 86400000,
          );
          const isNew = !Number.isNaN(days) && days <= 30;
          return (
            <Flex vertical align="center" gap={4}>
              <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
                {activeDate}
              </Text>
              {isNew && (
                <Tag
                  color="green"
                  bordered={false}
                  style={{ margin: 0, fontSize: 10 }}
                >
                  {translate("bypass_page.badge_new_school")}
                </Tag>
              )}
            </Flex>
          );
        },
      },
      {
        title: translate("bypass_page.col_grade"),
        dataIndex: "school_grade",
        key: "school_grade",
        width: 90,
        align: "center",
        sorter: (a, b) =>
          (a.school_grade ?? "").localeCompare(b.school_grade ?? ""),
        render: (grade) => (
          <Flex vertical align="center" gap={2}>
            <StarFilled style={{ color: "#faad14", fontSize: 16 }} />
            <Text style={{ fontSize: 11, fontWeight: 600, color: "#d48806" }}>
              {grade || "N/A"}
            </Text>
          </Flex>
        ),
      },
      {
        title: translate("bypass_page.col_student_count"),
        dataIndex: "student_count",
        key: "student_count",
        width: 130,
        align: "right",
        sorter: (a, b) =>
          Number(a.student_count || 0) - Number(b.student_count || 0),
        render: (count) => {
          const n = Number(count || 0);
          const tier =
            n >= 2000
              ? {
                  label: "XL",
                  color:
                    (token as unknown as Record<string, string>)["purple6"] ??
                    "#722ed1",
                }
              : n >= 1000
              ? { label: "L", color: token.colorInfo }
              : n >= 500
              ? { label: "M", color: token.colorSuccess }
              : { label: "S", color: token.colorTextTertiary };
          return (
            <Flex vertical align="flex-end" gap={4}>
              <Text strong style={{ fontSize: 13, fontFamily: "monospace" }}>
                {n.toLocaleString()}
              </Text>
              <Tag
                bordered={false}
                style={{
                  margin: 0,
                  fontSize: 10,
                  backgroundColor: `${tier.color}20`,
                  color: tier.color,
                  fontWeight: 700,
                }}
              >
                {tier.label}
              </Tag>
            </Flex>
          );
        },
      },
      {
        title: translate("bypass_page.col_status"),
        dataIndex: "isActive",
        key: "isActive",
        width: 110,
        align: "center",
        sorter: (a, b) =>
          (a.isActive ?? "active").localeCompare(b.isActive ?? "active"),
        render: (status) => {
          const inactive = status === "inactive";
          return (
            <Tag
              color={inactive ? "error" : "success"}
              style={{ margin: 0, fontSize: 11 }}
            >
              {inactive
                ? translate("bypass_page.status_inactive")
                : translate("bypass_page.status_active")}
            </Tag>
          );
        },
      },
      {
        title: "สถานะโรงเรียน",
        key: "school_status",
        width: 180,
        align: "center",
        render: (_: unknown, record: SchoolDetail) => {
          const schoolId = Number(record.school_id);
          const override = schoolStatusOverrides[schoolId];
          const active =
            override !== undefined ? override.active : record.db_active;
          const isActive =
            override !== undefined
              ? override.isActive
              : record.db_is_active ??
                (record.isActive === "active"
                  ? true
                  : record.isActive === "inactive"
                  ? false
                  : null);
          return (
            <Flex vertical gap={6} align="center">
              <Flex gap={4}>
                <Tag
                  color={active ? "success" : "default"}
                  style={{ margin: 0, fontSize: 11 }}
                >
                  {active ? "ระบบ: เปิด" : "ระบบ: ปิด"}
                </Tag>
                <Tag
                  color={isActive ? "success" : "error"}
                  style={{ margin: 0, fontSize: 11 }}
                >
                  {isActive ? "Login: เปิด" : "Login: ปิด"}
                </Tag>
              </Flex>
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() =>
                  setStatusModalState({
                    open: true,
                    school: {
                      ...record,
                      db_active: active ?? undefined,
                      db_is_active: isActive ?? undefined,
                    },
                  })
                }
                style={{ fontSize: 11 }}
              >
                ปรับสถานะ
              </Button>
            </Flex>
          );
        },
      },
      {
        title: translate("bypass_page.col_copy"),
        key: "copy",
        width: 70,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Tooltip title={translate("bypass_page.tooltip_copy")}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                const text = `[${record.school_id}] ${
                  record.company_name ?? ""
                } · ${record.province ?? ""}`.trim();
                void navigator.clipboard
                  .writeText(text)
                  .then(() =>
                    toast.success(translate("bypass_page.copy_success")),
                  );
              }}
            />
          </Tooltip>
        ),
      },
      {
        title: translate("bypass_page.col_actions"),
        key: "action",
        width: 140,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => setBypassModalState({ open: true, school: record })}
          >
            {translate("bypass_page.btn_login")}
          </Button>
        ),
      },
    ],
    [token, translate, schoolStatusOverrides],
  );

  return (
    <DashboardLayout>
      <Flex vertical gap={24}>
        {/* Header */}
        <HeaderBar
          icon={<LoginOutlined />}
          title={translate("bypass_page.title")}
          subTitle={translate("bypass_page.subtitle")}
        />

        {/* Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_total")}
              value={stats.total.toLocaleString()}
              subtitle={translate("bypass_page.stats_total_desc")}
              icon={<BankOutlined />}
              color={token.colorPrimary}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_active")}
              value={stats.active.toLocaleString()}
              subtitle={translate("bypass_page.stats_active_desc")}
              icon={<ThunderboltOutlined />}
              color={token.colorSuccess}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_inactive")}
              value={stats.inactive.toLocaleString()}
              subtitle={translate("bypass_page.stats_inactive_desc")}
              icon={<CloseCircleOutlined />}
              color={token.colorError}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_total_students")}
              value={stats.totalStudents.toLocaleString()}
              subtitle={translate("bypass_page.stats_total_students_desc")}
              icon={<TeamOutlined />}
              color={
                (token as unknown as Record<string, string>)["purple6"] ??
                "#722ed1"
              }
            />
          </Col>
        </Row>

        {/* Filter Section */}
        <Card
          styles={{ body: { padding: 20 } }}
          title={
            <Flex align="center" gap={8}>
              <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
              <Text strong style={{ fontSize: "1rem" }}>
                {translate("bypass_page.filter_title")}
              </Text>
            </Flex>
          }
        >
          <Flex vertical gap={16}>
            <Row gutter={[16, 12]}>
              <Col xs={24}>
                <Select
                  style={{ width: "100%" }}
                  size="large"
                  placeholder="พิมพ์ชื่อโรงเรียนหรือรหัสโรงเรียน..."
                  showSearch
                  allowClear
                  options={bypassState.filterOptions.schools}
                  value={bypassState.filters.school}
                  onChange={(v) =>
                    bypassHandlers.handleFilterChange("school", v)
                  }
                  filterOption={(input, option) =>
                    !!option &&
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="ไม่พบโรงเรียน"
                  loading={bypassState.loading}
                  virtual
                />
              </Col>

              <Col xs={24} lg={12}>
                <Flex vertical gap={12}>
                  <Input
                    size="large"
                    placeholder={translate("bypass_page.placeholder_search")}
                    prefix={<SearchOutlined style={{ opacity: 0.4 }} />}
                    value={bypassState.filters.search}
                    onChange={(e) =>
                      bypassHandlers.handleFilterChange(
                        "search",
                        e.target.value,
                      )
                    }
                    allowClear
                  />
                  <Select
                    style={{ width: "100%" }}
                    size="large"
                    placeholder={translate("bypass_page.placeholder_group")}
                    options={bypassState.filterOptions.schoolGroups}
                    value={bypassState.filters.schoolGroup}
                    onChange={(v) =>
                      bypassHandlers.handleFilterChange("schoolGroup", v)
                    }
                    allowClear
                  />
                </Flex>
              </Col>

              <Col xs={24} lg={12}>
                <Flex vertical gap={12}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Select
                        style={{ width: "100%" }}
                        size="large"
                        placeholder={translate(
                          "bypass_page.placeholder_province",
                        )}
                        showSearch
                        options={bypassState.filterOptions.provinces}
                        value={bypassState.filters.province}
                        onChange={(v) =>
                          bypassHandlers.handleFilterChange("province", v)
                        }
                        allowClear
                      />
                    </Col>
                    <Col span={12}>
                      <Select
                        style={{ width: "100%" }}
                        size="large"
                        placeholder={translate("bypass_page.placeholder_grade")}
                        options={bypassState.filterOptions.grades}
                        value={bypassState.filters.grade}
                        onChange={(v) =>
                          bypassHandlers.handleFilterChange("grade", v)
                        }
                        allowClear
                      />
                    </Col>
                  </Row>
                  <Select
                    style={{ width: "100%" }}
                    size="large"
                    placeholder={translate("bypass_page.placeholder_status")}
                    value={bypassState.filters.status}
                    onChange={(v) =>
                      bypassHandlers.handleFilterChange("status", v)
                    }
                    allowClear
                    options={[
                      {
                        label: translate("bypass_page.status_active"),
                        value: "active",
                      },
                      {
                        label: translate("bypass_page.status_inactive"),
                        value: "inactive",
                      },
                    ]}
                  />
                </Flex>
              </Col>
            </Row>

            <Divider style={{ margin: 0 }} />

            <Flex justify="end" gap={8}>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={bypassHandlers.handleClearFilters}
              >
                {translate("bypass_page.btn_clear")}
              </Button>
              <Button type="primary" size="large" icon={<SearchOutlined />}>
                {translate("bypass_page.btn_search")}
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Table Section */}
        <Card
          styles={{ body: { padding: 16 } }}
          title={
            <Flex align="center" gap={8}>
              <UnorderedListOutlined style={{ fontSize: "1rem" }} />
              <Typography.Text strong style={{ fontSize: "1rem" }}>
                {translate("bypass_page.table_title")}
              </Typography.Text>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                ({filteredSchoolsWithOverrides.length} รายการ)
              </Text>
            </Flex>
          }
          extra={
            <Flex
              gap={8}
              style={{
                padding: "0.5rem",
              }}
            >
              <Button
                icon={<TrophyOutlined />}
                onClick={() => setShowProvinceRanking(true)}
              >
                {translate("bypass_page.btn_province_ranking")}
              </Button>
              <Button
                icon={<TeamOutlined />}
                onClick={() => setShowSaleRanking(true)}
              >
                {translate("bypass_page.btn_sale_ranking")}
              </Button>
            </Flex>
          }
        >
          <Table<SchoolDetail>
            columns={columns}
            dataSource={filteredSchoolsWithOverrides}
            loading={bypassState.loading}
            rowKey={(r) => String(r.school_id)}
            pagination={{
              pageSize: bypassState.pageSize,
              showSizeChanger: true,
              showTotal: (total) =>
                translate("bypass_page.total_records", { total }),
            }}
            scroll={{ x: 2100 }}
            onChange={bypassHandlers.handleTableChange}
            size="middle"
          />
        </Card>
      </Flex>

      {/* Modals */}
      <ProvinceRankingModal
        open={showProvinceRanking}
        onClose={() => setShowProvinceRanking(false)}
        data={provinceStats}
      />
      <SaleRankingModal
        open={showSaleRanking}
        onClose={() => setShowSaleRanking(false)}
        data={saleStats}
      />
      <BypassSelectionModal
        open={bypassModalState.open}
        school={bypassModalState.school}
        onClose={() => setBypassModalState({ open: false, school: null })}
        onSelect={(targetKey, environmentKey) => {
          if (bypassModalState.school) {
            void bypassHandlers.handleBypassClick(
              `${targetKey}|${environmentKey}`,
              bypassModalState.school,
            );
            setBypassModalState({ open: false, school: null });
          }
        }}
      />
      <SchoolStatusModal
        open={statusModalState.open}
        school={statusModalState.school}
        onClose={() => setStatusModalState({ open: false, school: null })}
        onSuccess={(schoolId, active, isActive) => {
          setSchoolStatusOverrides((prev) => ({
            ...prev,
            [schoolId]: { active, isActive },
          }));
        }}
      />
    </DashboardLayout>
  );
}
