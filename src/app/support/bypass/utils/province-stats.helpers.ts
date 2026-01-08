import type { SchoolDetail } from "../types/bypass.types";
import type { ProvinceStatistics } from "../types/province-stats.types";

export const calculateProvinceStatistics = (
  schools: SchoolDetail[]
): ProvinceStatistics[] => {
  const provinceMap = new Map<string, SchoolDetail[]>();

  schools.forEach((school) => {
    const province = school.province || "ไม่ระบุจังหวัด";
    if (!provinceMap.has(province)) {
      provinceMap.set(province, []);
    }
    provinceMap.get(province)!.push(school);
  });

  const statistics: ProvinceStatistics[] = [];

  provinceMap.forEach((schoolsInProvince, province) => {
    const totalSchools = schoolsInProvince.length;
    const activeSchools = schoolsInProvince.filter(
      (s) => s.isActive === "active"
    ).length;
    const inactiveSchools = totalSchools - activeSchools;

    const gradeACount = schoolsInProvince.filter(
      (s) => s.school_grade?.trim().toUpperCase() === "A"
    ).length;
    const gradeBCount = schoolsInProvince.filter(
      (s) => s.school_grade?.trim().toUpperCase() === "B"
    ).length;
    const gradeCCount = schoolsInProvince.filter(
      (s) => s.school_grade?.trim().toUpperCase() === "C"
    ).length;

    const softwareTypeCount = schoolsInProvince.filter(
      (s) => s.school_type === "Software"
    ).length;
    const singleAuthenCount = schoolsInProvince.filter(
      (s) => s.school_type === "Single Authen"
    ).length;

    // * Counts by school_data_type
    const customerCount = schoolsInProvince.filter(
      (s) => s.school_data_type === "ลูกค้า"
    ).length;
    const contractCount = schoolsInProvince.filter(
      (s) => s.school_data_type === "ทำสัญญา"
    ).length;
    const testCount = schoolsInProvince.filter(
      (s) => s.school_data_type === "Test"
    ).length;
    const freeCount = schoolsInProvince.filter(
      (s) => s.school_data_type === "ลูกค้าฟรี"
    ).length;
    const otherCount = schoolsInProvince.filter(
      (s) => s.school_data_type === "หลักสูตรอิสลาม"
    ).length;

    const gradePoints = schoolsInProvince.reduce((sum, school) => {
      const grade = school.school_grade?.trim().toUpperCase();
      const points: Record<string, number> = {
        A: 4.0,
        B: 3.0,
        C: 2.0,
        D: 1.0,
        E: 0.5,
        F: 0.0,
      };
      return sum + (points[grade || ""] || 0);
    }, 0);

    const averageGrade =
      totalSchools > 0 ? (gradePoints / totalSchools).toFixed(2) : "0.00";
    const activationRate =
      totalSchools > 0 ? (activeSchools / totalSchools) * 100 : 0;

    statistics.push({
      province,
      totalSchools,
      activeSchools,
      inactiveSchools,
      gradeACount,
      gradeBCount,
      gradeCCount,
      softwareTypeCount,
      singleAuthenCount,
      averageGrade,
      activationRate,
      customerCount,
      contractCount,
      testCount,
      freeCount,
      otherCount,
    });
  });

  return statistics.sort((a, b) => b.totalSchools - a.totalSchools);
};
