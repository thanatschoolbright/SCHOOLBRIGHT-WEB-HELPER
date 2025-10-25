/**
 * Service สำหรับการเรียก API rank ของ user
 * ใช้ axios instance เพื่อความสอดคล้องกับระบบ
 */

import { callApiService } from "@/services/axios-instance/sb-helper.axios";

export interface UserRankResponse {
  rank: number;
  admin_id: string;
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

    console.log(`📊 [UserRankService] Fetching rank for user: ${userId}, Month: ${requestMonth}, Year: ${requestYear}`);

    const response = await callApiService.post('/api/v1/timesheet/entry/check/summary-month', {
      month: requestMonth,
      year: requestYear
    }, {
      headers: {
        'x-request-user': userId,
      }
    });

    if (response.status === 200) {
      const data = response.data;
      const records = data?.data?.records || [];
      
      // หาข้อมูล rank ของ user ที่ต้องการ
      const userRankData = records.find((item: any) => 
        item.user_id?.toString() === userId || 
        item.admin_id?.toString() === userId
      );

      if (userRankData) {
        const result: UserRankResponse = {
          rank: userRankData.rank || records.findIndex((item: any) => 
            (item.user_id?.toString() === userId || item.admin_id?.toString() === userId)
          ) + 1,
          admin_id: userRankData.user_id || userRankData.admin_id,
          month: requestMonth,
          year: requestYear,
          rawData: userRankData
        };

        console.log(`✅ [UserRankService] User rank found:`, result);
        return result;
      } else {
        console.warn(`⚠️ [UserRankService] No rank data found for user: ${userId}`);
      }
    } else {
      console.error(`❌ [UserRankService] API responded with status: ${response.status}`);
    }

    return null;
  } catch (error) {
    console.error("❌ [UserRankService] Error fetching user rank:", error);
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
  
  console.log(`📊 [UserRankService] Fetching ranks for ${userIds.length} users`);

  // เรียก API แบบ parallel
  const promises = userIds.map(async (userId) => {
    const rankData = await fetchUserRank(userId, month, year);
    return { userId, rankData };
  });

  const responses = await Promise.allSettled(promises);
  
  responses.forEach((response, index) => {
    const userId = userIds[index];
    if (response.status === 'fulfilled') {
      results[userId] = response.value.rankData;
    } else {
      console.error(`❌ [UserRankService] Failed to fetch rank for user ${userId}:`, response.reason);
      results[userId] = null;
    }
  });

  console.log(`✅ [UserRankService] Retrieved ranks for ${Object.keys(results).length} users`);
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
    console.error(`❌ [UserRankService] Error checking top rank for user ${userId}:`, error);
    return false;
  }
};