import React, { useState, useCallback } from "react";
import { Card, Space, Input, DatePicker, Button, Select, Affix } from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

type TimesheetFiltersProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  dateRange: [Dayjs, Dayjs];
  onDateRangeChange: (range: [Dayjs, Dayjs]) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  loading: boolean;
};

export const TimesheetFilters: React.FC<TimesheetFiltersProps> = ({
  keyword,
  onKeywordChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onClearFilters,
  loading,
}) => {
  const { t } = useTranslation("translate");
  const [searchValue, setSearchValue] = useState(keyword);

  const handleSearch = useCallback(
    (value: string) => {
      onKeywordChange(value);
    },
    [onKeywordChange]
  );

  const handleRangeChange = useCallback(
    (range: null | (Dayjs | null)[]) => {
      if (range && range[0] && range[1]) {
        onDateRangeChange([range[0], range[1]] as [Dayjs, Dayjs]);
      }
    },
    [onDateRangeChange]
  );

  return (
    <Affix offsetTop={16}>
      <Card
        className="mb-6 rounded-xl shadow-md border-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder={t("timesheet_page.search_placeholder")}
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                const timer = setTimeout(() => {
                  handleSearch(e.target.value);
                }, 300);
                return () => clearTimeout(timer);
              }}
              className="flex-1 min-w-[200px] rounded-lg"
              size="large"
            />

            <RangePicker
              allowClear={false}
              value={dateRange}
              onChange={handleRangeChange}
              format="DD/MM/YYYY"
              className="rounded-lg"
              size="large"
              placeholder={[
                t("timesheet_page.start_date"),
                t("timesheet_page.end_date"),
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              type="primary"
              onClick={onRefresh}
              loading={loading}
              className="rounded-lg"
              size="large"
            >
              {t("timesheet_page.refresh_button")}
            </Button>

            <Button
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              className="rounded-lg"
              size="large"
            >
              {t("timesheet_page.clear_filters")}
            </Button>
          </div>
        </Space>
      </Card>
    </Affix>
  );
};
