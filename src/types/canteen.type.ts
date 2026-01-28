export interface ApplicationRecord {
  app_id: string | number;
  app_name: string;
  app_type: string;
}

export interface VersionRecord {
  version_id: string | number;
  version_name: string;
  env: string;
  note?: string;
  is_lastest_version: 0 | 1 | boolean;
  force_update: 0 | 1 | boolean;
  updated_at: string;
  url?: string;
  school_id?: (string | number)[];
}

export interface VersionFormValues {
  schoolID?: (string | number)[];
  appID: string;
  versionID?: string;
  versionName: string;
  env: string;
  note?: string;
  isLatestVersion: boolean;
  forceUpdate: boolean;
  file?: any;
}

export interface VersionDataset {
  data: VersionRecord[];
  loading: boolean;
  curl: string;
}

export type SearchableColumnKey =
  | "app_id"
  | "app_name"
  | "app_type"
  | "version_name"
  | "env";

export type TableColumn<T> = import("antd/es/table").ColumnType<T> & {
  key: keyof T | string;
};

export interface SchoolOption {
  label: string;
  value: string;
}
