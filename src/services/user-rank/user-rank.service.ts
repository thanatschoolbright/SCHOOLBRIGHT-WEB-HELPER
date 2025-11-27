/**
 * Service สำหรับการเรียก API rank ของ user
 * ใช้ axios instance เพื่อความสอดคล้องกับระบบ
 */

import { callApiService } from "@/services/axios-instance/sb-helper.axios";

export interface UserRankResponse {
  rank: number; // อันดับ (order จาก API)
  rankLetter: string; // เกรด rank (S, A, B, C, D, E, F)
  rankDescription: string; // คำอธิบาย rank
  admin_id: number;
  fullName: string;
  completion_rate: number;
  total_hours: number;
  expected_hours: number;
  month: string;
  year: string;
  rawData: any;
}

/**
 * เรียก API สำหรับดึงข้อมูล rank ของ user
 */
export const fetchUserRank = async (
  userId: string,
  month?: string,
  year?: string
): Promise<UserRankResponse | null> => {
  try {
    const currentDate = new Date();
    const requestMonth = month || (currentDate.getMonth() + 1).toString();
    const requestYear = year || currentDate.getFullYear().toString();

    const response = await callApiService.post(
      "/api/v1/timesheet/entry/check/summary-month",
      {
        month: requestMonth,
        year: requestYear,
      },
      {
        headers: {
          "x-request-user": userId,
        },
      }
    );

    if (response.status === 200) {
      const data = response.data;
      const records = data?.data?.records || [];

      // หาข้อมูล rank ของ user ที่ต้องการ โดยเปรียบเทียบ admin_id
      const userRankData = records.find(
        (item: any) => item.admin_id?.toString() === userId.toString()
      );

      if (userRankData) {
        const result: UserRankResponse = {
          rank: userRankData.order || 999, // ใช้ order จาก API
          rankLetter: userRankData.rank || "F", // ใช้ rank letter จาก API
          rankDescription: userRankData.rank_description || "ไม่มีข้อมูล",
          admin_id: userRankData.admin_id,
          fullName: userRankData.full_name || "",
          completion_rate: userRankData.completion_rate || 0,
          total_hours: userRankData.total_hours || 0,
          expected_hours: userRankData.expected_hours || 0,
          month: requestMonth,
          year: requestYear,
          rawData: userRankData,
        };

        return result;
      } else {
        // No rank data found
      }
    } else {
      // API responded with error status
    }

    return null;
  } catch (error) {
    // Error fetching user rank
    return null;
  }
};

/**
 * เรียก API สำหรับดึงข้อมูล rank ของหลาย users พร้อมกัน
 */
export const fetchMultipleUserRanks = async (
  userIds: string[],
  month?: string,
  year?: string
): Promise<Record<string, UserRankResponse | null>> => {
  const results: Record<string, UserRankResponse | null> = {};

  // เรียก API แบบ parallel
  const promises = userIds.map(async (userId) => {
    const rankData = await fetchUserRank(userId, month, year);
    return { userId, rankData };
  });

  const responses = await Promise.allSettled(promises);

  responses.forEach((response, index) => {
    const userId = userIds[index];
    if (response.status === "fulfilled") {
      results[userId] = response.value.rankData;
    } else {
      // Failed to fetch rank
      results[userId] = null;
    }
  });

  return results;
};

/**
 * ตรวจสอบว่า user มี rank ใน top N หรือไม่
 */
export const isUserInTopRank = async (
  userId: string,
  topN: number = 10,
  month?: string,
  year?: string
): Promise<boolean> => {
  try {
    const rankData = await fetchUserRank(userId, month, year);
    return rankData ? rankData.rank <= topN : false;
  } catch (error) {
    // Error checking top rank
    return false;
  }
};
