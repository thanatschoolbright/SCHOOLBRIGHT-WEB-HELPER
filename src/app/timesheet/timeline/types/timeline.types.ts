export interface TimelineFeature {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  assetCaptureType: string;
}

export interface TimelineProject {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  categoryType: string;
  features: TimelineFeature[];
}

export interface PopupInfo {
  x: number;
  y: number;
  project: TimelineProject | null;
}

export interface TimelineStats {
  total: number;
  active: number;
  upcoming: number;
  ended: number;
}

export interface TimelineRange {
  startDate: any;
  endDate: any;
  totalDays: number;
  months: any[];
}

export type ViewMode = "month" | "quarter";
