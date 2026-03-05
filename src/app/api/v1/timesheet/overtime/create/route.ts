import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { sendOvertimeEmail } from "@/server/mailer";
import { handleError } from "@helpers/controller/handle-error.params";
import Service, {
  CreateOvertimeInput,
} from "@services/overtime/overtime.service";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

dayjs.locale("th");

const DescriptionSchema = z.object({
  date: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional(),
  ),
  startDate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional(),
  ),
  endDate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional(),
  ),
  duration: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    return v;
  }, z.number().nonnegative()),
  description: z.string().optional(),
  assignee: z.union([z.string(), z.number()]).optional(),
});

// accept snake_case input from clients
const CreateOvertimeSnakeSchema = z.object({
  requester_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  employee_code: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  request_date: z.preprocess(
    (v) => (typeof v === "string" ? v : v),
    z.string().optional(),
  ),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  overtime_type: z.string().optional(),
  descriptions: z.array(DescriptionSchema).optional(),
  approver_id: z.string().optional(),
  status: z.string().optional(),
  created_by: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().int().optional(),
  ),
});

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(
    request,
    CreateOvertimeSnakeSchema,
  );
  if (error) return error;

  try {
    const d = data;
    const payload: CreateOvertimeInput = {
      requesterId: d.requester_id,
      firstname: d.first_name ?? undefined,
      lastname: d.last_name ?? undefined,
      employee_code: d.employee_code,
      role: d.role,
      department: d.department,
      requestDate: d.request_date ? new Date(d.request_date) : new Date(),
      startTime: d.start_time,
      endTime: d.end_time,
      overtimeType: d.overtime_type,
      descriptions: d.descriptions,
      approverId: d.approver_id,
      status: d.status,
      createdBy: d.created_by,
    };

    const created = (await Service.create(payload)) as {
      id: string | number;
    };

    // --- Send Email Notification ---
    const managerEmail = process.env.NEXT_PUBLIC_EMAIL_NOTIFICATION;
    if (managerEmail) {
      // Fetch enriched requester info from database
      let fullName =
        `${payload.firstname ?? ""} ${payload.lastname ?? ""}`.trim();
      if (!fullName) fullName = "-";
      let employeeCode = payload.employee_code ?? "-";
      let department = payload.department ?? "-";

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
            department?: { name_th?: string | null } | null;
          };
          const dbFullName =
            `${u.firstname_th ?? ""} ${u.lastname_th ?? ""}`.trim();
          if (dbFullName) fullName = dbFullName;
          employeeCode = u.employee_code ?? employeeCode;
          department = u.department?.name_th ?? department;
        }
      }

      const requesterInfo = {
        fullName,
        employeeCode,
        department,
      };

      const formattedRequestDate = dayjs(payload.requestDate).format(
        "DD/MM/YYYY HH:mm",
      );
      const overtimeType = "ปกติ";

      const emailSubject = `[Overtime Request] มีการขออนุมัติ OT ใหม่จาก ${requesterInfo.fullName}`;

      const descriptionsHtml = payload.descriptions
        ?.map(
          (desc) => `
        <div style="margin-bottom: 12px; padding: 16px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #f9fafb; padding-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">วันที่</span>
            <span style="color: #111827; font-weight: 600; font-size: 13px;">${dayjs(desc.date).format("DD/MM/YYYY")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">ช่วงเวลา</span>
            <span style="color: #111827; font-size: 13px;">${dayjs(desc.startDate).format("HH:mm")} - ${dayjs(desc.endDate).format("HH:mm")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">จำนวนชั่วโมง</span>
            <span style="color: #f97316; font-weight: 600; font-size: 13px;">${String(desc.duration)} ชม.</span>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #f3f4f6;">
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">รายละเอียดงาน:</div>
            <div style="color: #111827; font-size: 13px; line-height: 1.5;">${desc.description ?? "-"}</div>
          </div>
          ${
            desc.assignee
              ? `
          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            ผู้เกี่ยวข้อง: <span style="color: #374151;">${String(desc.assignee)}</span>
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
        <body style="background-color: #f8fafc; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #f97316; padding: 32px 20px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">Request for Overtime Approval</h2>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">รายการขออนุมัติทำงานล่วงเวลา</p>
            </div>
            
            <div style="padding: 32px 24px;">
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 500;">เรียน ผู้จัดการ,</p>
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">มีพนักงานส่งคำขออนุมัติทำงานล่วงเวลา (OT) ผ่านระบบ SB Web Helper โปรดตรวจสอบข้อมูลด้านล่าง:</p>
              </div>

              <div style="background-color: #fffaf0; border: 1px solid #ffedd5; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #7c2d12; font-size: 13px; width: 40%;"><strong>ชื่อ-นามสกุล</strong></td>
                    <td style="padding: 6px 0; color: #111827; font-size: 14px;">: ${requesterInfo.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7c2d12; font-size: 13px;"><strong>รหัสพนักงาน</strong></td>
                    <td style="padding: 6px 0; color: #111827; font-size: 14px;">: ${requesterInfo.employeeCode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7c2d12; font-size: 13px;"><strong>แผนก</strong></td>
                    <td style="padding: 6px 0; color: #111827; font-size: 14px;">: ${requesterInfo.department}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7c2d12; font-size: 13px;"><strong>วันที่ขออนุมัติ</strong></td>
                    <td style="padding: 6px 0; color: #111827; font-size: 14px;">: ${formattedRequestDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7c2d12; font-size: 13px;"><strong>ประเภท OT</strong></td>
                    <td style="padding: 6px 0; color: #f97316; font-size: 14px; font-weight: 700;">: ${overtimeType}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin: 0 0 16px; color: #111827; font-size: 15px; font-weight: 600; border-left: 3px solid #f97316; padding-left: 10px;">รายการงานที่ปฏิบัติ</h3>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 12px;">
                ${descriptionsHtml ?? '<p style="text-align: center; color: #6b7280; font-size: 14px; padding: 20px;">ไม่มีรายละเอียดรายการงาน</p>'}
              </div>

              <div style="margin-top: 40px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SB_HELPER_URL ?? ""}/timesheet/overtime" 
                   style="background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; transition: background-color 0.2s;">
                  ตรวจสอบและอนุมัติในระบบ
                </a>
              </div>
            </div>

            <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                นี่คือการแจ้งเตือนอัตโนมัติจากระบบ SB Web Helper<br>
                © 2026 SCHOOLBRIGHT. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendOvertimeEmail(managerEmail, emailSubject, "", emailHtml);
      } catch (mailError) {
        console.error("Failed to send OT notification email:", mailError);
      }
    }

    return NextResponse.json(
      successResponse({
        data: created,
        status: 201,
        message_en: "Created",
        message_th: "สร้างรายการสำเร็จ",
      }),
      { status: 201 },
    );
  } catch (err: unknown) {
    // Delegate to centralized error handler which logs and formats the response
    return handleError(err, "POST /api/v1/timesheet/overtime/create error");
  }
}
