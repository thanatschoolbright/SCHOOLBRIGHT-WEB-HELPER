export type SchoolDetail = {
  school_id: string | number;
  company_name?: string;
  province?: string;
  school_group?: string;
  school_class?: string;
  school_grade?: string;
  school_type?: string;
  school_code?: string;
  isActive?: string;
  sale_name?: string;
  support_name?: string;
  active_date?: string;
  SchoolTypes?: string;
  school_pass?: string;
  PROVINCE_NAME?: string;
  student_count?: number;
};

export type Environment = {
  label: string;
  url: string;
  extendPath?: string;
};

export type BypassTarget = {
  label: string;
  environments: Record<string, Environment>;
};

export type BypassLinkParams = {
  schoolId: string;
  schoolName?: string;
  targetLabel: string;
  environmentLabel: string;
  url: string;
  extendPath?: string;
};

export type FilterState = {
  search: string;
  province: string | undefined;
  schoolType: string | undefined;
  grade: string | undefined;
  status: string | undefined;
  schoolGroup: string | undefined;
};

export type FilterOptions = {
  provinces: Array<{ label: string; value: string }>;
  schoolTypes: Array<{ label: string; value: string }>;
  grades: Array<{ label: string; value: string }>;
  schoolGroups: Array<{ label: string; value: string }>;
};

export type Statistics = {
  total: number;
  active: number;
  inactive: number;
  gradeA: number;
  totalStudents: number;
  averageStudentsPerSchool: number;
  activeStudents: number;
};

export type BypassPageState = {
  filters: FilterState;
  filterOptions: FilterOptions;
  filteredSchools: SchoolDetail[];
  statistics: Statistics;
  pageSize: number;
  openDropdownFor: string | null;
  loading: boolean;
};
