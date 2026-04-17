export interface RequestDeviceDailyStatusTypes {
  deviceId?: string;
  schoolId?: string;
  limit?: string;
}

export interface RequestGetUserBySchoolId {
  school_id?: string | number;
  user_id?: string | number;
}

// เพิ่ม Type สำหรับการค้นหาแบบละเอียด
export interface FindAllDeviceStatusOptions {
  page?: string | number;       // หน้าปัจจุบัน (default: 1)
  limit?: string | number;      // จำนวนรายการต่อหน้า (default: 10)
  schoolId?: string | number;   // กรองตามรหัสโรงเรียน
  isOnline?: string | boolean;  // กรองสถานะ Online (true/false)
  isLogin?: string | boolean;   // กรองสถานะ Login (true/false)
  startDate?: string;           // กรองวันเริ่มต้น (BusinessDate หรือ Tstamp)
  endDate?: string;             // กรองวันสิ้นสุด
  keyword?: string;             // ค้นหา SchoolID หรือ DeviceID
}