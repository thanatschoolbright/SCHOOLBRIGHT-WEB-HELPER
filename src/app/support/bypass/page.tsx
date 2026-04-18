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
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

const { Text } = Typography;

const generateAvatarBackgroundColor = (
  institutionName: string,
  tokenMap: Record<string, string>,
) => {
  const colorKeys = [
    "red6",
    "volcano6",
    "orange6",
    "gold6",
    "yellow6",
    "lime6",
    "green6",
    "cyan6",
    "blue6",
    "geekblue6",
    "purple6",
    "magenta6",
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
  const key = colorKeys[Math.abs(calculatedHash) % colorKeys.length];
  return tokenMap[key] ?? "#722ed1";
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
          <div className="flex items-center justify-center">
            <div className="relative group/id">
              <Tag
                color="geekblue"
                bordered={false}
                className="relative m-0 font-bold text-sm px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 rounded-lg"
              >
                {id}
              </Tag>
            </div>
          </div>
        ),
      },
      {
        title: translate("bypass_page.col_institution"),
        key: "school",
        width: 320,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.company_name ?? "").localeCompare(
            secondSchool.company_name ?? "",
          ),
        render: (_, record) => (
          <Flex align="center" gap={16} className="group/school">
            <div className="relative">
              <Avatar
                className="relative border-2 border-white dark:border-slate-800 transition-transform duration-300 group-hover/school:scale-110"
                style={{
                  backgroundColor: generateAvatarBackgroundColor(
                    record.company_name ?? "",
                    token as unknown as Record<string, string>,
                  ),
                }}
                shape="square"
                size={48}
              >
                {record.company_name?.charAt(0)}
              </Avatar>
            </div>
            <Flex vertical gap={2}>
              <Text
                strong
                className="text-sm transition-colors duration-300 group-hover/school:text-orange-500"
              >
                {record.company_name}
              </Text>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {translate("bypass_page.col_school_code")}:{" "}
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {record.school_code || "-"}
                  </span>
                </Text>
              </div>
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
        render: (province) => (
          <div className="flex items-center gap-2 cursor-default">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {province}
            </span>
          </div>
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
          <Flex vertical gap={6}>
            <Tag
              color="cyan"
              bordered={false}
              className="text-[10px] uppercase tracking-wider font-bold m-0 px-2 py-0 content-center h-5 flex items-center bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 border border-cyan-100 dark:border-cyan-900/50"
            >
              {record.school_type || translate("bypass_page.not_specified")}
            </Tag>
            <div className="flex items-center gap-1.5 opacity-70">
              <div className="text-[10px] text-slate-400">●</div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.school_class || translate("bypass_page.not_specified")}
              </Text>
            </div>
          </Flex>
        ),
      },
      {
        title: translate("bypass_page.col_team"),
        key: "team",
        width: 240,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.sale_name ?? "").localeCompare(
            secondSchool.sale_name ?? "",
          ),
        render: (_, record) => (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <Flex align="center" gap={8}>
              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                <UserOutlined
                  style={{ color: token.colorWarning, fontSize: 10 }}
                />
              </div>
              <Text style={{ fontSize: 12 }} className="font-medium">
                {record.sale_name || "-"}
              </Text>
            </Flex>
            <Flex align="center" gap={8}>
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <CustomerServiceOutlined
                  style={{ color: token.colorSuccess, fontSize: 10 }}
                />
              </div>
              <Text style={{ fontSize: 12 }} className="font-medium">
                {record.support_name || "-"}
              </Text>
            </Flex>
          </div>
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
          <div className="flex justify-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {type || "-"}
            </span>
          </div>
        ),
      },
      {
        title: translate("bypass_page.col_launch"),
        dataIndex: "active_date",
        key: "active_date",
        width: 140,
        align: "center",
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.active_date ?? "").localeCompare(
            secondSchool.active_date ?? "",
          ),
        render: (activeDate: string | undefined) => {
          if (!activeDate) return <Text type="secondary">-</Text>;
          const parsedDate = new Date(activeDate);
          const daysSinceLaunch = Math.floor(
            (Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          const isNew = !Number.isNaN(daysSinceLaunch) && daysSinceLaunch <= 30;
          return (
            <Flex vertical align="center" gap={4}>
              <div className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                {activeDate}
              </div>
              {isNew && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Tag
                    color="green"
                    bordered={false}
                    className="m-0 text-[9px] font-black uppercase tracking-tighter rounded"
                  >
                    {translate("bypass_page.badge_new_school")}
                  </Tag>
                </motion.div>
              )}
            </Flex>
          );
        },
      },
      {
        title: translate("bypass_page.col_grade"),
        dataIndex: "school_grade",
        key: "school_grade",
        width: 100,
        align: "center",
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.school_grade ?? "").localeCompare(
            secondSchool.school_grade ?? "",
          ),
        render: (grade) => (
          <div className="flex justify-center">
            <div className="flex flex-col items-center group/grade">
              <StarFilled className="text-amber-400 text-lg transition-transform duration-300 group-hover/grade:scale-125 group-hover/grade:rotate-12" />
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {grade || "N/A"}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: translate("bypass_page.col_student_count"),
        dataIndex: "student_count",
        key: "student_count",
        width: 160,
        align: "right",
        sorter: (firstSchool, secondSchool) =>
          Number(firstSchool.student_count || 0) -
          Number(secondSchool.student_count || 0),
        render: (count) => {
          const studentCount = Number(count || 0);
          let tier: string;
          let tierStyle: string;
          if (studentCount >= 2000) {
            tier = "XL";
            tierStyle = "bg-purple-500";
          } else if (studentCount >= 1000) {
            tier = "L";
            tierStyle = "bg-blue-500";
          } else if (studentCount >= 500) {
            tier = "M";
            tierStyle = "bg-emerald-500";
          } else {
            tier = "S";
            tierStyle = "bg-slate-400";
          }
          return (
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {studentCount.toLocaleString()}
              </span>
              <div
                className={`text-[9px] px-1.5 py-0.5 rounded text-white font-black leading-none ${tierStyle}`}
              >
                TIER {tier}
              </div>
            </div>
          );
        },
      },
      {
        title: translate("bypass_page.col_status"),
        dataIndex: "isActive",
        key: "isActive",
        width: 140,
        sorter: (firstSchool, secondSchool) =>
          (firstSchool.isActive ?? "active").localeCompare(
            secondSchool.isActive ?? "active",
          ),
        render: (status) => {
          const isInactive = status === "inactive";
          return (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                isInactive
                  ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isInactive ? "bg-rose-500" : "bg-emerald-500"
                }`}
              />
              <span className="text-[10px] font-black tracking-widest uppercase">
                {isInactive
                  ? translate("bypass_page.status_inactive")
                  : translate("bypass_page.status_active")}
              </span>
            </div>
          );
        },
      },
      {
        title: translate("bypass_page.col_copy"),
        key: "copy",
        width: 80,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Tooltip title={translate("bypass_page.tooltip_copy")}>
            <button
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300 border border-slate-200 dark:border-slate-700"
              onClick={() => {
                const text = `[${record.school_id}] ${
                  record.company_name ?? ""
                } · ${record.province ?? ""}`.trim();
                void navigator.clipboard.writeText(text).then(() => {
                  toast.success(translate("bypass_page.copy_success"));
                });
              }}
            >
              <CopyOutlined className="text-base" />
            </button>
          </Tooltip>
        ),
      },
      {
        title: translate("bypass_page.col_actions"),
        key: "action",
        width: 160,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="primary"
              className="h-10 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 border-none transition-all"
              icon={<LoginOutlined />}
              onClick={() => {
                setBypassSelectionModalState({ open: true, school: record });
              }}
            >
              {translate("bypass_page.btn_login")}
            </Button>
          </motion.div>
        ),
      },
    ],
    [token, translate],
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Flex vertical gap={32}>
          <HeaderBar
            icon={<LoginOutlined />}
            title={translate("bypass_page.title")}
            subTitle={translate("bypass_page.subtitle")}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
          >
            <Row gutter={[20, 20]}>
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SummaryCard
                    title={translate("bypass_page.stats_total")}
                    value={overallBypassStatistics.total.toLocaleString()}
                    subtitle={translate("bypass_page.stats_total_desc")}
                    icon={<BankOutlined />}
                    color={token.colorPrimary}
                  />
                </motion.div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SummaryCard
                    title={translate("bypass_page.stats_active")}
                    value={overallBypassStatistics.active.toLocaleString()}
                    subtitle={translate("bypass_page.stats_active_desc")}
                    icon={<ThunderboltOutlined />}
                    color={token.colorSuccess}
                  />
                </motion.div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SummaryCard
                    title={translate("bypass_page.stats_inactive")}
                    value={overallBypassStatistics.inactive.toLocaleString()}
                    subtitle={translate("bypass_page.stats_inactive_desc")}
                    icon={<CloseCircleOutlined />}
                    color={token.colorError}
                  />
                </motion.div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SummaryCard
                    title={translate("bypass_page.stats_total_students")}
                    value={overallBypassStatistics.totalStudents.toLocaleString()}
                    subtitle={translate(
                      "bypass_page.stats_total_students_desc",
                    )}
                    icon={<TeamOutlined />}
                    color={
                      (token as unknown as Record<string, string>)["purple6"] ??
                      "#722ed1"
                    }
                  />
                </motion.div>
              </Col>
            </Row>
          </motion.div>

          <Card
            styles={{ body: { padding: 24 } }}
            className="border-none shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
            <Flex vertical gap={24}>
              <Flex align="center" gap={8}>
                <FilterOutlined style={{ fontSize: "1rem" }} />
                <Text strong style={{ fontSize: 14 }}>
                  {translate("bypass_page.filter_title")}
                </Text>
              </Flex>

              <Row gutter={[16, 12]}>
                {/* Dropdown ค้นหาโรงเรียน — full width */}
                <Col xs={24}>
                  <Flex vertical gap={8}>
                    <Text strong style={{ fontSize: 13 }}>
                      ค้นหาโรงเรียน
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="พิมพ์ชื่อโรงเรียนหรือรหัสโรงเรียน..."
                      showSearch
                      allowClear
                      options={bypassState.filterOptions.schools}
                      value={bypassState.filters.school}
                      onChange={(selectedValue) => {
                        bypassHandlers.handleFilterChange(
                          "school",
                          selectedValue,
                        );
                      }}
                      filterOption={(inputValue, option) => {
                        if (!option) return false;
                        return option.label
                          .toLowerCase()
                          .includes(inputValue.toLowerCase());
                      }}
                      notFoundContent="ไม่พบโรงเรียน"
                      loading={bypassState.loading}
                      virtual
                    />
                  </Flex>
                </Col>

                <Col xs={24} lg={12}>
                  <Flex vertical gap={16}>
                    <Flex vertical gap={8}>
                      <Text strong style={{ fontSize: 13 }}>
                        {translate("bypass_page.label_search")}
                      </Text>
                      <Input
                        size="large"
                        placeholder={translate(
                          "bypass_page.placeholder_search",
                        )}
                        prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                        value={bypassState.filters.search}
                        onChange={(event) => {
                          bypassHandlers.handleFilterChange(
                            "search",
                            event.target.value,
                          );
                        }}
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
                        onChange={(selectedValue) => {
                          bypassHandlers.handleFilterChange(
                            "schoolGroup",
                            selectedValue,
                          );
                        }}
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
                            onChange={(selectedValue) => {
                              bypassHandlers.handleFilterChange(
                                "province",
                                selectedValue,
                              );
                            }}
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
                            onChange={(selectedValue) => {
                              bypassHandlers.handleFilterChange(
                                "grade",
                                selectedValue,
                              );
                            }}
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
                        placeholder={translate(
                          "bypass_page.placeholder_status",
                        )}
                        value={bypassState.filters.status}
                        onChange={(selectedValue) => {
                          bypassHandlers.handleFilterChange(
                            "status",
                            selectedValue,
                          );
                        }}
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
                <Button type="primary" size="large" icon={<SearchOutlined />}>
                  {translate("bypass_page.btn_search")}
                </Button>
              </Flex>
            </Flex>
          </Card>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              variant="borderless"
              styles={{ body: { padding: 16 } }}
              className="group"
              style={{
                border: `1px solid ${token.colorBorderSecondary}`,
                background: "transparent",
              }}
            >
              <Flex vertical gap={16}>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={12}>
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                      <UnorderedListOutlined style={{ fontSize: "1.2rem" }} />
                    </div>
                    <Flex vertical gap={2}>
                      <Text strong style={{ fontSize: 16, margin: 0 }}>
                        {translate("bypass_page.table_title")}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        พบข้อมูลทั้งหมด {bypassState.filteredSchools.length}{" "}
                        รายการ
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex gap={8}>
                    <Button
                      onClick={() => {
                        setShowProvinceRanking(true);
                      }}
                      icon={<TrophyOutlined />}
                      className="hover:bg-purple-500/10 transition-colors"
                      type="text"
                      style={{
                        color:
                          (token as unknown as Record<string, string>)[
                            "purple6"
                          ] ?? "#722ed1",
                        fontWeight: 600,
                      }}
                    >
                      {translate("bypass_page.btn_province_ranking")}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSaleRanking(true);
                      }}
                      icon={<TeamOutlined />}
                      className="hover:bg-orange-500/10 transition-colors"
                      type="text"
                      style={{ color: token.colorWarning, fontWeight: 600 }}
                    >
                      {translate("bypass_page.btn_sale_ranking")}
                    </Button>
                  </Flex>
                </Flex>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
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
                </div>
              </Flex>
            </Card>
          </motion.div>
        </Flex>

        <ProvinceRankingModal
          open={showProvinceRanking}
          onClose={() => {
            setShowProvinceRanking(false);
          }}
          data={provinceRankingStatistics}
        />
        <SaleRankingModal
          open={showSaleRanking}
          onClose={() => {
            setShowSaleRanking(false);
          }}
          data={saleTeamStatistics}
        />

        <BypassSelectionModal
          open={bypassSelectionModalState.open}
          school={bypassSelectionModalState.school}
          onClose={() => {
            setBypassSelectionModalState({ open: false, school: null });
          }}
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
      </motion.div>
    </DashboardLayout>
  );
}
