"use client";

import React from "react";
import {
  Affix,
  Card,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  Divider,
  theme,
  Row,
  Col,
  Typography,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilePdfOutlined,
  CheckOutlined,
  MailOutlined,
  FileTextOutlined,
  RiseOutlined,
  CalendarOutlined,
  FilterOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "../types/overtime.types";
import { OT_STATUS } from "../types/overtime.types";
import type { NextRouter } from "next/router";
import dayjs from "dayjs";

const { Text } = Typography;

interface FilterBarProps {
  searchText: string;
  setSearchText: (text: string) => void;
  selectedMonth: dayjs.Dayjs | null;
  setSelectedMonth: (month: dayjs.Dayjs | null) => void;
  paginationState: PaginationState;
  handleTableChange: (pagination: any, filters: any) => void;
  fetchOvertimeList: (options?: any) => void;
  loading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchText,
  setSearchText,
  selectedMonth,
  setSelectedMonth,
  paginationState,
  handleTableChange,
  fetchOvertimeList,
  loading,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <Affix offsetTop={20}>
      <Card
        className="shadow-xl rounded-2xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500"
        bodyStyle={{ padding: "24px 28px" }}
        style={{
          background: `linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)`,
          border: "2px solid #f093fb40",
        }}
      >
        {/* Decorative background */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle, #f093fb 0%, transparent 70%)",
          }}
        />

        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", position: "relative", zIndex: 1 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              className="p-2 rounded-xl shadow-md"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <FilterOutlined style={{ color: "#fff", fontSize: 20 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 18, color: "#f5576c" }}>
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
                    <div className="font-semibold mb-1">
                      🔎 ค้นหาอย่างรวดเร็ว
                    </div>
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
                      style={{ color: "#f5576c", fontSize: 14 }}
                    />
                    <Text strong style={{ fontSize: 13, color: "#f5576c" }}>
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
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      borderColor: "#f093fb40",
                    }}
                    allowClear
                    size="large"
                    className="hover:border-pink-400 transition-colors"
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
                    <CheckOutlined style={{ color: "#11998e", fontSize: 14 }} />
                    <Text strong style={{ fontSize: 13, color: "#11998e" }}>
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
                      handleTableChange(
                        { current: 1, pageSize: paginationState.pageSize },
                        { status: val ? [val] : [] },
                      )
                    }
                    className="hover:border-teal-400"
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
                      style={{ color: "#667eea", fontSize: 14 }}
                    />
                    <Text strong style={{ fontSize: 13, color: "#667eea" }}>
                      เดือนที่ยื่นคำขอ
                    </Text>
                    <Tooltip title="กรองจากวันที่ยื่นคำขอ OT">
                      <InfoCircleOutlined
                        style={{ fontSize: 12, color: "#999" }}
                      />
                    </Tooltip>
                  </Space>
                  <DatePicker
                    picker="month"
                    placeholder="เลือกเดือน..."
                    value={selectedMonth}
                    onChange={(date) => {
                      setSelectedMonth(date);
                      handleTableChange(
                        { current: 1, pageSize: paginationState.pageSize },
                        {},
                      );
                    }}
                    style={{ width: "100%", borderRadius: 10 }}
                    allowClear
                    format="MMMM YYYY"
                    size="large"
                    suffixIcon={
                      <CalendarOutlined style={{ color: "#667eea" }} />
                    }
                    className="hover:border-indigo-400"
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
                    <Text strong style={{ fontSize: 13, color: "#ff6b6b" }}>
                      รีเซ็ตการค้นหา
                    </Text>
                  </div>
                  <Button
                    icon={<ReloadOutlined spin={loading} />}
                    onClick={() => {
                      setSelectedMonth(null);
                      setSearchText("");
                      fetchOvertimeList({ page: 1 });
                    }}
                    loading={loading}
                    size="large"
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      borderColor: "#ff6b6b40",
                      color: "#ff6b6b",
                      fontWeight: 500,
                    }}
                    className="hover:scale-105 transition-transform hover:border-red-400 hover:text-red-500"
                  >
                    รีเซ็ต
                  </Button>
                </div>
              </Tooltip>
            </Col>
          </Row>
        </Space>
      </Card>
    </Affix>
  );
};
