import { callApiService } from "@/services/axios-instance/sb-helper.axios";
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

type TimesheetFiltersProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  dateRange: [Dayjs, Dayjs];
  onDateRangeChange: (range: [Dayjs, Dayjs]) => void;
  departmentIds: number[];
  onDepartmentsChange: (ids: number[]) => void;
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
  departmentIds,
  onDepartmentsChange,
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
      <Flex vertical gap={16}>
        {/* หัวข้อส่วนตัวกรอง */}
        <Space size={8} style={{ marginBottom: 16 }}>
          <FilterOutlined
            style={{ color: token.colorPrimary, fontSize: "1rem" }}
          />
          <Text style={{ fontSize: "1rem", fontWeight: 600 }}>ตัวกรอง</Text>
        </Space>

        {/* ส่วนอินพุต แบ่งเป็น 2 คอลัมน์ต่อแถว */}
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
                onPressEnter={() => onKeywordChange(searchValue)}
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
                onChange={onDepartmentsChange}
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

          {/* ปุ่มจัดการฟิลเตอร์ วางชิดขวาด้านล่าง */}
          <Col xs={24} md={12}>
            <Flex
              justify="flex-end"
              align="flex-end"
              style={{ height: "100%" }}
            >
              <Space size={12}>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => {
                    setSearchValue("");
                    onClearFilters();
                  }}
                  size="large"
                  shape="round"
                >
                  ล้างการค้นหา
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => onKeywordChange(searchValue)}
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
