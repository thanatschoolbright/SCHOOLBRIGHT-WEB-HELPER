import React, { useState, useEffect } from "react";
import { Card, Input, Select, Space, Button } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface FilterBarProps {
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onCategoryFilter: (value: string) => void;
  onDeletedFilter: (value: string) => void;
  onReset: () => void;
  categories: Array<{ id: string; name: string }>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onSearch,
  onStatusFilter,
  onCategoryFilter,
  onDeletedFilter,
  onReset,
  categories,
}) => {
  const { t } = useTranslation("translate");
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState("open");
  const [categoryValue, setCategoryValue] = useState("");
  const [deletedValue, setDeletedValue] = useState("false");

  useEffect(() => {
    onStatusFilter("open");
    onCategoryFilter("");
    onDeletedFilter("false");
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusValue(value || "");
    onStatusFilter(value || "");
  };

  const handleCategoryChange = (value: string) => {
    setCategoryValue(value || "");
    onCategoryFilter(value || "");
  };

  const handleDeletedChange = (value: string) => {
    setDeletedValue(value || "");
    onDeletedFilter(value || "");
  };

  const handleReset = () => {
    setSearchValue("");
    setStatusValue("open");
    setCategoryValue("");
    setDeletedValue("false");
    onReset();
  };

  return (
    <Card>
      <Space wrap style={{ width: "100%" }}>
        <Input
          placeholder={t("project_page.search_placeholder")}
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={handleSearchChange}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t("project_page.filter_status")}
          style={{ width: 180 }}
          value={statusValue}
          onChange={handleStatusChange}
          options={[
            { label: t("project_page.status_all"), value: "" },
            { label: t("project_page.status_active"), value: "open" },
            { label: t("project_page.status_closed"), value: "close" },
          ]}
        />
        <Select
          placeholder={t("project_page.filter_category")}
          style={{ width: 200 }}
          value={categoryValue}
          onChange={handleCategoryChange}
          options={[
            { label: t("project_page.category_all"), value: "" },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
        <Select
          placeholder={t("project_page.filter_deleted")}
          style={{ width: 180 }}
          value={deletedValue}
          onChange={handleDeletedChange}
          options={[
            { label: t("project_page.show_active_only"), value: "false" },
            { label: t("project_page.show_deleted_only"), value: "true" },
            { label: t("project_page.show_all"), value: "" },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          {t("project_page.reset_filters")}
        </Button>
      </Space>
    </Card>
  );
};
