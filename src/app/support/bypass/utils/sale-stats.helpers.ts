import type { SchoolDetail } from "../types/bypass.types";
import type { SaleStatistics } from "../types/sale-stats.types";

export const calculateSaleStatistics = (
  schools: SchoolDetail[],
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

  const normalizeStudentCount = (school: SchoolDetail): number => {
    const value = (school.student_count as number | string | undefined) ?? 0;
    const parsed =
      typeof value === "string"
        ? Number(value.replace(/[^0-9.-]/g, ""))
        : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  saleMap.forEach((schoolsInSale, saleName) => {
    const totalSchools = schoolsInSale.length;
    const activeSchools = schoolsInSale.filter(
      (school) => school.isActive !== "inactive",
    ).length;
    const inactiveSchools = totalSchools - activeSchools;

    const gradeACount = schoolsInSale.filter(
      (school) => school.school_grade?.trim().toUpperCase() === "A",
    ).length;
    const gradeBCount = schoolsInSale.filter(
      (school) => school.school_grade?.trim().toUpperCase() === "B",
    ).length;
    const gradeCCount = schoolsInSale.filter(
      (school) => school.school_grade?.trim().toUpperCase() === "C",
    ).length;

    const softwareTypeCount = schoolsInSale.filter(
      (school) => school.school_type === "Software",
    ).length;
    const singleAuthenCount = schoolsInSale.filter(
      (school) => school.school_type === "Single Authen",
    ).length;

    // * Counts by school_data_type
    const customerSchools = schoolsInSale.filter(
      (school) =>
        school.school_data_type === "ลูกค้า" ||
        school.school_data_type === "Customer",
    );
    const contractSchools = schoolsInSale.filter(
      (school) =>
        school.school_data_type === "ทำสัญญา" ||
        school.school_data_type === "Contract",
    );
    const testSchools = schoolsInSale.filter(
      (school) =>
        school.school_data_type === "Test" ||
        school.school_data_type === "Trial",
    );
    const freeSchools = schoolsInSale.filter(
      (school) =>
        school.school_data_type === "ลูกค้าฟรี" ||
        school.school_data_type === "Free",
    );
    const otherSchools = schoolsInSale.filter(
      (school) =>
        school.school_data_type === "หลักสูตรอิสลาม" ||
        school.school_data_type === "Islamic",
    );

    const customerCount = customerSchools.length;
    const contractCount = contractSchools.length;
    const testCount = testSchools.length;
    const freeCount = freeSchools.length;
    const otherCount = otherSchools.length;

    const customerStudents = customerSchools.reduce(
      (runningTotal, school) => runningTotal + normalizeStudentCount(school),
      0,
    );
    const contractStudents = contractSchools.reduce(
      (runningTotal, school) => runningTotal + normalizeStudentCount(school),
      0,
    );
    const testStudents = testSchools.reduce(
      (runningTotal, school) => runningTotal + normalizeStudentCount(school),
      0,
    );
    const freeStudents = freeSchools.reduce(
      (runningTotal, school) => runningTotal + normalizeStudentCount(school),
      0,
    );
    const otherStudents = otherSchools.reduce(
      (runningTotal, school) => runningTotal + normalizeStudentCount(school),
      0,
    );

    const gradePoints = schoolsInSale.reduce((runningTotal, school) => {
      const grade = school.school_grade?.trim().toUpperCase();
      const points: Record<string, number> = {
        A: 4.0,
        B: 3.0,
        C: 2.0,
        D: 1.0,
        E: 0.5,
        F: 0.0,
      };
      return runningTotal + (points[grade || ""] || 0);
    }, 0);

    const averageGrade =
      totalSchools > 0 ? (gradePoints / totalSchools).toFixed(2) : "0.00";
    const activationRate =
      totalSchools > 0 ? (activeSchools / totalSchools) * 100 : 0;

    const totalStudents = schoolsInSale.reduce(
      (runningTotal, school) => runningTotal + normalizeStudentCount(school),
      0,
    );
    const activeStudents = schoolsInSale.reduce((runningTotal, school) => {
      if (school.isActive === "active") {
        return runningTotal + normalizeStudentCount(school);
      }
      return runningTotal;
    }, 0);
    const averageStudentsPerSchool =
      totalSchools > 0 ? totalStudents / totalSchools : 0;
    const studentCoverageRate =
      totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;

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
      totalStudents,
      activeStudents,
      averageStudentsPerSchool,
      studentCoverageRate,
      customerCount,
      contractCount,
      testCount,
      freeCount,
      otherCount,
      customerStudents,
      contractStudents,
      testStudents,
      freeStudents,
      otherStudents,
      // * Set a default target for KPI (e.g., 20,000 students or more if they already exceed it)
      targetStudents: Math.max(
        20000,
        Math.ceil((customerStudents + contractStudents) / 5000) * 5000 + 5000,
      ),
    });
  });

  return statistics.sort((firstSale, secondSale) => {
    // * Default sort by Paying Students (Customer + Contract)
    const secondSalePaying =
      secondSale.customerStudents + secondSale.contractStudents;
    const firstSalePaying =
      firstSale.customerStudents + firstSale.contractStudents;
    if (secondSalePaying !== firstSalePaying) {
      return secondSalePaying - firstSalePaying;
    }
    return secondSale.totalSchools - firstSale.totalSchools;
  });
};
