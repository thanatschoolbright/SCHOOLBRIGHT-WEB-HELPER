import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  Input,
  DatePicker,
  Button,
  Flex,
  Affix,
  theme,
  Row,
  Col,
  Typography,
  Space,
  Select,
} from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClusterOutlined,
} from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type TimesheetFiltersProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  dateRange: [Dayjs, Dayjs];
  onDateRangeChange: (range: [Dayjs, Dayjs]) => void;
  departmentId: number | null;
  onDepartmentChange: (id: number | null) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  loading: boolean;
};

/**
 * ส่วนกรองข้อมูลสำหรับหน้ารายงานไทม์ชีททั้งหมด
 */
export const TimesheetFilters: React.FC<TimesheetFiltersProps> = ({
  keyword,
  onKeywordChange,
  dateRange,
  onDateRangeChange,
  departmentId,
  onDepartmentChange,
  onRefresh,
  onClearFilters,
  loading,
}) => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();
  const [searchValue, setSearchValue] = useState(keyword);
  const [departments, setDepartments] = useState<any[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);

  /**
   * ดึงข้อมูลแผนกจาก API
   */
  const requestDepartments = useCallback(async () => {
    try {
      setFetchingDepartments(true);
      const response = await callApiService.get(
        "/api/v1/timesheet/department/list",
      );
      if (response.data.status === 200) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("[Filters][departments]", error);
    } finally {
      setFetchingDepartments(false);
    }
  }, []);

  useEffect(() => {
    requestDepartments();
  }, [requestDepartments]);

  /**
   * ส่งค่าการค้นหาไปยังฟังก์ชันหลักเมื่อมีการเปลี่ยนแปลง
   */
  const requestSearchByKeyword = useCallback(
    (value: string) => {
      onKeywordChange(value);
    },
    [onKeywordChange],
  );

  /**
   * จัดการการเปลี่ยนช่วงวันที่และส่งข้อมูลกลับไปยังฟังก์ชันหลัก
   */
  const responseDateRangeChange = useCallback(
    (range: null | (Dayjs | null)[]) => {
      if (range && range[0] && range[1]) {
        onDateRangeChange([range[0], range[1]] as [Dayjs, Dayjs]);
      }
    },
    [onDateRangeChange],
  );

  return (
    <Card
      styles={{
        body: {
          padding: "24px",
        },
      }}
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
        marginBottom: 24,
      }}
    >
      <Flex vertical gap={20}>
        {/* หัวข้อส่วนตัวกรอง */}
        <Space size={8}>
          <FilterOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
          <Text strong style={{ fontSize: 16 }}>
            ตัวกรอง
          </Text>
        </Space>

        {/* ส่วนอินพุต แบ่งเป็น 3 คอลัมน์ */}
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
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
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchValue(val);
                  // Debounce search
                  const timer = setTimeout(() => {
                    requestSearchByKeyword(val);
                  }, 300);
                  return () => clearTimeout(timer);
                }}
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Flex>
          </Col>

          <Col xs={24} md={8}>
            <Flex vertical gap={8}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                แผนก / ฝ่าย
              </Text>
              <Select
                placeholder="เลือกแผนก"
                allowClear
                loading={fetchingDepartments}
                value={departmentId}
                onChange={onDepartmentChange}
                size="large"
                style={{ width: "100%", borderRadius: 8 }}
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

          <Col xs={24} md={8}>
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
                placeholder={[
                  t("timesheet_page.start_date"),
                  t("timesheet_page.end_date"),
                ]}
                style={{ width: "100%", borderRadius: 8 }}
              />
            </Flex>
          </Col>
        </Row>

        {/* ปุ่มล้างการค้นหาและปุ่มค้นหา ชิดขวา */}
        <Flex justify="flex-end" gap={12}>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setSearchValue("");
              onClearFilters();
            }}
            size="large"
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            ล้างการค้นหา
          </Button>
          <Button
            icon={<ReloadOutlined />}
            type="primary"
            onClick={onRefresh}
            loading={loading}
            size="large"
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            ค้นหาข้อมูล
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};
