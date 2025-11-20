/**
 * ข้อมูลรายการลงเวลาทำงาน (Timesheet Entry)
 */
export interface TimesheetEntry {
  id: string | number;
  date: string;
  project_name: string;
  feature_name?: string;
  created_by: string | number;
  status: TimesheetStatus;
  hours: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * สถานะของงานใน Timesheet
 */
export type TimesheetStatus = "DONE" | "IN_PROGRESS" | "REVIEW" | "CANCELLED";

/**
 * ข้อมูลสำหรับส่งออก Timesheet
 */
export interface TimesheetExportData {
  start_date: string;
  end_date: string;
  project_id?: string | number;
  sub_project_id?: string | number;
  created_by?: string | number;
  investment: number;
}

/**
 * ข้อมูลการแบ่งหน้า (Pagination)
 */
export interface PaginationData {
  current: number;
  pageSize: number;
  total: number;
}

/**
 * การตั้งค่าตัวกรองข้อมูลในตาราง
 */
export interface TableFilters {
  [key: string]: (string | number)[] | null;
}

/**
 * ข้อมูลสำหรับ Dropdown Menu
 */
export interface DropdownOption {
  label: string;
  value: string | number;
}

/**
 * Props สำหรับ Timesheet Table Component
 */
export interface TimesheetTableProps {
  dataSource: TimesheetEntry[];
  loading?: boolean;
  pagination?: PaginationData;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (selectedKeys: React.Key[]) => void;
  onTableChange?: (pagination: PaginationData, filters: TableFilters) => void;
  onViewDetail?: (record: TimesheetEntry) => void;
}
