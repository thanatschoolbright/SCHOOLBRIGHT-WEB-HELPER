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
import { useBypassPageData } from "./hooks/bypass.data";
import type { SchoolDetail } from "./types/bypass.types";
import { calculateStatistics } from "./utils/bypass.helpers";
import { calculateProvinceStatistics } from "./utils/province-stats.helpers";
import { calculateSaleStatistics } from "./utils/sale-stats.helpers";

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

const { Title, Text } = Typography;

const generateAvatarBackgroundColor = (institutionName: string) => {
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
  const { t: translate } = useTranslation("translate");
  const { token } = theme.useToken();
  const { state: bypassState, handlers: bypassHandlers } = useBypassPageData();

  const [showProvinceRanking, setShowProvinceRanking] = useState(false);
  const [showSaleRanking, setShowSaleRanking] = useState(false);
  const [bypassSelectionModalState, setBypassSelectionModalState] = useState<{
    open: boolean;
    school: SchoolDetail | null;
  }>({
    open: false,
    school: null,
  });

  const overallBypassStatistics = useMemo(
    () => calculateStatistics(bypassState.schoolDetails ?? []),
    [bypassState.schoolDetails],
  );

  const provinceRankingStatistics = useMemo(
    () => calculateProvinceStatistics(bypassState.schoolDetails),
    [bypassState.schoolDetails],
  );

  const saleTeamStatistics = useMemo(
    () => calculateSaleStatistics(bypassState.schoolDetails),
    [bypassState.schoolDetails],
  );

  const columns: ColumnsType<SchoolDetail> = useMemo(
    () => [
      {
        title: translate("bypass_page.col_school_id"),
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
        title: translate("bypass_page.col_institution"),
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
                backgroundColor: generateAvatarBackgroundColor(
                  record.company_name ?? "",
                ),
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
        title: translate("bypass_page.col_province"),
        dataIndex: "province",
        key: "province",
        width: 140,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.province ?? "").localeCompare(
            secondSchool.province ?? "",
          ),
      },
      {
        title: translate("bypass_page.col_type_level"),
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
        title: translate("bypass_page.col_contract"),
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
        title: translate("bypass_page.col_launch"),
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
        title: translate("bypass_page.col_grade"),
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
        title: translate("bypass_page.col_student_count"),
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
        title: translate("bypass_page.col_status"),
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
                    ? translate("bypass_page.status_inactive").toUpperCase()
                    : translate("bypass_page.status_active").toUpperCase()}
                </Text>
              }
            />
          );
        },
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
            onClick={() =>
              setBypassSelectionModalState({ open: true, school: record })
            }
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            {translate("bypass_page.btn_login")}
          </Button>
        ),
      },
    ],
    [token, translate],
  );

  return (
    <DashboardLayout>
      <Flex vertical gap={32}>
        <HeaderBar
          icon={<LoginOutlined />}
          title={translate("bypass_page.title")}
          subTitle={translate("bypass_page.subtitle")}
        />

        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_total")}
              value={overallBypassStatistics.total.toLocaleString()}
              subtitle={translate("bypass_page.stats_total_desc")}
              icon={<BankOutlined />}
              color={token.colorPrimary}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_active")}
              value={overallBypassStatistics.active.toLocaleString()}
              subtitle={translate("bypass_page.stats_active_desc")}
              icon={<ThunderboltOutlined />}
              color={token.colorSuccess}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_inactive")}
              value={overallBypassStatistics.inactive.toLocaleString()}
              subtitle={translate("bypass_page.stats_inactive_desc")}
              icon={<CloseCircleOutlined />}
              color={token.colorError}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title={translate("bypass_page.stats_grade_a")}
              value={overallBypassStatistics.gradeA.toLocaleString()}
              subtitle={translate("bypass_page.stats_grade_a_desc")}
              icon={<TrophyOutlined />}
              color={token.colorWarning}
            />
          </Col>
        </Row>

        <Card variant="borderless" styles={{ body: { padding: 24 } }}>
          <Flex vertical gap={24}>
            <Flex align="center" gap={8}>
              <FilterOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Title level={5} style={{ margin: 0 }}>
                {translate("bypass_page.filter_title")}
              </Title>
            </Flex>

            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Flex vertical gap={16}>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      {translate("bypass_page.label_search")}
                    </Text>
                    <Input
                      size="large"
                      placeholder={translate("bypass_page.placeholder_search")}
                      prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                      value={bypassState.filters.search}
                      onChange={(event) =>
                        bypassHandlers.handleFilterChange(
                          "search",
                          event.target.value,
                        )
                      }
                    />
                  </Flex>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      {translate("bypass_page.label_group")}
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder={translate("bypass_page.placeholder_group")}
                      options={bypassState.filterOptions.schoolGroups}
                      value={bypassState.filters.schoolGroup}
                      onChange={(selectedValue) =>
                        bypassHandlers.handleFilterChange(
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
                          {translate("bypass_page.label_province")}
                        </Text>
                        <Select
                          style={{ width: "100%" }}
                          size="large"
                          placeholder={translate(
                            "bypass_page.placeholder_province",
                          )}
                          showSearch
                          options={bypassState.filterOptions.provinces}
                          value={bypassState.filters.province}
                          onChange={(selectedValue) =>
                            bypassHandlers.handleFilterChange(
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
                          {translate("bypass_page.label_grade")}
                        </Text>
                        <Select
                          style={{ width: "100%" }}
                          size="large"
                          placeholder={translate(
                            "bypass_page.placeholder_grade",
                          )}
                          options={bypassState.filterOptions.grades}
                          value={bypassState.filters.grade}
                          onChange={(selectedValue) =>
                            bypassHandlers.handleFilterChange(
                              "grade",
                              selectedValue,
                            )
                          }
                          allowClear
                        />
                      </Flex>
                    </Col>
                  </Row>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      {translate("bypass_page.label_status")}
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder={translate("bypass_page.placeholder_status")}
                      value={bypassState.filters.status}
                      onChange={(selectedValue) =>
                        bypassHandlers.handleFilterChange(
                          "status",
                          selectedValue,
                        )
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
                </Flex>
              </Col>
            </Row>

            <Divider style={{ margin: 0 }} />

            <Flex justify="end" gap={12}>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={bypassHandlers.handleClearFilters}
              >
                {translate("bypass_page.btn_clear")}
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                style={{ padding: "0 32px" }}
              >
                {translate("bypass_page.btn_search")}
              </Button>
            </Flex>
          </Flex>
        </Card>

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
                  {translate("bypass_page.table_title")}
                </Title>
                <Badge
                  count={bypassState.filteredSchools.length}
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
                  {translate("bypass_page.btn_province_ranking")}
                </Button>
                <Button
                  onClick={() => setShowSaleRanking(true)}
                  icon={<TeamOutlined />}
                  type="text"
                  style={{ color: "#f59e0b", fontWeight: 600 }}
                >
                  {translate("bypass_page.btn_sale_ranking")}
                </Button>
              </Flex>
            </Flex>

            <Table<SchoolDetail>
              columns={columns}
              dataSource={bypassState.filteredSchools}
              loading={bypassState.loading}
              rowKey={(schoolRecord) => String(schoolRecord.school_id)}
              pagination={{
                pageSize: bypassState.pageSize,
                showSizeChanger: true,
                showTotal: (totalCount) =>
                  translate("bypass_page.total_records", {
                    total: totalCount,
                  }),
              }}
              scroll={{ x: 2000 }}
              onChange={bypassHandlers.handleTableChange}
            />
          </Flex>
        </Card>

        <ProvinceRankingModal
          open={showProvinceRanking}
          onClose={() => setShowProvinceRanking(false)}
          data={provinceRankingStatistics}
        />
        <SaleRankingModal
          open={showSaleRanking}
          onClose={() => setShowSaleRanking(false)}
          data={saleTeamStatistics}
        />

        <BypassSelectionModal
          open={bypassSelectionModalState.open}
          school={bypassSelectionModalState.school}
          onClose={() =>
            setBypassSelectionModalState({ open: false, school: null })
          }
          onSelect={(targetKey, environmentKey) => {
            if (bypassSelectionModalState.school) {
              void bypassHandlers.handleBypassClick(
                `${targetKey}|${environmentKey}`,
                bypassSelectionModalState.school,
              );
              setBypassSelectionModalState({ open: false, school: null });
            }
          }}
        />
      </Flex>
    </DashboardLayout>
  );
}
