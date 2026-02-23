import React, { useEffect } from "react";
import { Chart } from "chart.js";
import { useFont } from "./font-provider";

export default function ChartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fontFamily } = useFont();

  useEffect(() => {
    const fontStack =
      fontFamily === "google-sans"
        ? 'var(--font-google-sans), "Google Sans", sans-serif'
        : 'var(--font-sukhumvit), "Sukhumvit Set", sans-serif';

    Chart.defaults.font.family = fontStack;
    Chart.defaults.font.size = 14;
    Chart.defaults.font.weight = "normal";
  }, [fontFamily]);

  return <>{children}</>;
}
