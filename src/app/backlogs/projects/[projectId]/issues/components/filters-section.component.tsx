"use client";

import { Collapse, Card } from "antd";
import IssueFilter from "@components/backlog/issue-filter";
import { useTranslation } from "react-i18next";

type FiltersSectionProps = {
  onSearch: () => void;
};

export default function FiltersSection({
  onSearch,
}: FiltersSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  return (
    <Card
      size="small"
      style={{ borderRadius: 14 }}
      className="shadow-sm bg-transparent"
    >
      <Collapse
        accordion
        defaultActiveKey={["filters"]}
        items={[
          {
            key: "filters",
            label: TRANSLATION("backlog_issues_page.filters_title"),
            children: (
              <IssueFilter onSearch={onSearch} elevatedCardStyle={{}} />
            ),
          },
        ]}
      />
    </Card>
  );
}
