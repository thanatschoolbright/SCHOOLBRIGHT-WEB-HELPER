"use client";

import React from "react";
import {
  Card,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  theme,
  Row,
  Col,
  Typography,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CalendarOutlined,
  FilterOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "../types/overtime.types";
import { OT_STATUS } from "../types/overtime.types";
import dayjs from "dayjs";

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
      style={{
        borderRadius: 16,
        border: `2px solid ${token.colorBorderSecondary}`,
      }}
      styles={{
        body: { padding: "24px 28px" },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="p-2 rounded-xl"
            style={{
              background: token.colorPrimaryBg,
            }}
          >
            <FilterOutlined
              style={{ color: token.colorPrimary, fontSize: 20 }}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 18, color: token.colorPrimary }}>
              🔍 ค้นหาและกรองข้อมูล
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ใช้ตัวกรองด้านล่างเพื่อค้นหาคำขอ OT ที่ต้องการ
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Tooltip
              title={
                <div className="text-center">
                  <div className="font-semibold mb-1">🔎 ค้นหาอย่างรวดเร็ว</div>
                  <div className="text-xs">
                    พิมพ์ชื่อ, เลขที่คำขอ, หรือรายละเอียดงานเพื่อค้นหา
                  </div>
                </div>
              }
              placement="topLeft"
            >
              <div>
                <div className="mb-2 flex items-center gap-1">
                  <SearchOutlined
                    style={{ color: token.colorPrimary, fontSize: 14 }}
                  />
                  <Text
                    strong
                    style={{ fontSize: 13, color: token.colorPrimary }}
                  >
                    ค้นหาจากคำสำคัญ
                  </Text>
                </div>
                <Input
                  placeholder="พิมพ์ชื่อ, เลขที่, หรือรายละเอียด..."
                  prefix={
                    <SearchOutlined
                      style={{ color: token.colorTextDescription }}
                    />
                  }
                  value={filterSearchText}
                  onChange={(e) => setFilterSearchText(e.target.value)}
                  style={{
                    width: "100%",
                  }}
                  allowClear
                  size="large"
                />
              </div>
            </Tooltip>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Tooltip
              title={
                <div className="text-center">
                  <div className="font-semibold mb-1">✅ กรองตามสถานะ</div>
                  <div className="text-xs">
                    เลือกสถานะเพื่อแสดงเฉพาะรายการที่ต้องการ เช่น รออนุมัติ,
                    อนุมัติแล้ว
                  </div>
                </div>
              }
              placement="top"
            >
              <div>
                <div className="mb-2 flex items-center gap-1">
                  <CheckOutlined
                    style={{ color: token.colorSuccess, fontSize: 14 }}
                  />
                  <Text
                    strong
                    style={{ fontSize: 13, color: token.colorSuccess }}
                  >
                    สถานะการอนุมัติ
                  </Text>
                </div>
                <Select
                  placeholder="เลือกสถานะ..."
                  style={{ width: "100%" }}
                  allowClear
                  size="large"
                  options={OT_STATUS.map((s) => ({
                    label: (
                      <div className="flex items-center gap-2">
                        <span>
                          {s.value === "pending"
                            ? "⏳"
                            : s.value === "approved"
                              ? "✅"
                              : "❌"}
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
            </Tooltip>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Tooltip
              title={
                <div className="text-center">
                  <div className="font-semibold mb-1">📅 กรองตามเดือน</div>
                  <div className="text-xs">
                    เลือกเดือนเพื่อแสดงเฉพาะคำขอ OT ที่ยื่นในเดือนนั้น
                    (ดูจากวันที่ยื่นคำขอ)
                  </div>
                </div>
              }
              placement="top"
            >
              <div>
                <Space size={4} className="mb-2">
                  <CalendarOutlined
                    style={{ color: token.colorInfo, fontSize: 14 }}
                  />
                  <Text strong style={{ fontSize: 13, color: token.colorInfo }}>
                    เดือนที่ยื่นคำขอ
                  </Text>
                  <Tooltip title="กรองจากวันที่ยื่นคำขอ OT">
                    <InfoCircleOutlined
                      style={{
                        fontSize: 12,
                        color: token.colorTextDescription,
                      }}
                    />
                  </Tooltip>
                </Space>
                <DatePicker
                  picker="month"
                  placeholder="เลือกเดือน..."
                  value={filterSelectedMonth}
                  onChange={(date) => {
                    setFilterSelectedMonth(date);
                    onTableChange(
                      { current: 1, pageSize: paginationState.pageSize },
                      {},
                    );
                  }}
                  style={{ width: "100%" }}
                  allowClear
                  format="MMMM YYYY"
                  size="large"
                  suffixIcon={
                    <CalendarOutlined style={{ color: token.colorInfo }} />
                  }
                />
              </div>
            </Tooltip>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Tooltip
              title={
                <div className="text-center">
                  <div className="font-semibold mb-1">🔄 เริ่มต้นใหม่</div>
                  <div className="text-xs">
                    ล้างการค้นหาและตัวกรองทั้งหมด แล้วโหลดข้อมูลใหม่
                  </div>
                </div>
              }
              placement="top"
            >
              <div>
                <div className="mb-2">
                  <Text
                    strong
                    style={{ fontSize: 13, color: token.colorError }}
                  >
                    รีเซ็ตการค้นหา
                  </Text>
                </div>
                <Button
                  icon={<ReloadOutlined spin={isLoading} />}
                  onClick={() => {
                    setFilterSelectedMonth(null);
                    setFilterSearchText("");
                    fetchOvertimeRequestList({ page: 1 });
                  }}
                  loading={isLoading}
                  size="large"
                  danger
                  style={{
                    width: "100%",
                  }}
                >
                  รีเซ็ต
                </Button>
              </div>
            </Tooltip>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};
