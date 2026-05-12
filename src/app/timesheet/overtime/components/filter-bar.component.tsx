"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "../types/overtime.types";
import { OT_STATUS } from "../types/overtime.types";

const { Text } = Typography;

interface FilterBarProps {
  filterSearchText: string;
  setFilterSearchText: (text: string) => void;
  filterSelectedMonth: dayjs.Dayjs | null;
  setFilterSelectedMonth: (month: dayjs.Dayjs | null) => void;
  paginationState: PaginationState;
  onTableChange: (pagination: any, filters: any) => void;
  fetchOvertimeRequestList: (options?: any) => void;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterSearchText,
  setFilterSearchText,
  filterSelectedMonth,
  setFilterSelectedMonth,
  paginationState,
  onTableChange,
  fetchOvertimeRequestList,
  isLoading,
}) => {
  const { t: translate } = useTranslation();
  const { token } = theme.useToken();

  return (
    <Card
      title={
        <Space>
          <FilterOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
          <Text strong style={{ fontSize: 16, fontWeight: 600 }}>
            {translate("overtime.filterBar.title")}
          </Text>
        </Space>
      }
      style={{
        borderRadius: 16,
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">
              ค้นหาจากคำสำคัญ (ชื่อ, เลขที่, รายละเอียด)
            </Text>
            <Input
              placeholder="พิมพ์คำค้นหา..."
              prefix={
                <SearchOutlined style={{ color: token.colorTextDescription }} />
              }
              value={filterSearchText}
              onChange={(e) => setFilterSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchOvertimeRequestList({ page: 1 });
                }
              }}
              style={{ height: 40, borderRadius: 8 }}
              allowClear
              size="large"
            />
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">เลือกเดือนที่ยื่นคำขอ</Text>
            <DatePicker
              picker="month"
              placeholder="เลือกเดือน..."
              value={filterSelectedMonth}
              onChange={(date) => {
                setFilterSelectedMonth(date);
              }}
              style={{ width: "100%", height: 40, borderRadius: 8 }}
              allowClear
              format="MMMM YYYY"
              size="large"
              suffixIcon={
                <CalendarOutlined style={{ color: token.colorInfo }} />
              }
            />
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">สถานะการอนุมัติ</Text>
            <Select
              placeholder="เลือกสถานะ..."
              style={{ width: "100%", height: 40 }}
              allowClear
              size="large"
              options={OT_STATUS.map((s) => ({
                label: (
                  <div className="flex items-center gap-2">
                    <span>
                      {s.value === "pending" ? (
                        <ClockCircleOutlined />
                      ) : s.value === "approved" || s.value === "paid" ? (
                        <CheckCircleOutlined
                          style={{ color: token.colorSuccess }}
                        />
                      ) : (
                        <CloseCircleOutlined
                          style={{ color: token.colorError }}
                        />
                      )}
                    </span>
                    <span>{s.text}</span>
                  </div>
                ),
                value: s.value,
              }))}
              onChange={(val) =>
                onTableChange(
                  { current: 1, pageSize: paginationState.pageSize },
                  { status: val ? [val] : [] },
                )
              }
            />
          </div>
        </Col>

        <Col xs={24} md={12}>
          {/* เว้นว่างเพื่อให้ปุ่มอยู่ขวาใน row ถัดไป หรือใช้ Space */}
        </Col>

        <Col xs={24}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
            }}
          >
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilterSelectedMonth(null);
                setFilterSearchText("");
                fetchOvertimeRequestList({ page: 1 });
              }}
              style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
            >
              ล้างตัวกรอง
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchOvertimeRequestList({ page: 1 })}
              loading={isLoading}
              style={{
                borderRadius: 8,
                height: 40,
                fontWeight: 600,
                paddingInline: 32,
              }}
            >
              ค้นหาข้อมูล
            </Button>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
