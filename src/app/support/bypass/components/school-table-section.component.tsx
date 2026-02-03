import { Card, Table, theme } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { useMemo } from "react";
import type { SchoolDetail } from "../types/bypass.types";
import { buildTableColumns } from "../utils/table-columns";

type SchoolTableSectionProps = {
  dataSource: SchoolDetail[];
  loading: boolean;
  pageSize: number;
  onTableChange: TableProps<SchoolDetail>["onChange"];
  onOpenBypassModal: (record: SchoolDetail) => void;
};

export default function SchoolTableSection({
  dataSource,
  loading,
  pageSize,
  onTableChange,
  onOpenBypassModal,
}: SchoolTableSectionProps): JSX.Element {
  const { token } = theme.useToken();

  const columns = useMemo<ColumnsType<SchoolDetail>>(
    () => buildTableColumns(onOpenBypassModal),
    [onOpenBypassModal],
  );

  return (
    <Card
      variant="borderless"
      styles={{
        body: { padding: 0 },
      }}
      style={{
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      <Table<SchoolDetail>
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={(record) => String(record.school_id ?? record.company_name)}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100", "200"],
          showTotal: (total) =>
            `Total ${total.toLocaleString()} schools match current filters`,
          position: ["bottomRight"],
        }}
        scroll={{ x: 1800, y: "calc(100vh - 450px)" }}
        onChange={onTableChange}
        size="middle"
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 24,
        }}
      />
    </Card>
  );
}
