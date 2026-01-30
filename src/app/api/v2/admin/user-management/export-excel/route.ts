import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import ExcelJS from "exceljs";
import dayjs from "dayjs";

/**
 * @description API สำหรับ Export ข้อมูลพนักงานเป็น Excel (IPO Enterprise Grade)
 * @method GET
 * @path /api/v2/admin/user-management/export-excel
 */
export async function GET(req: NextRequest) {
  try {
    // 1. ดึงข้อมูลพนักงานทั้งหมด
    const users = await UserManagementService.findAllForExport();

    // 2. เตรียมข้อมูลวันที่และเวลา (พุทธศักราช)
    const now = dayjs();
    const thaiYear = now.year() + 543;
    const formattedDate = `${now.format("DD/MM")}/${thaiYear}`;
    const formattedTime = now.format("HH:mm");
    const filename = `รายงานพนักงานบริษัทจับจ่ายคอร์เปอเรชัน จำกัด วันที่ ${formattedDate} เวลา ${formattedTime}.xlsx`;

    // 3. สร้าง Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("พนักงานทั้งหมด");

    // --- ตกแต่ง Header ( enterprise style ) ---
    // หัวข้อรายงาน
    worksheet.mergeCells("A1:M1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value =
      "รายงานข้อมูลพนักงานบริษัท จับจ่าย คอร์เปอเรชัน จำกัด ( IPO Preparation )";
    titleCell.font = {
      name: "Tahoma",
      size: 16,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1F4E78" }, // Navy Blue Enterprise
    };

    // รายละเอียดการออกข้อมูล
    worksheet.mergeCells("A2:M2");
    const subtitleCell = worksheet.getCell("A2");
    subtitleCell.value = `ข้อมูล ณ วันที่: ${formattedDate} | เวลา: ${formattedTime} น. | จำนวนพนักงานทั้งสิ้น: ${users.length} รายการ`;
    subtitleCell.font = { name: "Tahoma", size: 10, italic: true };
    subtitleCell.alignment = { vertical: "middle", horizontal: "right" };

    // หัวตาราง
    const headers = [
      { header: "ลำดับ", key: "index", width: 8 },
      { header: "รหัสพนักงาน", key: "employee_code", width: 15 },
      { header: "ชื่อสถาบันหลัก (Admin ID)", key: "admin_id", width: 15 },
      { header: "ชื่อ (ภาษาไทย)", key: "firstname_th", width: 20 },
      { header: "นามสกุล (ภาษาไทย)", key: "lastname_th", width: 20 },
      { header: "ชื่อเล่น", key: "nickname", width: 12 },
      { header: "แผนก/ฝ่ายงาน", key: "department", width: 20 },
      { header: "ตำแหน่งงาน", key: "position", width: 25 },
      { header: "อีเมลติดต่อ", key: "email", width: 25 },
      { header: "เบอร์โทรศัพท์", key: "phone", width: 15 },
      { header: "ประเภทพนักงาน", key: "employment_type", width: 18 },
      { header: "สิทธิ์การเข้าถึง", key: "role", width: 18 },
      { header: "สถานะการทำงาน", key: "status", width: 12 },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.width,
    }));

    // ปรับแต่งแถว Header (Row 3)
    const headerRow = worksheet.getRow(3);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Tahoma", bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }, // Blue
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 4. ใส่ข้อมูล
    users.forEach((user, idx) => {
      const row = worksheet.addRow({
        index: idx + 1,
        employee_code: user.employee_code || "-",
        admin_id: user.admin_id,
        firstname_th: user.firstname_th || "-",
        lastname_th: user.lastname_th || "-",
        nickname: user.nickname || "-",
        department: user.department?.name_th || "-",
        position: user.position_ref?.name_th || (user as any).position || "-",
        email: user.email || "-",
        phone: user.phone || "-",
        employment_type: mapEmploymentType(user.employment_type),
        role: user.role?.role_name || "-",
        status: user.status === "ACTIVE" ? "ปกติ" : "ระงับการใช้งาน",
      });

      // สลับสีแถว (Zebra Stripe)
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F2F2F2" },
          };
        });
      }

      // ตีเส้นขอบทุกเซลล์
      row.eachCell((cell) => {
        cell.font = { name: "Tahoma", size: 10 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        // กึ่งกลางสำหรับบางคอลัมน์
        const colNum = Number(cell.col);
        if (
          colNum === 1 ||
          colNum === 2 ||
          colNum === 3 ||
          colNum === 10 ||
          colNum === 11 ||
          colNum === 13
        ) {
          cell.alignment = { horizontal: "center" };
        }
      });
    });

    // 5. เขียน Workbook ลง Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 6. ส่ง Response กลับ
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("Export Excel Error:", err);
    return NextResponse.json(
      {
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel",
        error: err.message,
      },
      { status: 500 },
    );
  }
}

function mapEmploymentType(type: string | null) {
  switch (type) {
    case "FULL_TIME":
      return "พนักงานประจำ (FT)";
    case "PART_TIME":
      return "พนักงานชั่วคราว (PT)";
    case "CONTRACT":
      return "สัญญาจ้าง (Outsource)";
    case "INTERN":
      return "นักศึกษาฝึกงาน";
    default:
      return "พนักงานประจำ (FT)";
  }
}
