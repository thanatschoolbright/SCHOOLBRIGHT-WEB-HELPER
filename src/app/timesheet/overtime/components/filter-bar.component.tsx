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
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "../types/overtime.types";
import { OT_STATUS } from "../types/overtime.types";
import type { NextRouter } from "next/router";
import dayjs from "dayjs";

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
        className="shadow-md rounded-xl"
        bodyStyle={{ padding: "12px 24px" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Space wrap className="w-full justify-between">
            <Space wrap>
              <Input
                placeholder={t("overtime_page.search_placeholder")}
                prefix={
                  <SearchOutlined
                    style={{ color: token.colorTextDescription }}
                  />
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280, borderRadius: 8 }}
                allowClear
              />
              <Select
                placeholder={t("overtime_page.status_filter")}
                style={{ width: 180 }}
                allowClear
                options={OT_STATUS.map((s) => ({
                  label: s.text,
                  value: s.value,
                }))}
                onChange={(val) =>
                  handleTableChange(
                    { current: 1, pageSize: paginationState.pageSize },
                    { status: val ? [val] : [] }
                  )
                }
              />
              <DatePicker
                picker="month"
                placeholder={t("overtime_page.select_month")}
                value={selectedMonth}
                onChange={(date) => {
                  setSelectedMonth(date);
                  handleTableChange(
                    { current: 1, pageSize: paginationState.pageSize },
                    {}
                  );
                }}
                style={{ width: 180 }}
                allowClear
                format="MM/YYYY"
              />
            </Space>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSelectedMonth(null);
                fetchOvertimeList({ page: 1 });
              }}
              loading={loading}
            >
              {t("overtime_page.reload")}
            </Button>
          </Space>
        </div>
      </Card>
    </Affix>
  );
};
