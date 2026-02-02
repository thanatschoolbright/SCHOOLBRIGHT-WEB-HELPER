import { useCallback, useEffect, useMemo, useState } from "react";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { toast } from "sonner";

import type { TimesheetEntry } from "@/stores/type";
import type { DailySummaryItem } from "@components/card/daily-card";

dayjs.extend(isBetween);

const DAILY_TARGET_HOURS = 8;
const WEEKDAY_LABELS = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];

type TopUsage = {
  name: string;
  hours: number;
};

/**
 * Hook สำหรับจัดการข้อมูลสรุปรายวัน
 */
export const useDailySummary = (entries: TimesheetEntry[]) => {
  return useMemo(() => {
    if (!entries.length) return [];

    const summaryMap = new Map<
      string,
      { totalHours: number; rawDate: string }
    >();

    //** รวมชั่วโมงของแต่ละวัน */
    entries.forEach((entry) => {
      const dateKey = dayjs(entry.date).format("YYYY-MM-DD");
      const numericHours = Number(entry.hours) || 0;
      if (summaryMap.has(dateKey)) {
        summaryMap.get(dateKey)!.totalHours += numericHours;
      } else {
        summaryMap.set(dateKey, {
          totalHours: numericHours,
          rawDate: entry.date,
        });
      }
    });

    return Array.from(summaryMap.entries())
      .map(([dateKey, payload]) => {
        const totalHours = Number(payload.totalHours.toFixed(2));
        const percent = Math.min(
          Number(((totalHours / DAILY_TARGET_HOURS) * 100).toFixed(2)),
          200,
        );
        return {
          dateKey,
          displayDate: dayjs(payload.rawDate).format("DD/MM/YYYY"),
          totalHours,
          percent,
          isCompleted: totalHours >= DAILY_TARGET_HOURS,
        };
      })
      .sort((a, b) => dayjs(b.dateKey).valueOf() - dayjs(a.dateKey).valueOf());
  }, [entries]);
};

/**
 * Hook สำหรับจัดการข้อมูลสรุปรายสัปดาห์
 */
export const useWeeklySummary = (dailySummary: any[]): DailySummaryItem[] => {
  return useMemo(() => {
    if (!dailySummary.length) return [];

    const summaryLookup = new Map(
      dailySummary.map((item) => [item.dateKey, item]),
    );

    //** คำนวณวันจันทร์ของสัปดาห์ปัจจุบัน */
    const today = dayjs();
    const offsetToMonday = (today.day() + 6) % 7;
    const monday = today.clone().startOf("day").subtract(offsetToMonday, "day");

    return WEEKDAY_LABELS.map((label, index) => {
      const day = monday.clone().add(index, "day");
      const key = day.format("YYYY-MM-DD");
      const summary = summaryLookup.get(key);

      return {
        label,
        dateKey: key,
        displayDate: day.format("DD/MM/YYYY"),
        totalHours: summary?.totalHours ?? 0,
        percent: summary?.percent ?? 0,
        isCompleted: summary?.isCompleted ?? false,
      };
    });
  }, [dailySummary]);
};

/**
 * Hook สำหรับจัดการข้อมูลสรุปรายเดือน
 */
export const useMonthlySummary = (dailySummary: any[]): DailySummaryItem[] => {
  return useMemo(() => {
    if (!dailySummary.length) return [];

    const summaryLookup = new Map(
      dailySummary.map((item) => [item.dateKey, item]),
    );

    //** คำนวณวันแรกของเดือนปัจจุบัน */
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");
    const daysInMonth = endOfMonth.date();

    const monthlyData: DailySummaryItem[] = [];

    for (let i = 0; i < daysInMonth; i++) {
      const day = startOfMonth.clone().add(i, "day");
      const key = day.format("YYYY-MM-DD");
      const summary = summaryLookup.get(key);

      monthlyData.push({
        label: day.format("DD"),
        dateKey: key,
        displayDate: day.format("DD/MM/YYYY"),
        totalHours: summary?.totalHours ?? 0,
        percent: summary?.percent ?? 0,
        isCompleted: summary?.isCompleted ?? false,
      });
    }

    return monthlyData;
  }, [dailySummary]);
};

/**
 * Hook สำหรับคำนวณการใช้งานสูงสุด
 */
export const useTopUsage = (entries: TimesheetEntry[]) => {
  const weeklyFocusEntries = useMemo(() => {
    const today = dayjs();
    const offsetToMonday = (today.day() + 6) % 7;
    const start = today.clone().startOf("day").subtract(offsetToMonday, "day");
    const end = start.clone().add(4, "day").endOf("day"); // จันทร์-ศุกร์

    return entries.filter((entry) => {
      const entryDate = dayjs(entry.date);
      return entryDate.isBetween(start, end, "day", "[]");
    });
  }, [entries]);

  const topProjectUsage = useMemo(
    () => aggregateTopUsage(weeklyFocusEntries, "project_name"),
    [weeklyFocusEntries],
  );

  const topFeatureUsage = useMemo(
    () => aggregateTopUsage(weeklyFocusEntries, "feature_name"),
    [weeklyFocusEntries],
  );

  return { topProjectUsage, topFeatureUsage };
};

/**
 * Hook สำหรับจัดการข้อมูลสรุปรายเดือน ผ่าน API (Server-side calculation)
 * @param userId - ID พนักงาน
 * @param month - เดือนปัจจุบัน
 * @param year - ปีปัจจุบัน
 */
export const useMonthlySummaryAPI = (
  userId?: number,
  month?: number,
  year?: number,
) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/timesheet/calculate-summary-month",
        {
          user_id: userId,
          month: month || dayjs().month() + 1,
          year: year || dayjs().year(),
        },
      );
      setData(response.data?.data);
    } catch (error) {
      console.error("fetchMonthlySummary error:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    monthlySummary: (data?.monthlySummary as DailySummaryItem[]) || [],
    stats: data?.stats || null,
    loading,
    refetch: fetchSummary,
  };
};

/**
 * Hook สำหรับจัดการข้อมูล Timesheet Entry
 */
export const useTimesheetEntries = (adminId?: number) => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const TOAST_ID = "timesheet-entries";

  const fetchEntries = useCallback(
    async (showToast = false) => {
      if (!adminId) return;

      setLoading(true);
      if (showToast) {
        toast.loading("กำลังโหลดข้อมูลรายการลงเวลา...", { id: TOAST_ID });
      }

      try {
        const response = await axios.post("/api/v1/timesheet/entry/read/", {
          limit: pageSize,
          page: currentPage,
          user_id: adminId,
        });

        const rawList = response.data?.data ?? [];
        const list = (rawList as TimesheetEntry[]).map((item) => ({
          ...item,
          hours: Number(item.hours ?? 0),
        }));

        setEntries(list);

        const totalPages = response.data?.pagination?.total_pages ?? 1;
        const totalCount = response.data?.pagination?.total_items;
        setTotalItems(totalCount ?? totalPages * 30);

        if (showToast) {
          toast.success("โหลดข้อมูลสำเร็จ!", { id: TOAST_ID });
        }
      } catch (error: any) {
        console.error("fetchEntries", error);
        setEntries([]);
        const errorMessage =
          error?.response?.data?.message_th ||
          error?.message ||
          "โหลดข้อมูลรายการลงเวลาล้มเหลว";
        if (showToast) {
          toast.error(errorMessage, { id: TOAST_ID });
        }
      } finally {
        setLoading(false);
      }
    },
    [adminId, currentPage, pageSize],
  );

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const refetch = useCallback(() => fetchEntries(true), [fetchEntries]);

  return {
    entries,
    loading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    refetch,
  };
};

/**
 * ฟังก์ชันคำนวณการใช้งานสูงสุด
 */
const aggregateTopUsage = (
  entries: TimesheetEntry[],
  key: "project_name" | "feature_name",
): TopUsage | null => {
  if (!entries.length) return null;

  const totals = entries.reduce<Map<string, number>>((map, entry) => {
    const label = (entry[key] ?? "ไม่ระบุ") as string;
    const hours = Number(entry.hours ?? 0);
    if (!hours) return map;
    map.set(label, (map.get(label) ?? 0) + hours);
    return map;
  }, new Map());

  if (!totals.size) return null;

  const [name, hours] = Array.from(totals.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return { name, hours: Number(hours.toFixed(2)) };
};
