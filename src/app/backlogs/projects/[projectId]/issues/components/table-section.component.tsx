"use client";

import { Card } from "antd";
import IssuesTable from "@components/backlog/issues-table";
import { useTranslation } from "react-i18next";

type TableSectionProps = {
  onReload: () => void;
  space: string;
  loading: boolean;
};

export default function TableSection({
  onReload,
  space,
  loading,
}: TableSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  return (
    <Card
      variant="outlined"
      title={TRANSLATION("backlog_issues_page.table_title")}
      style={{ borderRadius: 16 }}
      className="shadow-sm"
      extra={
        <span className="text-xs text-gray-500">
          {loading
            ? TRANSLATION("backlog_issues_page.loading_table")
            : TRANSLATION("backlog_issues_page.table_ready")}
        </span>
      }
    >
      {/* Table Section */}
      <IssuesTable listCardStyle={{}} onReload={onReload} space={space} />
    </Card>
  );
}
