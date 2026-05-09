import type {
  FilterOptions,
  FilterState,
  SchoolDetail,
  Statistics,
} from "../types/bypass.types";

const THAI_COLLATOR = new Intl.Collator("th", {
  sensitivity: "base",
  numeric: true,
});

export const compareValues = (
  firstValue: unknown,
  secondValue: unknown,
): number => {
  const normalize = (valueToNormalize: unknown): string => {
    if (valueToNormalize == null) return "";
    const valueType = typeof valueToNormalize;
    if (valueType === "string") return valueToNormalize as string;
    if (valueType === "number") return (valueToNormalize as number).toString();
    if (valueType === "boolean")
      return (valueToNormalize as boolean).toString();
    if (valueType === "object") {
      try {
        return JSON.stringify(valueToNormalize as Record<string, unknown>);
      } catch {
        return Object.prototype.toString.call(valueToNormalize);
      }
    }
    return Object.prototype.toString.call(valueToNormalize);
  };
  return THAI_COLLATOR.compare(normalize(firstValue), normalize(secondValue));
};

export const sanitizeTargetName = (label: string): string => {
  const trimmed = (label ?? "").trim();
  return trimmed.replace(/^[^A-Za-z0-9\u0E00-\u0E7F]+/, "").trim() || trimmed;
};

export const extractTokenFromUrl = (fullUrl: string): string => {
  try {
    const urlObj = new URL(fullUrl);
    const params = urlObj.searchParams;
    for (const key of ["token", "q"]) {
      const tokenValue = params.get(key);
      if (tokenValue) return tokenValue;
    }
    const equalsSignIndex = fullUrl.lastIndexOf("=");
    return equalsSignIndex >= 0 ? fullUrl.slice(equalsSignIndex + 1) : "";
  } catch {
    const equalsSignIndex = fullUrl.lastIndexOf("=");
    return equalsSignIndex >= 0 ? fullUrl.slice(equalsSignIndex + 1) : "";
  }
};

export const extractFilterOptions = (
  schools: SchoolDetail[],
): FilterOptions => {
  const provinces = new Set<string>();
  const schoolTypes = new Set<string>();
  const grades = new Set<string>();
  const schoolGroups = new Set<string>();

  schools.forEach((school) => {
    if (school.province) provinces.add(school.province);
    if (school.school_type) schoolTypes.add(school.school_type);
    if (school.school_grade) {
      const grade = school.school_grade.trim().toUpperCase();
      if (grade) grades.add(grade);
    }
    if (school.school_group) schoolGroups.add(school.school_group);
  });

  // สร้าง option list ของโรงเรียนพร้อม school_id สำหรับ Dropdown ค้นหา
  const schoolOptions = schools
    .filter((school) => school.company_name)
    .map((school) => ({
      label: `[${school.school_id}] ${school.company_name ?? ""}`,
      value: String(school.school_id),
    }))
    .sort((a, b) => THAI_COLLATOR.compare(a.label, b.label));

  return {
    schools: schoolOptions,
    provinces: Array.from(provinces)
      .sort()
      .map((province) => ({ label: province, value: province })),
    schoolTypes: Array.from(schoolTypes)
      .sort()
      .map((schoolType) => ({
        label: schoolType,
        value: schoolType,
      })),
    grades: Array.from(grades)
      .sort()
      .map((grade) => ({ label: grade, value: grade })),
    schoolGroups: Array.from(schoolGroups)
      .sort()
      .map((group) => ({ label: group, value: group })),
  };
};

export const filterSchools = (
  schools: SchoolDetail[],
  filters: FilterState,
): SchoolDetail[] => {
  return schools.filter((school) => {
    // กรองด้วย Dropdown โรงเรียน (ตรง school_id)
    if (filters.school && String(school.school_id) !== filters.school) return false;

    // กรองด้วย Input ค้นหาอิสระ (ชื่อ, รหัสโรงเรียน, school_code)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        school.company_name?.toLowerCase().includes(searchLower) ||
        String(school.school_id).includes(searchLower) ||
        school.school_code?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.province && school.province !== filters.province) return false;
    if (filters.schoolType && school.school_type !== filters.schoolType)
      return false;

    if (filters.grade) {
      const schoolGrade = (school.school_grade ?? "").trim().toUpperCase();
      if (schoolGrade !== filters.grade) return false;
    }

    if (filters.status) {
      // ใช้ db_is_active ก่อน (ค่าล่าสุดจาก UI) ถ้าไม่มีค่อย fallback ไป isActive (string จาก external API)
      let effectiveStatus: string;
      if (school.db_is_active !== undefined && school.db_is_active !== null) {
        effectiveStatus = school.db_is_active ? "active" : "inactive";
      } else {
        effectiveStatus = school.isActive || "active";
      }
      if (effectiveStatus !== filters.status) return false;
    }
    if (filters.schoolGroup && school.school_group !== filters.schoolGroup)
      return false;

    return true;
  });
};

export const calculateStatistics = (schools: SchoolDetail[]): Statistics => {
  const total = schools.length;
  const active = schools.filter(
    (school) => school.isActive !== "inactive",
  ).length;
  const inactive = total - active;
  const gradeA = schools.filter(
    (school) => school.school_grade?.trim().toUpperCase() === "A",
  ).length;

  const normalizeStudentCount = (school: SchoolDetail): number => {
    const value = (school.student_count as number | string | undefined) ?? 0;
    const parsed =
      typeof value === "string"
        ? Number(value.replace(/[^0-9.-]/g, ""))
        : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalStudents = schools.reduce(
    (runningTotal, school) => runningTotal + normalizeStudentCount(school),
    0,
  );
  const activeStudents = schools.reduce((runningTotal, school) => {
    if (school.isActive !== "inactive") {
      return runningTotal + normalizeStudentCount(school);
    }
    return runningTotal;
  }, 0);

  const averageStudentsPerSchool =
    total > 0 ? Number((totalStudents / total).toFixed(2)) : 0;

  return {
    total,
    active,
    inactive,
    gradeA,
    totalStudents,
    averageStudentsPerSchool,
    activeStudents,
  };
};
