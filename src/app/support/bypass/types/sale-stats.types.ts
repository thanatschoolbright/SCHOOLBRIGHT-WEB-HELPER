export type SaleStatistics = {
  saleName: string;
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  softwareTypeCount: number;
  singleAuthenCount: number;
  averageGrade: string;
  activationRate: number;
  totalStudents: number;
  averageStudentsPerSchool: number;
  activeStudents: number;
  studentCoverageRate: number;
  // * Summary by school_data_type
  customerCount: number; // ลูกค้า
  contractCount: number; // ทำสัญญา
  testCount: number; // Test
  freeCount: number; // ลูกค้าฟรี
  otherCount: number; // หลักสูตรอิสลาม (Other)
  // * Specific counts for students per type
  customerStudents: number;
  contractStudents: number;
  testStudents: number;
  freeStudents: number;
  otherStudents: number;
  // * KPI & Target
  targetStudents: number;
};
