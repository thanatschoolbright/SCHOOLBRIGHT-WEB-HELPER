import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { sendOvertimeEmail } from "@/server/mailer";
import Service, {
  CreateOvertimeInput,
} from "@services/overtime/overtime.service";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { OvertimeAnalyticsInput } from "../_validation/analytics-schema";

/**
 * ✨ ดึงข้อมูล Analytics สำหรับ Dashboard (Trends, Budget, Departments)
 * @param payload เงื่อนไขการกรองข้อมูล
 */
export async function getOvertimeAnalytics(payload: OvertimeAnalyticsInput) {
  const startDate = payload.start_date
    ? dayjs(payload.start_date).startOf("day").toDate()
    : dayjs().subtract(5, "month").startOf("month").toDate();
  const endDate = payload.end_date
    ? dayjs(payload.end_date).endOf("day").toDate()
    : dayjs().endOf("month").toDate();

  // 1. ดึงข้อมูล Overtime ทั้งหมดในช่วงเวลาที่กำหนด
  const overtimeRecords = await PrismaTimesheet.overtime.findMany({
    where: {
      requestDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(payload.department_id && {
        requester: {
          department_id: Number(payload.department_id),
        },
      }),
    },
    include: {
      descriptions: true,
      requester: {
        include: {
          department: true,
        },
      },
    },
    orderBy: {
      requestDate: "asc",
    },
  });

  // 2. คำนวณ Trend Chart (รายเดือน)
  const trendsMap = new Map();
  // สร้างลำดับเดือนทั้งหมดในช่วงที่กำหนดไว้ก่อนเพื่อให้กราฟไม่แหว่ง
  let currentMonth = dayjs(startDate).startOf("month");
  while (
    currentMonth.isBefore(endDate) ||
    currentMonth.isSame(endDate, "month")
  ) {
    const monthKey = currentMonth.format("YYYY-MM");
    trendsMap.set(monthKey, {
      month: monthKey,
      label: currentMonth.locale("th").format("MMM YYYY"),
      total_hours: 0,
      request_count: 0,
    });
    currentMonth = currentMonth.add(1, "month");
  }

  // 3. คำนวณ Department Breakdown
  const deptMap = new Map();

  let totalDuration = 0;

  overtimeRecords.forEach((record) => {
    const monthKey = dayjs(record.requestDate).format("YYYY-MM");
    const recordHours = record.descriptions.reduce(
      (sum, desc) => sum + (Number(desc.duration) || 0),
      0,
    );

    // Update Trend
    if (trendsMap.has(monthKey)) {
      const current = trendsMap.get(monthKey);
      current.total_hours += recordHours;
      current.request_count += 1;
    }

    // Update Department Breakdown
    const deptName = record.requester?.department?.name_th || "ไม่ระบุแผนก";
    const deptId = record.requester?.department_id || 0;
    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, {
        id: deptId,
        department_name: deptName,
        total_hours: 0,
        percentage: 0,
      });
    }
    deptMap.get(deptName).total_hours += recordHours;
    totalDuration += recordHours;
  });

  // คำนวณ Percentage สำหรับแผนก
  const departmentBreakdown = Array.from(deptMap.values()).map((dept) => ({
    ...dept,
    percentage:
      totalDuration > 0
        ? Number(((dept.total_hours / totalDuration) * 100).toFixed(2))
        : 0,
  }));

  // 4. Budget Tracking (ตัวอย่าง Logic สมมติ เนื่องจากยังไม่มี Table Budget แยก)
  // ในที่นี้จะจำลอง Budget 100 ชม. ต่อเดือน หรือคำนวณจากจำนวนพนักงาน
  const budgetTracking = Array.from(trendsMap.values()).map((trend) => {
    const monthlyBudget = 150; // สมมติงบประมาณคงที่ 150 ชม./เดือน
    return {
      month: trend.month,
      label: trend.label,
      actual_hours: trend.total_hours,
      budget_hours: monthlyBudget,
      usage_percentage: Number(
        ((trend.total_hours / monthlyBudget) * 100).toFixed(2),
      ),
    };
  });

  return {
    trends: Array.from(trendsMap.values()),
    department_breakdown: departmentBreakdown,
    budget_tracking: budgetTracking,
    summary: {
      total_hours: totalDuration,
      total_requests: overtimeRecords.length,
      avg_hours_per_request:
        overtimeRecords.length > 0
          ? Number((totalDuration / overtimeRecords.length).toFixed(2))
          : 0,
    },
  };
}

/**
 * ✨ จัดการ Logic การสร้างรายการ Overtime และการส่ง Email แจ้งเตือน
 * @param payload ข้อมูลสำหรับการสร้าง Overtime
 * @returns ข้อมูลที่ถูกสร้างขึ้น
 */
export async function createOvertimeWithNotification(
  payload: CreateOvertimeInput,
) {
  // 1. สร้างรายการ Overtime ผ่าน Service หลัก
  const created = (await Service.create(payload)) as {
    id: string | number;
  };

  // 2. ดึงข้อมูล Email ของ Manager จาก Environment Variable
  const managerEmail = process.env.NEXT_PUBLIC_EMAIL_NOTIFICATION;
  if (managerEmail) {
    // 3. เตรียมข้อมูลผู้ขอ (Requester) สำหรับใส่ใน Email
    let fullName =
      `${payload.firstname ?? ""} ${payload.lastname ?? ""}`.trim();
    if (!fullName) fullName = "-";
    let employeeCode = payload.employee_code ?? "-";
    let department = payload.department ?? "-";
    let requesterEmail = "";

    // 4. หากมี requesterId ให้ดึงข้อมูลเพิ่มเติมจาก Database (ชื่อไทย, รหัสพนักงาน, แผนก, อีเมล)
    if (payload.requesterId) {
      const user = await PrismaTimesheet.user.findFirst({
        where: { id: Number(payload.requesterId) },
        include: { department: true },
      });

      if (user) {
        const u = user as unknown as {
          firstname_th?: string | null;
          lastname_th?: string | null;
          employee_code?: string | null;
          email?: string | null;
          department?: { name_th?: string | null } | null;
        };
        const dbFullName =
          `${u.firstname_th ?? ""} ${u.lastname_th ?? ""}`.trim();
        if (dbFullName) fullName = dbFullName;
        employeeCode = u.employee_code ?? employeeCode;
        department = u.department?.name_th ?? department;
        requesterEmail = u.email ?? "";
      }
    }

    const requesterInfo = {
      fullName,
      employeeCode,
      department,
    };

    const formattedRequestDate = dayjs(payload.requestDate).format(
      "DD/MM/YYYY",
    );
    const overtimeType =
      payload.overtimeType === "weekday"
        ? "วันทำงานปกติ"
        : "วันหยุด/นักขัตฤกษ์";

    const baseUrl =
      process.env.NEXT_PUBLIC_SB_HELPER_URL || "http://localhost:3000";

    // 5. สร้างเนื้อหา Email (HTML Template)
    const emailSubject = `[Overtime Request] มีการขออนุมัติ OT ใหม่จาก ${requesterInfo.fullName}`;

    // ── สร้าง rows ของตารางรายการงาน ──
    const totalHours = (payload.descriptions ?? []).reduce(
      (sum, d) => sum + (Number(d.duration) || 0),
      0,
    );

    const descriptionRows = (payload.descriptions ?? [])
      .map(
        (desc, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#fafafa"};">
          <td style="padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f5f9; white-space: nowrap;">
            ${dayjs(desc.date).format("DD/MM/YYYY")}
          </td>
          <td style="padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f5f9; white-space: nowrap;">
            ${dayjs(desc.startDate).format("HH:mm")} — ${dayjs(desc.endDate).format("HH:mm")}
          </td>
          <td style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: #ea580c; border-bottom: 1px solid #f1f5f9; text-align: center; white-space: nowrap;">
            ${String(desc.duration)} ชม.
          </td>
          <td style="padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f5f9; line-height: 1.6;">
            ${desc.description ?? "-"}
          </td>
          <td style="padding: 14px 16px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #f1f5f9; white-space: nowrap;">
            ${desc.assignee ? String(desc.assignee) : "—"}
          </td>
        </tr>`,
      )
      .join("");

    const descriptionsTable =
      (payload.descriptions ?? []).length > 0
        ? `
        <table style="width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #fff7ed;">
              <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #7c2d12; text-align: left; border-bottom: 2px solid #fed7aa; white-space: nowrap;">วันที่</th>
              <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #7c2d12; text-align: left; border-bottom: 2px solid #fed7aa; white-space: nowrap;">ช่วงเวลา</th>
              <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #7c2d12; text-align: center; border-bottom: 2px solid #fed7aa; white-space: nowrap;">ชั่วโมง</th>
              <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #7c2d12; text-align: left; border-bottom: 2px solid #fed7aa;">รายละเอียดงาน</th>
              <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #7c2d12; text-align: left; border-bottom: 2px solid #fed7aa; white-space: nowrap;">ผู้เกี่ยวข้อง</th>
            </tr>
          </thead>
          <tbody>
            ${descriptionRows}
            <tr style="background-color: #fff7ed;">
              <td colspan="2" style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #7c2d12; text-align: right; border-top: 2px solid #fed7aa;">รวมทั้งหมด</td>
              <td style="padding: 12px 16px; font-size: 14px; font-weight: 800; color: #ea580c; text-align: center; border-top: 2px solid #fed7aa;">${totalHours.toFixed(1)} ชม.</td>
              <td colspan="2" style="border-top: 2px solid #fed7aa;"></td>
            </tr>
          </tbody>
        </table>`
        : `<p style="text-align:center;color:#6b7280;font-size:14px;padding:32px 0;">ไม่มีรายละเอียดรายการงาน</p>`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color:#f1f5f9;padding:40px 20px;margin:0;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;">
  <div style="max-width:720px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#c2410c 0%,#ea580c 60%,#fb923c 100%);border-radius:16px 16px 0 0;padding:48px 40px 40px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:6px 16px;margin-bottom:20px;">
        <span style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">OVERTIME REQUEST</span>
      </div>
      <h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Request for Overtime Approval</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">รายการขออนุมัติทำงานล่วงเวลา · ระบบ SB Web Helper</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:40px 40px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

      <!-- Greeting -->
      <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:600;">เรียน ผู้จัดการ,</p>
      <p style="margin:0 0 36px;color:#4b5563;font-size:14px;line-height:1.8;">
        มีพนักงานส่งคำขออนุมัติทำงานล่วงเวลา (OT) ผ่านระบบ SB Web Helper
        โดยมีความประสงค์ขออนุมัติตามข้อมูลที่ปรากฏด้านล่างนี้:
      </p>

      <!-- Employee Info Card -->
      <div style="background:#fffaf7;border:1px solid #fed7aa;border-radius:12px;padding:28px 32px;margin-bottom:36px;">
        <div style="font-size:11px;font-weight:700;color:#c2410c;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #ffedd5;">
          ข้อมูลพนักงานผู้ขออนุมัติ
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:9px 0;color:#9a3412;font-size:12px;font-weight:600;width:38%;vertical-align:middle;">ชื่อ-นามสกุล</td>
            <td style="padding:9px 0;color:#111827;font-size:14px;font-weight:600;">: ${requesterInfo.fullName}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#9a3412;font-size:12px;font-weight:600;vertical-align:middle;border-top:1px solid #fff7ed;">รหัสพนักงาน</td>
            <td style="padding:9px 0;color:#374151;font-size:13px;border-top:1px solid #fff7ed;">: ${requesterInfo.employeeCode}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#9a3412;font-size:12px;font-weight:600;vertical-align:middle;border-top:1px solid #fff7ed;">แผนก</td>
            <td style="padding:9px 0;color:#374151;font-size:13px;border-top:1px solid #fff7ed;">: ${requesterInfo.department}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#9a3412;font-size:12px;font-weight:600;vertical-align:middle;border-top:1px solid #fff7ed;">วันที่ขออนุมัติ</td>
            <td style="padding:9px 0;color:#374151;font-size:13px;border-top:1px solid #fff7ed;">: ${formattedRequestDate}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#9a3412;font-size:12px;font-weight:600;vertical-align:middle;border-top:1px solid #fff7ed;">ประเภท OT</td>
            <td style="padding:9px 0;border-top:1px solid #fff7ed;">
              <span style="display:inline-block;padding:4px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;color:#ea580c;font-size:13px;font-weight:700;">
                ${overtimeType}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Work Descriptions Table -->
      <div style="margin-bottom:36px;">
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <div style="width:4px;height:20px;background:linear-gradient(180deg,#f97316,#ea580c);border-radius:2px;margin-right:10px;flex-shrink:0;"></div>
          <span style="color:#111827;font-size:15px;font-weight:700;">รายการงานที่ปฏิบัติ</span>
          <span style="margin-left:10px;padding:2px 10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;font-size:11px;font-weight:600;color:#ea580c;">
            ${(payload.descriptions ?? []).length} รายการ · ${totalHours.toFixed(1)} ชม.
          </span>
        </div>
        <div style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
          ${descriptionsTable}
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-top:12px;">
        <a href="${baseUrl}/timesheet/overtime"
           style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;padding:16px 44px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(249,115,22,0.35);letter-spacing:0.3px;">
          ตรวจสอบและอนุมัติในระบบ →
        </a>
        <p style="margin:14px 0 0;color:#9ca3af;font-size:12px;">คลิกปุ่มด้านบนเพื่อเข้าสู่ระบบและดำเนินการอนุมัติ</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
      <p style="margin:0 0 16px;color:#94a3b8;font-size:12px;line-height:1.8;">
        นี่คือการแจ้งเตือนอัตโนมัติจากระบบ SB Web Helper — กรุณาอย่าตอบกลับอีเมลนี้
      </p>
      <!-- Credit -->
      <div style="display:inline-block;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:4px;">
        <p style="margin:0 0 3px;color:#cbd5e1;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">System Developed by</p>
        <p style="margin:0 0 2px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.5px;">THANAT PROMPIRIYA</p>
        <p style="margin:0 0 12px;color:#94a3b8;font-size:10px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Head of Technology · SchoolBright</p>
        <p style="margin:0;color:#cbd5e1;font-size:11px;">© ${new Date().getFullYear()} SchoolBright Co., Ltd. All rights reserved.</p>
      </div>
    </div>

  </div>
</body>
</html>`;

    try {
      // 6. ส่ง Email หา Manager
      await sendOvertimeEmail(managerEmail, emailSubject, "", emailHtml);

      // 7. ส่ง Email หา ผู้ขอ (Requester) หากมีอีเมลและไม่ใช่อีเมลเดียวกับ Manager
      if (
        requesterEmail &&
        requesterEmail.trim().toLowerCase() !==
          managerEmail.trim().toLowerCase()
      ) {
        const requesterEmailSubject = `[Overtime Request] ระบบได้รับคำขอ OT ของคุณแล้ว`;
        await sendOvertimeEmail(
          requesterEmail,
          requesterEmailSubject,
          "",
          emailHtml,
        );
      }
    } catch (mailError) {
      console.error("Failed to send OT notification email:", mailError);
    }
  }

  return created;
}

/**
 * ✨ อัปเดตสถานะ Overtime และแจ้งเตือนผู้ขอผ่าน Email
 * @param id ID ของรายการ Overtime
 * @param status สถานะใหม่
 * @param updatedBy ID ของผู้อัปเดต
 */
export async function updateOvertimeStatusWithNotification(
  id: number,
  status: string,
  updatedBy?: number,
) {
  // 1. อัปเดตสถานะใน Database
  const updated = await Service.update(id, {
    status,
    updatedBy,
  });

  // 2. ดึงข้อมูลรายการหลังจากอัปเดตเพื่อส่ง Email แจ้งเตือน
  try {
    const overtime = await PrismaTimesheet.overtime.findUnique({
      where: { id },
      include: {
        requester: {
          include: { department: true },
        },
      },
    });

    if (overtime?.requester?.email) {
      const u = overtime.requester as unknown as {
        firstname_th?: string | null;
        lastname_th?: string | null;
        email: string;
      };

      const fullName = `${u.firstname_th ?? ""} ${u.lastname_th ?? ""}`.trim();
      const statusLabel =
        {
          approved: "อนุมัติ",
          rejected: "ปฏิเสธ",
          paid: "จ่าย OT สำเร็จ",
          payment_failed: "จ่าย OT ล้มเหลว",
          pending: "รออนุมัติ",
        }[status] || status;

      const baseUrl =
        process.env.NEXT_PUBLIC_SB_HELPER_URL || "http://localhost:3000";
      const emailSubject = `[Overtime Status] คำขอ OT ของคุณได้รับการ${statusLabel}แล้ว`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          </style>
        </head>
        <body style="background-color: #f8fafc; padding: 40px 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="background-color: ${status === "approved" || status === "paid" ? "#22c55e" : status === "rejected" || status === "payment_failed" ? "#ef4444" : "#f97316"}; padding: 48px 32px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Overtime Status Updated</h2>
              <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">แจ้งเตือนการเปลี่ยนแปลงสถานะคำขอ OT</p>
            </div>

            <div style="padding: 40px 32px;">
              <p style="margin: 0 0 18px; color: #111827; font-size: 16px; font-weight: 600;">เรียนคุณ ${fullName},</p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.7;">
                คำขออนุมัติทำงานล่วงเวลา (OT) ของคุณที่บันทึกไว้ในระบบ SB Web Helper ได้รับการอัปเดตสถานะเรียบร้อยแล้ว:
              </p>

              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #f1f5f9;">
                <span style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 8px;">สถานะใหม่ของคุณคือ</span>
                <span style="display: inline-block; padding: 8px 16px; border-radius: 9999px; font-weight: 700; font-size: 18px;
                  ${
                    status === "approved" || status === "paid"
                      ? "background-color: #dcfce7; color: #15803d;"
                      : status === "rejected" || status === "payment_failed"
                        ? "background-color: #fee2e2; color: #b91c1c;"
                        : "background-color: #ffedd5; color: #9a3412;"
                  }">
                  ${statusLabel}
                </span>
              </div>

              <div style="margin-top: 40px; text-align: center;">
                <a href="${baseUrl}/timesheet/overtime"
                   style="color: #6366f1; text-decoration: underline; font-weight: 500; font-size: 14px;">
                  คลิกที่นี่เพื่อตรวจสอบรายละเอียดในระบบ
                </a>
              </div>
            </div>

            <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 32px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                นี่คือการแจ้งเตือนอัตโนมัติจากระบบ SB Web Helper<br>
                © 2026 SCHOOLBRIGHT. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendOvertimeEmail(u.email, emailSubject, "", emailHtml);
    }
  } catch (mailError) {
    console.error("Failed to send OT status notification email:", mailError);
  }

  return updated;
}
