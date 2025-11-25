import dayjs from "dayjs";
import {
  TimelineProject,
  TimelineStats,
  TimelineRange,
} from "../types/timeline.types";

export const HEADER_HEIGHT = 50;
export const SIDEBAR_WIDTH = 320;

export const PROJECT_COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#a0d911",
  "#2f54eb",
  "#fa541c",
  "#1677ff",
];

export const getProjectColor = (index: number): string => {
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
};

export const getBarPosition = (
  start: string,
  end: string,
  startDate: any,
  pixelsPerDay: number
) => {
  const s = dayjs(start);
  const e = dayjs(end);

  const offsetDays = s.diff(startDate, "day");
  const durationDays = e.diff(s, "day") + 1;

  return {
    left: offsetDays * pixelsPerDay,
    width: Math.max(durationDays * pixelsPerDay, 4),
  };
};

export const calculateStats = (projects: TimelineProject[]): TimelineStats => {
  const total = projects.length;
  const now = dayjs();
  let active = 0;
  let upcoming = 0;
  let ended = 0;

  projects.forEach((p) => {
    const start = dayjs(p.startDate);
    const end = dayjs(p.endDate);
    if (now.isBetween(start, end, "day", "[]")) {
      active++;
    } else if (start.isAfter(now)) {
      upcoming++;
    } else {
      ended++;
    }
  });

  return { total, active, upcoming, ended };
};

export const calculateTimelineRange = (
  projects: TimelineProject[]
): TimelineRange => {
  if (projects.length === 0) {
    const start = dayjs().startOf("year");
    const end = dayjs().endOf("year");
    return {
      startDate: start,
      endDate: end,
      totalDays: end.diff(start, "day") + 1,
      months: [],
    };
  }

  const allStartDates = projects.map((p) => new Date(p.startDate).getTime());
  const allEndDates = projects.map((p) => new Date(p.endDate).getTime());

  const today = dayjs();
  allStartDates.push(today.toDate().getTime());
  allEndDates.push(today.toDate().getTime());

  let minDate = dayjs(Math.min(...allStartDates))
    .subtract(1, "month")
    .startOf("month");
  let maxDate = dayjs(Math.max(...allEndDates))
    .add(1, "month")
    .endOf("month");

  const days = maxDate.diff(minDate, "day") + 1;

  const monthList = [];
  let current = minDate.clone();
  while (current.isBefore(maxDate)) {
    monthList.push(current);
    current = current.add(1, "month");
  }

  return {
    startDate: minDate,
    endDate: maxDate,
    totalDays: days,
    months: monthList,
  };
};

export const filterProjectsByDuration = (
  projects: TimelineProject[],
  filterDuration: number | null
): TimelineProject[] => {
  if (!filterDuration) return projects;

  const now = dayjs().startOf("day");
  const end = now.add(filterDuration, "month").endOf("day");

  return projects
    .map((project) => {
      const visibleFeatures = project.features.filter((f) => {
        const fStart = dayjs(f.startDate);
        const fEnd = dayjs(f.endDate);
        return (
          (fStart.isBefore(end) || fStart.isSame(end)) &&
          (fEnd.isAfter(now) || fEnd.isSame(now))
        );
      });

      const pStart = dayjs(project.startDate);
      const pEnd = dayjs(project.endDate);
      const isProjectVisible =
        (pStart.isBefore(end) || pStart.isSame(end)) &&
        (pEnd.isAfter(now) || pEnd.isSame(now));

      if (visibleFeatures.length > 0 || isProjectVisible) {
        return {
          ...project,
          features: visibleFeatures,
        };
      }
      return null;
    })
    .filter(Boolean) as TimelineProject[];
};

export const filterProjectsBySearch = (
  projects: TimelineProject[],
  searchTerm: string
): TimelineProject[] => {
  if (!searchTerm) return projects;
  const lowerTerm = searchTerm.toLowerCase();
  return projects.filter((p) => p.name.toLowerCase().includes(lowerTerm));
};
