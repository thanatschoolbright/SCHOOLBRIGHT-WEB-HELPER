import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { sendOvertimeEmail } from "@/server/mailer";
import Service, {
  CreateOvertimeInput,
} from "@services/overtime/overtime.service";
import dayjs from "dayjs";
import "dayjs/locale/th";

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
        where: { admin_id: Number(payload.requesterId) },
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

    const baseUrl =
      process.env.NEXT_PUBLIC_SB_HELPER_URL || "http://localhost:3000";

    // 5. สร้างเนื้อหา Email (HTML Template)
    const emailSubject = `[Overtime Request] มีการขออนุมัติ OT ใหม่จาก ${requesterInfo.fullName}`;

    const descriptionsHtml = payload.descriptions
      ?.map(
        (desc) => `
      <div style="margin-bottom: 20px; padding: 20px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f9fafb; padding-bottom: 12px;">
          <span style="color: #6b7280; font-size: 13px;">วันที่</span>
          <span style="color: #111827; font-weight: 600; font-size: 13px;">${dayjs(desc.date).format("DD/MM/YYYY")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280; font-size: 13px;">ช่วงเวลา</span>
          <span style="color: #111827; font-size: 13px;">${dayjs(desc.startDate).format("HH:mm")} - ${dayjs(desc.endDate).format("HH:mm")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280; font-size: 13px;">จำนวนชั่วโมง</span>
          <span style="color: #f97316; font-weight: 600; font-size: 13px;">${String(desc.duration)} ชม.</span>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #f3f4f6;">
          <div style="color: #6b7280; font-size: 12px; margin-bottom: 6px;">รายละเอียดงาน:</div>
          <div style="color: #111827; font-size: 13px; line-height: 1.6;">${desc.description ?? "-"}</div>
        </div>
        ${
          desc.assignee
            ? `
        <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
          ผู้เกี่ยวข้อง: <span style="color: #374151; font-weight: 500;">${String(desc.assignee)}</span>
        </div>
        `
            : ""
        }
      </div>
    `,
      )
      .join("");

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
          <div style="background-color: #f97316; padding: 48px 32px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Request for Overtime Approval</h2>
            <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">รายการขออนุมัติทำงานล่วงเวลา</p>
          </div>

          <div style="padding: 40px 32px;">
            <div style="margin-bottom: 32px;">
              <p style="margin: 0 0 18px; color: #111827; font-size: 16px; font-weight: 600;">เรียน ผู้จัดการ,</p>
              <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.7;">มีพนักงานส่งคำขออนุมัติทำงานล่วงเวลา (OT) ผ่านระบบ SB Web Helper โดยมีความประสงค์ขออนุมัติตามข้อมูลที่ปรากฏด้านล่างนี้:</p>
            </div>

            <div style="background-color: #fffaf0; border: 1px solid #ffedd5; border-radius: 12px; padding: 28px; margin-bottom: 40px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #7c2d12; font-size: 13px; width: 35%; vertical-align: top;"><strong>ชื่อ-นามสกุล</strong></td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 500;">: ${requesterInfo.fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #7c2d12; font-size: 13px; vertical-align: top;"><strong>รหัสพนักงาน</strong></td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px;">: ${requesterInfo.employeeCode}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #7c2d12; font-size: 13px; vertical-align: top;"><strong>แผนก</strong></td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px;">: ${requesterInfo.department}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #7c2d12; font-size: 13px; vertical-align: top;"><strong>วันที่ขออนุมัติ</strong></td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px;">: ${formattedRequestDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #7c2d12; font-size: 13px; vertical-align: top;"><strong>ประเภท OT</strong></td>
                  <td style="padding: 10px 0; color: #f97316; font-size: 15px; font-weight: 700;">: ${overtimeType}</td>
                </tr>
              </table>
            </div>

            <h3 style="margin: 0 0 20px; color: #111827; font-size: 16px; font-weight: 700; border-left: 4px solid #f97316; padding-left: 12px;">รายการงานที่ปฏิบัติ</h3>

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9;">
              ${descriptionsHtml ?? '<p style="text-align: center; color: #6b7280; font-size: 14px; padding: 32px;">ไม่มีรายละเอียดรายการงาน</p>'}
            </div>

            <div style="margin-top: 48px; text-align: center;">
              <a href="${baseUrl}/timesheet/overtime"
                 style="background-color: #f97316; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);">
                ตรวจสอบและอนุมัติในระบบ
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
