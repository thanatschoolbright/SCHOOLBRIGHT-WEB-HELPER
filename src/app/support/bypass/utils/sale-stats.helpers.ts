import type { SchoolDetail } from "../types/bypass.types";
import type { SaleStatistics } from "../types/sale-stats.types";

export const calculateSaleStatistics = (
  schools: SchoolDetail[]
): SaleStatistics[] => {
  const saleMap = new Map<string, SchoolDetail[]>();

  schools.forEach((school) => {
    const saleName = school.sale_name?.trim();
    if (saleName) {
      if (!saleMap.has(saleName)) {
        saleMap.set(saleName, []);
      }
      saleMap.get(saleName)!.push(school);
    }
  });

  const statistics: SaleStatistics[] = [];

  saleMap.forEach((schoolsInSale, saleName) => {
    const totalSchools = schoolsInSale.length;
    const activeSchools = schoolsInSale.filter(
      (s) => s.isActive === "active"
    ).length;
    const inactiveSchools = totalSchools - activeSchools;

    const gradeACount = schoolsInSale.filter(
      (s) => s.school_grade?.trim().toUpperCase() === "A"
    ).length;
    const gradeBCount = schoolsInSale.filter(
      (s) => s.school_grade?.trim().toUpperCase() === "B"
    ).length;
    const gradeCCount = schoolsInSale.filter(
      (s) => s.school_grade?.trim().toUpperCase() === "C"
    ).length;

    const softwareTypeCount = schoolsInSale.filter(
      (s) => s.school_type === "Software"
    ).length;
    const singleAuthenCount = schoolsInSale.filter(
      (s) => s.school_type === "Single Authen"
    ).length;

    const gradePoints = schoolsInSale.reduce((sum, school) => {
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
      saleName,
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
    });
  });

  return statistics.sort((a, b) => b.totalSchools - a.totalSchools);
};
