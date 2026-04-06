"use client";

import { responseDepartmentList } from "@/app/timesheet/all/_api/timesheet-all-api";
import { useTimesheetAllStore } from "@/app/timesheet/all/_stores/timesheet-all-store";
import {
  ClearOutlined,
  ClusterOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Input,
  Row,
  Select,
  Space,
  theme,
  Typography,
} from "antd";
import { Dayjs } from "dayjs";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;
const { Text } = Typography;

/**
 * ส่วนกรองข้อมูลสำหรับหน้ารายงานไทม์ชีททั้งหมด — อ่าน/เขียน state ผ่าน useTimesheetAllStore
 */
export const FilterSection: React.FC = () => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  const keyword = useTimesheetAllStore((s) => s.keyword);
  const dateRange = useTimesheetAllStore((s) => s.dateRange);
  const departmentIds = useTimesheetAllStore((s) => s.departmentIds);
  const loading = useTimesheetAllStore((s) => s.loading);
  const setKeyword = useTimesheetAllStore((s) => s.setKeyword);
  const setDateRange = useTimesheetAllStore((s) => s.setDateRange);
  const setDepartmentIds = useTimesheetAllStore((s) => s.setDepartmentIds);
  const resetFilters = useTimesheetAllStore((s) => s.resetFilters);

  const [searchValue, setSearchValue] = useState(keyword);
  const [departments, setDepartments] = useState<any[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);

  // ดึงข้อมูลแผนกจาก API เมื่อ component mount
  const requestDepartments = useCallback(async () => {
    setFetchingDepartments(true);
    try {
      const data = await responseDepartmentList();
      setDepartments(data);
    } catch (error) {
      console.error("[FilterSection][departments]", error);
    } finally {
      setFetchingDepartments(false);
    }
  }, []);

  useEffect(() => {
    requestDepartments();
  }, [requestDepartments]);

  const responseDateRangeChange = useCallback(
    (
      range: Parameters<
        NonNullable<React.ComponentProps<typeof RangePicker>["onChange"]>
      >[0],
    ) => {
      if (range && range[0] && range[1]) {
        setDateRange([range[0] as Dayjs, range[1] as Dayjs]);
      }
    },
    [setDateRange],
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    resetFilters();
  }, [resetFilters]);

  const handleSearch = useCallback(() => {
    setKeyword(searchValue);
  }, [searchValue, setKeyword]);

  return (
    <Card
      styles={{ body: { padding: "24px" } }}
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
        marginBottom: 24,
      }}
    >
      <Flex vertical gap={16}>
        <Space size={8} style={{ marginBottom: 16 }}>
          <FilterOutlined
            style={{ color: token.colorPrimary, fontSize: "1rem" }}
          />
          <Text style={{ fontSize: "1rem", fontWeight: 600 }}>ตัวกรอง</Text>
        </Space>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                ค้นหาพนักงาน
              </Text>
              <Input
                placeholder={t("timesheet_page.search_placeholder")}
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextDescription }}
                  />
                }
                allowClear
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onPressEnter={handleSearch}
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Flex>
          </Col>

          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                แผนก / ฝ่าย
              </Text>
              <Select
                mode="multiple"
                placeholder="เลือกแผนก (เลือกได้หลายแผนก)"
                allowClear
                loading={fetchingDepartments}
                value={departmentIds}
                onChange={setDepartmentIds}
                size="large"
                style={{ width: "100%", borderRadius: 8 }}
                maxTagCount="responsive"
                suffixIcon={
                  <ClusterOutlined
                    style={{ color: token.colorTextDescription }}
                  />
                }
                options={departments.map((dept) => ({
                  label: dept.name_th || dept.name_en,
                  value: dept.id,
                }))}
              />
            </Flex>
          </Col>

          <Col xs={24} md={12}>
            <Flex vertical gap={8}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                ช่วงวันที่
              </Text>
              <RangePicker
                allowClear={false}
                value={dateRange}
                onChange={responseDateRangeChange}
                format="DD/MM/YYYY"
                size="large"
                style={{ width: "100%", borderRadius: 8 }}
                placeholder={[
                  t("timesheet_page.start_date"),
                  t("timesheet_page.end_date"),
                ]}
              />
            </Flex>
          </Col>

          <Col xs={24} md={12}>
            <Flex
              justify="flex-end"
              align="flex-end"
              style={{ height: "100%" }}
            >
              <Space size={12}>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  size="large"
                  shape="round"
                >
                  ล้างการค้นหา
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={loading}
                  size="large"
                  shape="round"
                >
                  ค้นหา
                </Button>
              </Space>
            </Flex>
          </Col>
        </Row>
      </Flex>
    </Card>
  );
};
