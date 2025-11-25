import { CalendarOutlined, FilterOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Input, Select, Space, Typography } from "antd";
import { Dayjs } from "dayjs";
import { UserFilters } from "../types/user-profile.types";

const { RangePicker } = DatePicker;

interface FiltersProps {
  title: string;
  searchPlaceholder: string;
  positionPlaceholder: string;
  dateRangeLabel: string;
  resetLabel: string;
  filters: UserFilters;
  positions: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPositionChange: (value?: string) => void;
  onDateRangeChange: (value: [Dayjs, Dayjs] | null) => void;
  onReset: () => void;
}

export const Filters = ({
  title,
  searchPlaceholder,
  positionPlaceholder,
  dateRangeLabel,
  resetLabel,
  filters,
  positions,
  searchValue,
  onSearchChange,
  onPositionChange,
  onDateRangeChange,
  onReset,
}: FiltersProps) => (
  <Card
    title={
      <Space>
        <FilterOutlined />
        <Typography.Text strong>{title}</Typography.Text>
      </Space>
    }
    className="border-none shadow-sm"
  >
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Space direction="vertical" className="w-full md:max-w-md">
        <Input
          allowClear
          value={searchValue}
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined />}
          onChange={(e) => onSearchChange(e.target.value)}
          className="transition-all duration-200 hover:shadow-sm"
        />
      </Space>
      <Space className="w-full flex-wrap justify-end gap-2 md:w-auto">
        <Select
          allowClear
          className="min-w-[180px]"
          placeholder={positionPlaceholder}
          value={filters.position}
          options={positions.map((pos) => ({ label: pos, value: pos }))}
          onChange={onPositionChange}
        />
        <RangePicker
          value={filters.dateRange ?? null}
          onChange={(dates) => onDateRangeChange(dates as [Dayjs, Dayjs] | null)}
          placeholder={[dateRangeLabel, dateRangeLabel]}
          allowClear
          suffixIcon={<CalendarOutlined />}
          className="w-full md:w-auto"
        />
        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={onReset}
          className="transition-all duration-200 hover:shadow"
        >
          {resetLabel}
        </Button>
      </Space>
    </div>
  </Card>
);
