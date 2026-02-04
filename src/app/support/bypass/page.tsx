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
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BypassSelectionModal from "./components/bypass-selection-modal.component";

// 🚀 Dynamic Imports (Optimize Bundle Size)
const ProvinceRankingModal = dynamic(
  () => import("./components/province-ranking-modal.component"),
  {
    ssr: false,
  },
);
const SaleRankingModal = dynamic(
  () => import("./components/sale-ranking-modal.component"),
  {
    ssr: false,
  },
);

import { useBypassPageData } from "./hooks/bypass.data";
import type { SchoolDetail } from "./types/bypass.types";
import { calculateStatistics } from "./utils/bypass.helpers";
import { calculateProvinceStatistics } from "./utils/province-stats.helpers";
import { calculateSaleStatistics } from "./utils/sale-stats.helpers";

const { Title, Text } = Typography;

/**
 * Generates a color for the Avatar based on the provided name.
 * @param institutionName The name of the school or company.
 */
const getAvatarColor = (institutionName: string) => {
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
  let calculatedHash = 0;
  for (
    let characterIndex = 0;
    characterIndex < institutionName.length;
    characterIndex++
  ) {
    calculatedHash =
      institutionName.charCodeAt(characterIndex) +
      ((calculatedHash << 5) - calculatedHash);
  }
  return colors[Math.abs(calculatedHash) % colors.length];
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
  // * Summary statistics from the dataset (Bypasses active filters)
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
        title: TRANSLATION("bypass_page.col_school_id"),
        dataIndex: "school_id",
        key: "school_id",
        width: 120,
        fixed: "left",
        align: "center",
        sorter: (firstSchool, secondSchool) =>
          Number(firstSchool.school_id) - Number(secondSchool.school_id),
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
        title: TRANSLATION("bypass_page.col_institution"),
        key: "school",
        width: 300,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.company_name ?? "").localeCompare(
            secondSchool.company_name ?? "",
          ),
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
        title: TRANSLATION("bypass_page.col_province"),
        dataIndex: "province",
        key: "province",
        width: 140,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.province ?? "").localeCompare(
            secondSchool.province ?? "",
          ),
      },
      {
        title: TRANSLATION("bypass_page.col_type_level"),
        key: "type_class",
        width: 180,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.school_type ?? "").localeCompare(
            secondSchool.school_type ?? "",
          ),
        render: (_, record) => (
          <Flex vertical gap={4}>
            <Tag
              color="cyan"
              bordered={false}
              style={{ fontSize: 11, width: "fit-content", margin: 0 }}
            >
              {record.school_type || TRANSLATION("bypass_page.not_specified")}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.school_class || TRANSLATION("bypass_page.not_specified")}
            </Text>
          </Flex>
        ),
      },
      {
        title: TRANSLATION("bypass_page.col_team"),
        key: "team",
        width: 220,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.sale_name ?? "").localeCompare(
            secondSchool.sale_name ?? "",
          ),
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
        title: TRANSLATION("bypass_page.col_contract"),
        dataIndex: "school_data_type",
        key: "school_data_type",
        width: 130,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.school_data_type ?? "").localeCompare(
            secondSchool.school_data_type ?? "",
          ),
        render: (type) => (
          <Tag bordered={false} style={{ margin: 0 }}>
            {type || "-"}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("bypass_page.col_launch"),
        dataIndex: "active_date",
        key: "active_date",
        width: 120,
        align: "center",
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.active_date ?? "").localeCompare(
            secondSchool.active_date ?? "",
          ),
      },
      {
        title: TRANSLATION("bypass_page.col_grade"),
        dataIndex: "school_grade",
        key: "school_grade",
        width: 80,
        align: "center",
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.school_grade ?? "").localeCompare(
            secondSchool.school_grade ?? "",
          ),
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
        title: TRANSLATION("bypass_page.col_student_count"),
        dataIndex: "student_count",
        key: "student_count",
        width: 120,
        align: "right",
        sorter: (firstSchool, secondSchool) =>
          Number(firstSchool.student_count || 0) -
          Number(secondSchool.student_count || 0),
        render: (count) => (
          <Text style={{ fontFamily: "monospace" }}>
            {Number(count || 0).toLocaleString()}
          </Text>
        ),
      },
      {
        title: TRANSLATION("bypass_page.col_status"),
        dataIndex: "isActive",
        key: "isActive",
        width: 120,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.isActive ?? "active").localeCompare(
            secondSchool.isActive ?? "active",
          ),
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
                  {isInactive
                    ? TRANSLATION("bypass_page.status_inactive").toUpperCase()
                    : TRANSLATION("bypass_page.status_active").toUpperCase()}
                </Text>
              }
            />
          );
        },
      },
      {
        title: TRANSLATION("bypass_page.col_actions"),
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
            {TRANSLATION("bypass_page.btn_login")}
          </Button>
        ),
      },
    ],
    [token, TRANSLATION],
  );

  return (
    <DashboardLayout>
      <Flex vertical gap={32}>
        {/* Section 1: Page Header */}
        <HeaderBar
          icon={<LoginOutlined />}
          title={TRANSLATION("bypass_page.title")}
          subTitle={TRANSLATION("bypass_page.subtitle")}
        />

        {/* Section 2: Summary Metrics */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={TRANSLATION("bypass_page.stats_total")}
              value={overallStatistics.total.toLocaleString()}
              subtitle={TRANSLATION("bypass_page.stats_total_desc")}
              icon={<BankOutlined />}
              color={token.colorPrimary}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={TRANSLATION("bypass_page.stats_active")}
              value={overallStatistics.active.toLocaleString()}
              subtitle={TRANSLATION("bypass_page.stats_active_desc")}
              icon={<ThunderboltOutlined />}
              color={token.colorSuccess}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={TRANSLATION("bypass_page.stats_inactive")}
              value={overallStatistics.inactive.toLocaleString()}
              subtitle={TRANSLATION("bypass_page.stats_inactive_desc")}
              icon={<CloseCircleOutlined />}
              color={token.colorError}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={TRANSLATION("bypass_page.stats_grade_a")}
              value={overallStatistics.gradeA.toLocaleString()}
              subtitle={TRANSLATION("bypass_page.stats_grade_a_desc")}
              icon={<TrophyOutlined />}
              color={token.colorWarning}
            />
          </Col>
        </Row>

        {/* Section 3: Filter Interface */}
        <Card variant="borderless" styles={{ body: { padding: 24 } }}>
          <Flex vertical gap={24}>
            <Flex align="center" gap={8}>
              <FilterOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Title level={5} style={{ margin: 0 }}>
                {TRANSLATION("bypass_page.filter_title")}
              </Title>
            </Flex>

            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Flex vertical gap={16}>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      {TRANSLATION("bypass_page.label_search")}
                    </Text>
                    <Input
                      size="large"
                      placeholder={TRANSLATION(
                        "bypass_page.placeholder_search",
                      )}
                      prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                      value={state.filters.search}
                      onChange={(event) =>
                        handlers.handleFilterChange(
                          "search",
                          event.target.value,
                        )
                      }
                    />
                  </Flex>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      {TRANSLATION("bypass_page.label_group")}
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder={TRANSLATION("bypass_page.placeholder_group")}
                      options={state.filterOptions.schoolGroups}
                      value={state.filters.schoolGroup}
                      onChange={(selectedValue) =>
                        handlers.handleFilterChange(
                          "schoolGroup",
                          selectedValue,
                        )
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
                          {TRANSLATION("bypass_page.label_province")}
                        </Text>
                        <Select
                          style={{ width: "100%" }}
                          size="large"
                          placeholder={TRANSLATION(
                            "bypass_page.placeholder_province",
                          )}
                          showSearch
                          options={state.filterOptions.provinces}
                          value={state.filters.province}
                          onChange={(selectedValue) =>
                            handlers.handleFilterChange(
                              "province",
                              selectedValue,
                            )
                          }
                          allowClear
                        />
                      </Flex>
                    </Col>
                    <Col span={12}>
                      <Flex vertical gap={8}>
                        <Text strong style={{ fontSize: 13 }}>
                          {TRANSLATION("bypass_page.label_grade")}
                        </Text>
                        <Select
                          style={{ width: "100%" }}
                          size="large"
                          placeholder={TRANSLATION(
                            "bypass_page.placeholder_grade",
                          )}
                          options={state.filterOptions.grades}
                          value={state.filters.grade}
                          onChange={(selectedValue) =>
                            handlers.handleFilterChange("grade", selectedValue)
                          }
                          allowClear
                        />
                      </Flex>
                    </Col>
                  </Row>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      {TRANSLATION("bypass_page.label_status")}
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder={TRANSLATION(
                        "bypass_page.placeholder_status",
                      )}
                      value={state.filters.status}
                      onChange={(selectedValue) =>
                        handlers.handleFilterChange("status", selectedValue)
                      }
                      allowClear
                      options={[
                        {
                          label: TRANSLATION("bypass_page.status_active"),
                          value: "active",
                        },
                        {
                          label: TRANSLATION("bypass_page.status_inactive"),
                          value: "inactive",
                        },
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
                {TRANSLATION("bypass_page.btn_clear")}
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                style={{ padding: "0 32px" }}
              >
                {TRANSLATION("bypass_page.btn_search")}
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Section 4: Main Data Table */}
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
                  {TRANSLATION("bypass_page.table_title")}
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
                  {TRANSLATION("bypass_page.btn_province_ranking")}
                </Button>
                <Button
                  onClick={() => setShowSaleRanking(true)}
                  icon={<TeamOutlined />}
                  type="text"
                  style={{ color: "#f59e0b", fontWeight: 600 }}
                >
                  {TRANSLATION("bypass_page.btn_sale_ranking")}
                </Button>
              </Flex>
            </Flex>

            <Table<SchoolDetail>
              columns={columns}
              dataSource={state.filteredSchools}
              loading={state.loading}
              rowKey={(schoolRecord) => String(schoolRecord.school_id)}
              pagination={{
                pageSize: state.pageSize,
                showSizeChanger: true,
                showTotal: (totalCount) =>
                  TRANSLATION("bypass_page.total_records", {
                    total: totalCount,
                  }),
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
