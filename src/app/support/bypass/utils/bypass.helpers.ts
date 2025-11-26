import type {
  SchoolDetail,
  FilterState,
  FilterOptions,
  Statistics,
} from "../types/bypass.types";

const COLLATOR = new Intl.Collator("th", {
  sensitivity: "base",
  numeric: true,
});

export const compareValues = (a: unknown, b: unknown): number => {
  const normalize = (v: unknown): string => {
    if (v == null) return "";
    const t = typeof v;
    if (t === "string") return v as string;
    if (t === "number") return (v as number).toString();
    if (t === "boolean") return (v as boolean).toString();
    if (t === "object") {
      try {
        return JSON.stringify(v as Record<string, unknown>);
      } catch {
        return Object.prototype.toString.call(v);
      }
    }
    return Object.prototype.toString.call(v);
  };
  return COLLATOR.compare(normalize(a), normalize(b));
};

export const parseLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage?.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    return defaultValue;
  }
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
      const v = params.get(key);
      if (v) return v;
    }
    const href = fullUrl;
    const idx = href.lastIndexOf("=");
    return idx >= 0 ? href.slice(idx + 1) : "";
  } catch {
    const idx = fullUrl.lastIndexOf("=");
    return idx >= 0 ? fullUrl.slice(idx + 1) : "";
  }
};

export const extractFilterOptions = (
  schools: SchoolDetail[]
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

  return {
    provinces: Array.from(provinces)
      .sort()
      .map((p) => ({ label: p, value: p })),
    schoolTypes: Array.from(schoolTypes)
      .sort()
      .map((t) => ({ label: t, value: t })),
    grades: Array.from(grades)
      .sort()
      .map((g) => ({ label: g, value: g })),
    schoolGroups: Array.from(schoolGroups)
      .sort()
      .map((g) => ({ label: g, value: g })),
  };
};

export const filterSchools = (
  schools: SchoolDetail[],
  filters: FilterState
): SchoolDetail[] => {
  return schools.filter((school) => {
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

    if (filters.status && school.isActive !== filters.status) return false;
    if (filters.schoolGroup && school.school_group !== filters.schoolGroup)
      return false;

    return true;
  });
};

export const calculateStatistics = (schools: SchoolDetail[]): Statistics => {
  const total = schools.length;
  const active = schools.filter((s) => s.isActive === "active").length;
  const inactive = total - active;
  const gradeA = schools.filter(
    (s) => s.school_grade?.trim().toUpperCase() === "A"
  ).length;

  return { total, active, inactive, gradeA };
};
