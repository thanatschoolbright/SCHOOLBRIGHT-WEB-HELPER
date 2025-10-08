/**
 * ข้อมูลรายการลงเวลาทำงาน (Timesheet Entry)
 */
export interface TimesheetEntry {
  id: string | number;
  /** วันที่ลงเวลา */
  date: string;
  /** ชื่อโปรเจ็กต์ */
  project_name: string;
  /** ชื่อฟีเจอร์หรืองานย่อย */
  feature_name?: string;
  /** รหัสผู้สร้างรายการ */
  created_by: string | number;
  /** สถานะของงาน */
  status: TimesheetStatus;
  /** จำนวนชั่วโมงที่ทำงาน */
  hours: number;
  /** คำอธิบายรายละเอียดงาน */
  description?: string;
  /** วันเวลาที่สร้างรายการ */
  created_at?: string;
  /** วันเวลาที่แก้ไขล่าสุด */
  updated_at?: string;
}

/**
 * สถานะของงานใน Timesheet
 */
export type TimesheetStatus = 'DONE' | 'IN_PROGRESS' | 'REVIEW' | 'CANCELLED';

/**
 * ข้อมูลสำหรับส่งออก Timesheet
 */
export interface TimesheetExportData {
  /** ช่วงวันที่เริ่มต้น */
  start_date: string;
  /** ช่วงวันที่สิ้นสุด */
  end_date: string;
  /** รหัสโปรเจ็กต์ (ไม่บังคับ) */
  project_id?: string | number;
  /** รหัสโปรเจ็กต์ย่อย (ไม่บังคับ) */
  sub_project_id?: string | number;
  /** รหัสผู้สร้าง (ไม่บังคับ) */
  created_by?: string | number;
  /** งบประมาณการลงทุน */
  investment: number;
}

/**
 * ข้อมูลการแบ่งหน้า (Pagination)
 */
export interface PaginationData {
  /** หน้าปัจจุบัน */
  current: number;
  /** จำนวนรายการต่อหน้า */
  pageSize: number;
  /** จำนวนรายการทั้งหมด */
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
  /** ข้อมูล Timesheet entries */
  dataSource: TimesheetEntry[];
  /** สถานะการโหลดข้อมูล */
  loading?: boolean;
  /** ข้อมูลการแบ่งหน้า */
  pagination?: PaginationData;
  /** รายการที่ถูกเลือก */
  selectedRowKeys?: React.Key[];
  /** ฟังก์ชันเมื่อเลือกรายการ */
  onSelectionChange?: (selectedKeys: React.Key[]) => void;
  /** ฟังก์ชันเมื่อเปลี่ยนหน้าหรือตัวกรอง */
  onTableChange?: (pagination: PaginationData, filters: TableFilters) => void;
  /** ฟังก์ชันเมื่อดูรายละเอียด */
  onViewDetail?: (record: TimesheetEntry) => void;
}