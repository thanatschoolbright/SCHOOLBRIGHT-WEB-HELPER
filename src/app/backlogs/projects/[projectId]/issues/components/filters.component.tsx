"use client";

import { ReloadOutlined, SearchOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useMemo, useRef } from "react";

type FiltersToolbarProps = {
  total: number;
  keyword: string;
  loading: boolean;
  onSearch: (value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
};

export default function FiltersToolbar({
  total,
  keyword,
  loading,
  onSearch,
  onReset,
  onRefresh,
}: FiltersToolbarProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeholder = useMemo(
    () => TRANSLATION("backlog_issues_page.search_placeholder"),
    [TRANSLATION]
  );

  return (
    <Card
      size="small"
      styles={{ body: { padding: 12 } }}
      style={{ borderRadius: 14 }}
      className="shadow-sm"
    >
      <Space
        className="w-full"
        align="center"
        wrap
        size={10}
        direction="horizontal"
      >
        <Input
          allowClear
          size="middle"
          prefix={<SearchOutlined />}
          placeholder={placeholder}
          value={keyword}
          onPressEnter={(e) =>
            onSearch((e.target as HTMLInputElement).value || "")
          }
          onChange={(e) => {
            const value = e.target.value;
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => onSearch(value), 300);
          }}
          className="flex-1 min-w-[240px]"
        />
        <Space>
          <Tooltip title={TRANSLATION("backlog_issues_page.reset_filters")}>
            <Button
              icon={<UndoOutlined />}
              onClick={onReset}
              type="text"
              className="hover:-translate-y-0.5 transition-all"
            >
              {TRANSLATION("backlog_issues_page.reset")}
            </Button>
          </Tooltip>
          <Tooltip title={TRANSLATION("backlog_issues_page.refresh")}>
            <Button
              icon={<ReloadOutlined />}
              type="primary"
              onClick={onRefresh}
              loading={loading}
              className="shadow"
            >
              {TRANSLATION("backlog_issues_page.refresh")}
            </Button>
          </Tooltip>
        </Space>
        <div className="ml-auto text-xs text-gray-500">
          {TRANSLATION("backlog_issues_page.total_issues_label", {
            count: total ?? 0,
          })}
        </div>
      </Space>
    </Card>
  );
}
