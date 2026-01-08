export type ProvinceStatistics = {
  province: string;
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
  // * Summary by school_data_type
  customerCount: number; // ลูกค้า
  contractCount: number; // ทำสัญญา
  testCount: number; // Test
  freeCount: number; // ลูกค้าฟรี
  otherCount: number; // หลักสูตรอิสลาม (Other)
};
