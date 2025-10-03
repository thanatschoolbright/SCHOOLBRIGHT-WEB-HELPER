// @components/providers/chart-provider.tsx (ตัวอย่างไฟล์ใหม่)
"use client"; // อย่าลืมใส่ 'use client'

import React, { useEffect } from "react";
import { Chart } from "chart.js";

Chart.defaults.font.family = "'Anuphan', sans-serif";
Chart.defaults.font.size = 14;
Chart.defaults.font.weight = "normal";

export default function ChartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
