import { TimelineItem } from "../types/timeline.types";

export const COLORS = [
  {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    bar: "bg-blue-400",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    bar: "bg-emerald-400",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    bar: "bg-violet-400",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-400",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    bar: "bg-rose-400",
  },
  {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    bar: "bg-cyan-400",
  },
  {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-700",
    bar: "bg-fuchsia-400",
  },
  {
    bg: "bg-lime-50",
    border: "border-lime-200",
    text: "text-lime-700",
    bar: "bg-lime-400",
  },
];

export const getProjectColor = (index: number) => COLORS[index % COLORS.length];

export const ASSET_OPTIONS = [
  { value: "CAPTUREABLE", label: "สามารถแคปทรัพย์สินได้" },
  { value: "UN_CAPTUREABLE", label: "ไม่สามารถแคปทรัพย์สินได้" },
];

export const CELL_WIDTH = 45;
export const HEADER_HEIGHT = 60;
export const ROW_HEIGHT = 64;
