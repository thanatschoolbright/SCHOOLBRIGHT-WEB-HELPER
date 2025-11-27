import React, { useMemo } from "react";
import { Card, Table, Space, Badge } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { TableProps, ColumnsType } from "antd/es/table";
import type { SchoolDetail } from "../types/bypass.types";
import { buildTableColumns } from "../utils/table-columns";

type SchoolTableSectionProps = {
  dataSource: SchoolDetail[];
  loading: boolean;
  pageSize: number;
  openDropdownFor: string | null;
  onTableChange: TableProps<SchoolDetail>["onChange"];
  onBypassClick: (compositeKey: string, record: SchoolDetail) => Promise<void>;
  onDropdownOpenChange: (open: boolean, schoolId: string) => void;
};

export default function SchoolTableSection({
  dataSource,
  loading,
  pageSize,
  openDropdownFor,
  onTableChange,
  onBypassClick,
  onDropdownOpenChange,
}: SchoolTableSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  const columns = useMemo<ColumnsType<SchoolDetail>>(
    () =>
      buildTableColumns(
        TRANSLATION,
        openDropdownFor,
        onBypassClick,
        onDropdownOpenChange
      ),
    [TRANSLATION, openDropdownFor, onBypassClick, onDropdownOpenChange]
  );

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <span>{TRANSLATION("bypass_page.table_title")}</span>
        </Space>
      }
      extra={
        <Badge
          count={dataSource.length}
          showZero
          style={{ backgroundColor: "#52c41a" }}
        />
      }
      bordered={false}
      className="shadow-sm"
    >
      <Table<SchoolDetail>
        columns={columns}
        bordered={false}
        dataSource={dataSource}
        loading={loading}
        rowKey={(record) => String(record.school_id ?? record.company_name)}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100", "200"],
          showTotal: (total) =>
            `${TRANSLATION("bypass_page.total_items", { count: total })}`,
        }}
        scroll={{ x: 1600 }}
        onChange={onTableChange}
        size="middle"
      />
    </Card>
  );
}
