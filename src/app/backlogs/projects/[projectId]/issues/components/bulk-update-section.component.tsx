"use client";

import { Card, Collapse } from "antd";
import { useTranslation } from "react-i18next";
import BulkUpdateSection from "@components/backlog/bulk-update-section";

type BulkUpdateSectionProps = {
  projectId: number;
  projectName: string;
  space: string;
  onUpdateComplete: () => void;
};

export default function BulkUpdateContainer({
  projectId,
  projectName,
  space,
  onUpdateComplete,
}: BulkUpdateSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  return (
    <Card
      size="small"
      style={{ borderRadius: 14 }}
      className="shadow-sm bg-transparent"
    >
      <Collapse
        items={[
          {
            key: "bulk-update",
            label: TRANSLATION("backlog_issues_page.bulk_update_title"),
            children: (
              <BulkUpdateSection
                elevatedCardStyle={{}}
                projectName={projectName}
                projectId={projectId}
                space={space}
                onUpdateComplete={onUpdateComplete}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
