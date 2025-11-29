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
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilePdfOutlined,
  CheckOutlined,
  MailOutlined,
  FileTextOutlined,
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
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setProcessedItems: (items: Set<React.Key>) => void;
  loading: boolean;
  batchProcessing: boolean;
  paginationState: PaginationState;
  handleTableChange: (pagination: any, filters: any) => void;
  fetchOvertimeList: (options?: any) => void;
  setVisible: (visible: boolean) => void;
  setBatchStatusModalVisible: (visible: boolean) => void;
  batchSendEmail: () => void;
  router: any;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchText,
  setSearchText,
  selectedMonth,
  setSelectedMonth,
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedItems,
  loading,
  batchProcessing,
  paginationState,
  handleTableChange,
  fetchOvertimeList,
  setVisible,
  setBatchStatusModalVisible,
  batchSendEmail,
  router,
}) => {
  const { t } = useTranslation();

  return (
    <Affix offsetTop={20}>
      <Card
        bordered={false}
        className="shadow-md rounded-xl"
        bodyStyle={{ padding: "12px 24px" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Space wrap>
            <Input
              placeholder={t("overtime_page.search_placeholder")}
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />
            <Select
              placeholder={t("overtime_page.status_filter")}
              style={{ width: 150 }}
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
              style={{ width: 150 }}
              allowClear
              format="MM/YYYY"
            />
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

          <Space wrap>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={() => {
                    const ids = selectedRowKeys.join(",");
                    router.push(`/timesheet/overtime/preview/bulk?ids=${ids}`);
                  }}
                >
                  {t("overtime_page.view_pdf_bulk")} ({selectedRowKeys.length})
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => setBatchStatusModalVisible(true)}
                  loading={batchProcessing}
                >
                  {t("overtime_page.change_status_bulk")} (
                  {selectedRowKeys.length})
                </Button>
                <Button
                  icon={<MailOutlined />}
                  onClick={batchSendEmail}
                  loading={batchProcessing}
                >
                  {t("overtime_page.send_email_bulk")} ({selectedRowKeys.length}
                  )
                </Button>
                <Button
                  type="text"
                  danger
                  onClick={() => {
                    setSelectedRowKeys([]);
                    setProcessedItems(new Set());
                  }}
                >
                  {t("overtime_page.cancel")}
                </Button>
                <Divider type="vertical" />
              </>
            )}
            <Button
              icon={<FileTextOutlined />}
              onClick={() =>
                window.open(
                  "https://docs.google.com/document/d/12eEuCzFtCxE3C_CfhkGZ9J8yo3jiKVD2uANYBMXXnUE/edit?usp=sharing",
                  "_blank"
                )
              }
              danger
            >
              ระเบียบการขอทำงานล่วงเวลา (ต้องอ่านก่อนขอ)
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setVisible(true)}
              className=""
            >
              {t("overtime_page.add_overtime")}
            </Button>
          </Space>
        </div>
      </Card>
    </Affix>
  );
};
