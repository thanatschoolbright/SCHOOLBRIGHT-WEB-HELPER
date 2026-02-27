/**
 * Helper functions สำหรับจัดการข้อมูล User Rank
 * ใช้สำหรับวัดวินัยและ Benefits ของพนักงาน
 */

import { fetchUserRank } from "@/services/user-rank/user-rank.service";

export interface UserRankData {
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
  updated_at?: string;
  discipline_score?: any;
}

/**
 * ดึงข้อมูล rank ของ user จากหน่วยความจำ (Memory-based cache)
 * ยกเลิกการใช้ localStorage เพื่อความปลอดภัย
 */
let memoryRankCache: UserRankData | null = null;

export const getUserRankFromStorage = (): UserRankData | null => {
  // ยกเลิกการใช้ localStorage ตามนโยบายความปลอดภัยใหม่
  return memoryRankCache;
};

/**
 * บันทึกข้อมูล rank ลงในหน่วยความจำ
 */
export const saveUserRankToMemory = (data: UserRankData) => {
  memoryRankCache = data;
};

/**
 * ประเมินระดับวินัยจาก rank
 */
export const getDisciplineLevel = (
  rank: number,
): {
  level: string;
  color: string;
  description: string;
} => {
  if (rank <= 3) {
    return {
      level: "เยี่ยม",
      color: "#52c41a",
      description: "พนักงานดีเด่น มีวินัยสูง",
    };
  } else if (rank <= 10) {
    return {
      level: "ดี",
      color: "#1677ff",
      description: "พนักงานที่มีวินัยดี",
    };
  } else if (rank <= 20) {
    return {
      level: "ปานกลาง",
      color: "#faad14",
      description: "ควรปรับปรุงวินัยการทำงาน",
    };
  } else {
    return {
      level: "ต้องปรับปรุง",
      color: "#ff4d4f",
      description: "ต้องปรับปรุงวินัยการทำงานอย่างเร่งด่วน",
    };
  }
};

/**
 * คำนวณ benefit ที่ควรได้รับจาก rank
 */
export const calculateBenefitFromRank = (
  rank: number,
): {
  bonusPercentage: number;
  benefits: string[];
  priority: string;
} => {
  if (rank <= 3) {
    return {
      bonusPercentage: 15,
      benefits: [
        "โบนัสพิเศษ 15%",
        "ลาพักร้อนเพิ่ม 3 วัน",
        "ที่จอดรถสำหรับผู้บริหาร",
        "ประกันสุขภาพพิเศษ",
      ],
      priority: "สูงสุด",
    };
  } else if (rank <= 10) {
    return {
      bonusPercentage: 10,
      benefits: ["โบนัสพิเศษ 10%", "ลาพักร้อนเพิ่ม 2 วัน", "ค่าเดินทางเพิ่ม"],
      priority: "สูง",
    };
  } else if (rank <= 20) {
    return {
      bonusPercentage: 5,
      benefits: ["โบนัสพิเศษ 5%", "ลาพักร้อนเพิ่ม 1 วัน"],
      priority: "ปานกลาง",
    };
  } else {
    return {
      bonusPercentage: 0,
      benefits: [],
      priority: "ต่ำ",
    };
  }
};

/**
 * ตรวจสอบว่าข้อมูล rank ล้าสมัยหรือไม่ (เก่ากว่า 1 เดือน)
 */
export const isRankDataOutdated = (rankData: UserRankData): boolean => {
  try {
    if (!rankData.updated_at) return true;
    const updatedDate = new Date(rankData.updated_at);
    const currentDate = new Date();
    const diffInDays = Math.floor(
      (currentDate.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffInDays > 30; // เก่ากว่า 30 วัน
  } catch (error) {
    return true; // ถ้า error ให้ถือว่าล้าสมัย
  }
};

/**
 * รีเฟรชข้อมูล rank ถ้าจำเป็น
 */
export const refreshUserRankIfNeeded = async (
  userId: string,
): Promise<UserRankData | null> => {
  const currentRank = getUserRankFromStorage();

  if (!currentRank || isRankDataOutdated(currentRank)) {
    console.log("Refreshing user rank data...");

    try {
      console.log(
        `[UserRankHelper] Refreshing rank data for user: ${userId}`,
      );

      const rankResponse = await fetchUserRank(userId);

      if (rankResponse) {
        const newRankData: UserRankData = {
          rank: rankResponse.rank,
          rankLetter: rankResponse.rankLetter,
          rankDescription: rankResponse.rankDescription,
          admin_id: rankResponse.admin_id,
          fullName: rankResponse.fullName,
          completion_rate: rankResponse.completion_rate,
          total_hours: rankResponse.total_hours,
          expected_hours: rankResponse.expected_hours,
          month: rankResponse.month,
          year: rankResponse.year,
          updated_at: new Date().toISOString(),
          discipline_score: rankResponse.rawData,
        };

        // อัปเดตในหน่วยความจำแทน localStorage เพื่อความปลอดภัย
        saveUserRankToMemory(newRankData);

        console.log(
          `[UserRankHelper] User rank refreshed successfully (Memory only):`,
          newRankData,
        );
        return newRankData;
      } else {
        console.warn(
          `[UserRankHelper] No rank data returned for user: ${userId}`,
        );
      }
    } catch (error) {
      console.error("[UserRankHelper] Error refreshing user rank:", error);
    }
  }

  return currentRank;
};
