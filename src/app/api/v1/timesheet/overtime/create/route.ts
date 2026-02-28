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
      const emailDate = dayjs(payload.requestDate).format("D MMMM YYYY");
      const emailSubject = `[Overtime Request] มีการขออนุมัติ OT ใหม่จาก ${payload.firstname ?? ""} ${payload.lastname ?? ""}`;

      const descriptionsHtml = payload.descriptions
        ?.map(
          (desc) => `
        <div style="margin-bottom: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
          <strong>วันที่:</strong> ${String(desc.date ?? emailDate)}<br/>
          <strong>เวลา:</strong> ${String(desc.startDate ?? "-")} ถึง ${String(desc.endDate ?? "-")}<br/>
          <strong>จำนวน:</strong> ${String(desc.duration)} ชั่วโมง<br/>
          <strong>รายละเอียด:</strong> ${desc.description ?? "-"}<br/>
          <strong>ผู้ที่เกียวข้อง:</strong> ${String(desc.assignee ?? "-")}
        </div>
      `,
        )
        .join("");

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1a73e8; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">รายการขออนุมัติ OT ใหม่</h1>
          </div>
          <div style="padding: 20px; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px;">เรียน Manager,</p>
            <p>มีการส่งคำขออนุมัติทำงานล่วงเวลา (OT) ใหม่ผ่านระบบ โดยมีรายละเอียดดังนี้:</p>

            <div style="background-color: #f1f3f4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #666;"><strong>ชื่อ-นามสกุล<strong></td>
                  <td style="padding: 5px 0;">: ${payload.firstname ?? ""} ${payload.lastname ?? ""}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;"><strong>รหัสพนักงาน<strong></td>
                  <td style="padding: 5px 0;">: ${payload.employee_code ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;"><strong>แผนก<strong></td>
                  <td style="padding: 5px 0;">: ${payload.department ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;"><strong>วันที่ขอ<strong></td>
                  <td style="padding: 5px 0;">: ${emailDate}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;"><strong>ประเภท OT<strong></td>
                  <td style="padding: 5px 0;">: ${payload.overtimeType ?? "-"}</td>
                </tr>
              </table>
            </div>

            <h3 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 5px;">รายละเอียดงาน</h3>
            ${descriptionsHtml ?? "<p>ไม่มีรายละเอียดเพิ่มเติม</p>"}

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SB_HELPER_URL ?? ""}/timesheet/overtime"
                 style="background-color: #1a73e8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                ดูรายการทั้งหมดในระบบ
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; color: #999; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">นี่เป็นอีเมลแจ้งเตือนอัตโนมัติจากระบบ SB Web Helper กรุณาอย่าตอบกลับอีเมลนี้</p>
          </div>
        </div>
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
