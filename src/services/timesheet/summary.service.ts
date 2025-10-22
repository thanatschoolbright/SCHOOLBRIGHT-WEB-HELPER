import axios from "axios";
import {z} from "zod";

import {API_URL} from "@/services/api-url";
import {Service as TimesheetService} from "@/services/backend/timesheet/entry.service";

//** ค่าคงที่และประเภทข้อมูล **//

const HOURS_PER_WORKDAY = 8;
const TZ_OFFSET_MINUTES = Number(process.env.TIMESHEET_TZ_OFFSET_MINUTES ?? 420);

export type TimesheetEntryRow = {
    createdBy: number | null;
    hours: any;
    date: Date;
};

export type TimesheetUser = {
    admin_id: number | string;
    firstname?: string;
    lastname?: string;
    nickname?: string | null;
    email?: string | null;
    tel?: string | null;
    employee_code?: string | null;
    position?: string | null;
};

export const MonthlySummarySchema = z.object({
    month: z
        .string()
        .min(1, "กรุณาระบุเดือน")
        .transform((value) => value.padStart(2, "0")),
    year: z
        .string()
        .min(4, "กรุณาระบุปี")
        .transform((value) => value.padStart(4, "0")),
    scope: z.enum(["elapsed", "full"]).optional().default("elapsed"),
});

export type MonthlySummaryRequest = z.infer<typeof MonthlySummarySchema>;

//** Utility Functions **//

/**
 * เพิ่มวันโดยไม่แก้ไขวันที่ต้นฉบับ
 * @param date - วันที่เริ่มต้น
 * @param amount - จำนวนวันที่ต้องการเพิ่ม
 * @returns วันที่ใหม่
 */
const addDays = (date: Date, amount: number): Date =>
    new Date(date.getTime() + amount * 86_400_000);

/**
 * แปลงวันที่ UTC เป็น yyyy-mm-dd ตามเวลาท้องถิ่น
 * @param utc - วันที่ในรูปแบบ UTC
 * @param offsetMinutes - ค่า offset ของ timezone (นาที)
 * @returns string รูปแบบ yyyy-mm-dd
 */
export const toISODateLocal = (
    utc: Date,
    offsetMinutes = TZ_OFFSET_MINUTES
): string => {
    const local = new Date(utc.getTime() + offsetMinutes * 60_000);
    return local.toISOString().slice(0, 10);
};

/**
 * สร้าง Label เดือนและปีภาษาไทย (เช่น "ตุลาคม 2568")
 * @param date - วันที่
 * @returns string เดือนและปีภาษาไทย
 */
const toThaiMonthYear = (date: Date): string =>
    date.toLocaleDateString("th-TH", {month: "long", year: "numeric"});

/**
 * คำนวณวันทำงาน (จ-ศ) ในช่วงวันที่ที่กำหนดตามเวลาท้องถิ่น
 * @param startUtc - วันที่เริ่มต้น (UTC)
 * @param endUtc - วันที่สิ้นสุด (UTC)
 * @param offsetMinutes - ค่า offset ของ timezone (นาที)
 * @returns object ที่มีจำนวนวันทำงานและชั่วโมงที่คาดหวัง
 */
export const computeWorkingDaysLocal = (
    startUtc: Date,
    endUtc: Date,
    offsetMinutes = TZ_OFFSET_MINUTES
) => {
    let workingDays = 0;
    const offsetMs = offsetMinutes * 60_000;

    for (
        let cursor = new Date(startUtc.getTime() + offsetMs);
        cursor <= new Date(endUtc.getTime() + offsetMs);
        cursor = addDays(cursor, 1)
    ) {
        const day = cursor.getDay();
        if (day >= 1 && day <= 5) {
            workingDays += 1;
        }
    }
    return {workingDays, expectedHours: workingDays * HOURS_PER_WORKDAY};
};

/**
 * สร้างช่วงเวลาที่มีผลของเดือนที่ร้องขอ (ไม่เกินวันปัจจุบันถ้า scope='elapsed')
 * @param month - เดือน (string)
 * @param year - ปี (string)
 * @param scope - 'elapsed' หรือ 'full'
 * @returns object ที่มีช่วงเวลาของเดือน
 */
export const buildEffectivePeriod = (
    month: string,
    year: string,
    scope: "elapsed" | "full"
) => {
    const monthIndex = Number(month) - 1;
    const yearNumber = Number(year);

    if (
        Number.isNaN(monthIndex) ||
        Number.isNaN(yearNumber) ||
        monthIndex < 0 ||
        monthIndex > 11
    ) {
        throw new Error("รูปแบบเดือนหรือปีไม่ถูกต้อง");
    }

    const offsetMs = TZ_OFFSET_MINUTES * 60_000;

    const startOfMonthUtc = new Date(
        Date.UTC(yearNumber, monthIndex, 1) - offsetMs
    );
    const endOfMonthUtc = new Date(
        Date.UTC(yearNumber, monthIndex + 1, 1) - offsetMs - 1
    );

    const nowUtc = new Date();
    const nowLocal = new Date(nowUtc.getTime() + offsetMs);
    const isCurrentMonth =
        nowLocal.getFullYear() === yearNumber && nowLocal.getMonth() === monthIndex;

    const endOfYesterdayUtc = new Date(
        Date.UTC(
            nowLocal.getFullYear(),
            nowLocal.getMonth(),
            nowLocal.getDate() - 1,
            23,
            59,
            59,
            999
        ) - offsetMs
    );

    const effectiveEndUtc =
        scope === "full"
            ? endOfMonthUtc
            : isCurrentMonth
                ? new Date(Math.min(endOfMonthUtc.getTime(), endOfYesterdayUtc.getTime()))
                : endOfMonthUtc;

    if (effectiveEndUtc < startOfMonthUtc) {
        throw new Error("ยังไม่ถึงช่วงเวลาที่ร้องขอ");
    }

    return {
        startOfMonthUtc,
        effectiveEndUtc,
        endOfMonthUtc,
        label: toThaiMonthYear(new Date(startOfMonthUtc.getTime() + offsetMs)),
    };
};

/**
 * รวมชั่วโมงทำงานของแต่ละผู้ใช้
 * @param entries - รายการบันทึกเวลา
 * @returns Map ที่มี key เป็น admin_id และ value เป็น tổng số giờ
 */
export const aggregateEntries = (
    entries: TimesheetEntryRow[]
): Map<string, number> => {
    const userHoursMap = new Map<string, number>();
    for (const entry of entries) {
        if (entry.createdBy != null) {
            const key = String(entry.createdBy);
            const currentHours = userHoursMap.get(key) ?? 0;
            userHoursMap.set(key, currentHours + Number(entry.hours ?? 0));
        }
    }
    return userHoursMap;
};

/**
 * จัดอันดับ Rank รายเดือนตามอัตราส่วนการทำงาน
 * @param completionRate - อัตราส่วนการทำงาน (%)
 * @returns object ที่มีเกรดและคำอธิบาย
 */
export const determineMonthlyRank = (completionRate: number) => {
    if (completionRate > 100)
        return {
            grade: "S" as const,
            description: "ยอดเยี่ยม! ทำงานเกินเป้าที่กำหนดในเดือนนี้",
        };
    if (completionRate >= 100)
        return {grade: "A" as const, description: "ทำครบหรือเกินเป้าในเดือนนี้"};
    if (completionRate >= 85)
        return {
            grade: "B" as const,
            description: "ใกล้เคียงครบเป้า เหลืออีกเล็กน้อย",
        };
    if (completionRate >= 70)
        return {grade: "C" as const, description: "ทำได้ตามแผนพอสมควร"};
    if (completionRate >= 50)
        return {grade: "D" as const, description: "ยังทำไม่ครบ ต้องเร่งปรับปรุง"};
    return {
        grade: "E" as const,
        description: "มีความเสี่ยงสูง ต้องติดตามอย่างใกล้ชิด",
    };
};

/**
 * ดึงข้อมูลผู้ใช้ทั้งหมดจาก SB Helper API
 * @returns Promise<TimesheetUser[]>
 */
export const fetchTimesheetUsers = async (): Promise<TimesheetUser[]> => {
    const baseUrl = API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;
    if (!baseUrl) {
        throw new Error("Missing SB Helper API base URL configuration");
    }
    const response = await axios.get<{ data: { data: TimesheetUser[] } }>(
        `${baseUrl}/api/v1/admin/user/`
    );
    const users = response?.data?.data?.data;
    return Array.isArray(users) ? users : [];
};

/**
 * สร้างข้อมูลสรุปรายเดือนสำหรับผู้ใช้แต่ละคน
 * @param users - รายชื่อผู้ใช้
 * @param totalsByUser - Map ชั่วโมงทำงานรวมของผู้ใช้
 * @param expectedHours - ชั่วโมงทำงานที่คาดหวัง
 * @returns array ของข้อมูลสรุปของผู้ใช้
 */
export const buildMonthlyRecords = (
    users: TimesheetUser[],
    totalsByUser: Map<string, number>,
    expectedHours: number
) => {
    const records = users.map((user) => {
        const key = String(user.admin_id);
        const totalHours = totalsByUser.get(key) ?? 0;
        const completionRate = expectedHours
            ? Number(((totalHours / expectedHours) * 100).toFixed(2))
            : 0;
        const rank = determineMonthlyRank(completionRate);

        return {
            admin_id: user.admin_id,
            full_name:
                [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || "-",
            nickname: user.nickname ?? null,
            employee_code: user.employee_code ?? null,
            position: user.position ?? "-",
            email: user.email ?? null,
            tel: user.tel ?? null,
            total_hours: Number(totalHours.toFixed(2)),
            expected_hours: expectedHours,
            completion_rate: completionRate,
            rank: rank.grade,
            rank_description: rank.description,
        };
    });

    return records
        .sort((a, b) => b.completion_rate - a.completion_rate)
        .map((record, index) => ({...record, order: index + 1}));
};

/**
 * แปลง Axios error เป็นข้อความที่มนุษย์อ่านได้
 * @param error - error object
 * @returns string ข้อความ error
 */
export const describeAxiosError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const payload = error.response?.data as
            | { message?: string; message_th?: string; message_en?: string }
            | undefined;
        return (
            payload?.message_th ||
            payload?.message_en ||
            payload?.message ||
            error.message ||
            "ไม่สามารถเชื่อมต่อบริการภายนอกได้"
        );
    }
    return error instanceof Error ? error.message : "Unexpected error";
};

/**
 * Service หลักสำหรับสร้าง Summary รายเดือน
 */
export const SummaryService = {
    /**
     * สร้างรายงานสรุปรายเดือน
     */
    generateMonthlySummary: async (request: MonthlySummaryRequest) => {
        const {month, year, scope} = request;

        // 1. คำนวณช่วงเวลาของเดือน
        const {startOfMonthUtc, effectiveEndUtc, endOfMonthUtc, label} =
            buildEffectivePeriod(month, year, scope);

        // 2. คำนวณวันทำงานและชั่วโมงที่คาดหวัง
        const {workingDays, expectedHours} = computeWorkingDaysLocal(
            startOfMonthUtc,
            effectiveEndUtc
        );

        // 3. ดึงข้อมูล entries และ users พร้อมกัน
        const [entries, users] = await Promise.all([
            TimesheetService.findEntriesBetween(startOfMonthUtc, effectiveEndUtc),
            fetchTimesheetUsers(),
        ]);

        // 4. ประมวลผลข้อมูล
        const totalsByUser = aggregateEntries(entries as unknown as TimesheetEntryRow[]);
        const records = buildMonthlyRecords(
            users,
            totalsByUser,
            expectedHours
        );

        // 5. สร้าง Metadata
        const {
            workingDays: workingDaysFullMonth,
            expectedHours: expectedHoursFullMonth,
        } = computeWorkingDaysLocal(startOfMonthUtc, endOfMonthUtc);

        const metadata = {
            range: {
                start_date: toISODateLocal(startOfMonthUtc),
                end_date: toISODateLocal(effectiveEndUtc),
                label_th: label,
            },
            mode: scope === "full" ? "full_month" : "elapsed_to_date",
            working_days: workingDays,
            expected_hours_per_member: expectedHours,
            working_days_full_month: workingDaysFullMonth,
            expected_hours_full_month: expectedHoursFullMonth,
            generated_at: new Date().toISOString(),
            notes:
                scope === "full"
                    ? "สรุปทั้งเดือน (รวมวันอนาคตด้วย)"
                    : "รวบรวมเฉพาะวันทำงานที่ผ่านไปแล้วในเดือนที่เลือก เพื่อความยุติธรรม",
        };

        return {records, metadata};
    },
};
