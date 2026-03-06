import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { sendMail } from "@/server/mailer";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import ExcelJS from "exceljs";

export interface CreateUserDto {
  username: string;
  password: string;
  admin_id: number;
  employee_code?: string;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  nickname?: string;
  position?: string;
  department_id?: number | null;
  email?: string;
  phone?: string;
  birth_date?: string | Date | null;
  role_id?: number | null;
  position_id?: number | null;
  profile_image?: string | null;
  profile_image_path?: string | null;
  created_by?: number | null;
  joined_date?: string | Date | null;
  resigned_date?: string | Date | null;
  employment_type?: string | null;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  admin_id?: number;
  employee_code?: string;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  nickname?: string;
  position?: string;
  department_id?: number | null;
  status?: string;
  email?: string;
  phone?: string;
  birth_date?: string | Date | null;
  role_id?: number | null;
  position_id?: number | null;
  profile_image?: string | null;
  profile_image_path?: string | null;
  updated_by?: number | null;
  joined_date?: string | Date | null;
  resigned_date?: string | Date | null;
  employment_type?: string | null;
  is_deleted?: boolean;
}

export const UserManagementService = {
  // สร้างผู้ใช้งานใหม่
  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await PrismaTimesheet.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        admin_id: Number(data.admin_id),
        employee_code: data.employee_code,
        firstname_th: data.firstname_th,
        lastname_th: data.lastname_th,
        firstname_en: data.firstname_en,
        lastname_en: data.lastname_en,
        nickname: data.nickname,
        department_id: data.department_id ?? undefined,
        email: data.email,
        phone: data.phone || (data as any).tel,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
        status: "ACTIVE",
        role_id: data.role_id ?? undefined,
        position_id: data.position_id ?? undefined,
        profile_image_path: data.profile_image_path || data.profile_image,
        joined_date: data.joined_date ? new Date(data.joined_date) : undefined,
        resigned_date: data.resigned_date
          ? new Date(data.resigned_date)
          : undefined,
        employment_type: data.employment_type || "FULL_TIME",
      },
    });
  },

  // อัปเดตข้อมูลผู้ใช้งาน
  async update(id: number, data: UpdateUserDto) {
    const updateData: any = {
      username: data.username,
      admin_id: data.admin_id ? Number(data.admin_id) : undefined,
      employee_code: data.employee_code,
      firstname_th: data.firstname_th,
      lastname_th: data.lastname_th,
      firstname_en: data.firstname_en,
      lastname_en: data.lastname_en,
      nickname: data.nickname,
      department_id: data.department_id ?? undefined,
      email: data.email,
      phone: data.phone || (data as any).tel,
      birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
      status: data.status,
      role_id: data.role_id ?? undefined,
      position_id: data.position_id ?? undefined,
      profile_image_path: data.profile_image_path || data.profile_image,
      joined_date: data.joined_date ? new Date(data.joined_date) : undefined,
      resigned_date: data.resigned_date
        ? new Date(data.resigned_date)
        : undefined,
      employment_type: data.employment_type,
      updated_at: new Date(),
      updated_by: data.updated_by,
      is_deleted: data.is_deleted,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
      // เมื่อมีการรีเซ็ตรหัสผ่าน ให้ปลดล็อกจำนวนครั้งที่พยายามล็อกอินผิดพลาดให้อัตโนมัติ (IPO Security Step)
      updateData.failed_login_attempts = 0;
    }

    return await PrismaTimesheet.user.update({
      where: { id },
      data: updateData,
    });
  },

  // ปลดล็อกการระงับใช้งาน (Reset Failed Login Attempts) พร้อมแจ้งเตือนทางอีเมล
  async unlock(id: number, updatedBy?: number) {
    const user = await PrismaTimesheet.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
    }

    const result = await PrismaTimesheet.user.update({
      where: { id },
      data: {
        failed_login_attempts: 0,
        status: "ACTIVE", // ปลดล็อกแล้วให้เป็น ACTIVE เสมอ
        updated_by: updatedBy,
        updated_at: new Date(),
      },
    });

    // แจ้งเตือนผ่านอีเมล (ถ้ามี Email)
    if (user.email) {
      try {
        const subject = "แจ้งเตือนการปลดล็อกบัญชีผู้ใช้งาน - SchoolBright";
        const fullName =
          `${user.firstname_th || ""} ${user.lastname_th || ""}`.trim();
        const html = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2ecc71;">แจ้งเตือนการปลดล็อกบัญชีผู้ใช้งาน</h2>
            <p>สวัสดีคุณ <strong>${fullName || user.username}</strong>,</p>
            <p>บัญชีผู้ใช้งานของคุณได้รับการปลดล็อกโดยผู้ดูแลระบบเรียบร้อยแล้ว เนื่องจากก่อนหน้านี้มีการระบุรหัสผ่านผิดเกินกำหนด</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p><strong>รายละเอียดการตรวจสอบ:</strong></p>
            <ul>
              <li><strong>ชื่อผู้ใช้งาน:</strong> ${user.username}</li>
              <li><strong>สถานะปัจจุบัน:</strong> <span style="color: #2ecc71;">ใช้งานได้ปกติ (Active)</span></li>
              <li><strong>วันที่ดำเนินการ:</strong> ${dayjs().format("DD/MM/YYYY HH:mm")}</li>
            </ul>
            <p>หากคุณไม่ได้ดำเนินการร้องขอ หรือพบความผิดปกติ กรุณาเปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
            <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
              ขอแสดงความนับถือ,<br />
              ทีมพัฒนา SchoolBright
            </p>
          </div>
        `;

        await sendMail(user.email, subject, "", html);
      } catch (error) {
        console.error("[MAIL_SEND_ERROR]:", error);
        // ไม่ throw error เพื่อให้การ unlock ทำงานต่อได้ปกติ
      }
    }

    return result;
  },

  // ลบผู้ใช้งาน (Soft Delete)
  async delete(id: number, deletedBy?: number) {
    return await PrismaTimesheet.user.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        updated_by: deletedBy, // Assuming updated_by can be used for who deleted it or add a deleted_by field if Schema supports it.
        // Schema has deleted_at but not explicit deleted_by. We can use updated_by.
      },
    });
  },

  // ดึงข้อมูลผู้ใช้งานตาม ID
  async findById(id: number) {
    return await PrismaTimesheet.user.findFirst({
      where: { id, is_deleted: false },
      include: {
        role: true,
        position_ref: true,
        department: true,
      },
    });
  },

  // ดึงข้อมูลผู้ใช้งานทั้งหมด (รองรับ Pagination & Search)
  async findAll({
    page = 1,
    limit = 50,
    search = "",
    status,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {
      is_deleted: false,
    };

    if (search) {
      const searchTerms = search.trim().split(/\s+/);

      if (searchTerms.length > 1) {
        // กรณีค้นหาหลายคำ (เช่น ชื่อ นามสกุล)
        where.AND = searchTerms.map((term) => ({
          OR: [
            { firstname_th: { contains: term, mode: "insensitive" } },
            { lastname_th: { contains: term, mode: "insensitive" } },
            { firstname_en: { contains: term, mode: "insensitive" } },
            { lastname_en: { contains: term, mode: "insensitive" } },
            { nickname: { contains: term, mode: "insensitive" } },
            { username: { contains: term, mode: "insensitive" } },
            {
              position_ref: {
                name_th: { contains: term, mode: "insensitive" },
              },
            },
          ],
        }));
      } else {
        where.OR = [
          { username: { contains: search, mode: "insensitive" } },
          { firstname_th: { contains: search, mode: "insensitive" } },
          { lastname_th: { contains: search, mode: "insensitive" } },
          { firstname_en: { contains: search, mode: "insensitive" } },
          { lastname_en: { contains: search, mode: "insensitive" } },
          { nickname: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { employee_code: { contains: search, mode: "insensitive" } },
          {
            position_ref: {
              name_th: { contains: search, mode: "insensitive" },
            },
          },
        ];
      }
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      PrismaTimesheet.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created_at: "desc" },
        include: { role: true, position_ref: true, department: true },
      }),
      PrismaTimesheet.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * @description ดึงข้อมูลพนักงานทั้งหมดเพื่อนำไปทำรายงาน (Export)
   */
  async findAllForExport() {
    return await PrismaTimesheet.user.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: [{ department_id: "asc" }, { employee_code: "asc" }],
      include: {
        role: true,
        position_ref: true,
        department: true,
      },
    });
  },

  // ค้นหาด้วย admin_id
  async findByAdminId(adminId: number) {
    return await PrismaTimesheet.user.findUnique({
      where: { admin_id: Number(adminId) },
    });
  },

  // ค้นหาด้วยฟิลด์ Unique อื่นๆ (ใช้สำหรับตรวจสอบก่อนสร้างเพื่อป้องกัน P2002)
  async findByUniqueFields({
    username,
    employee_code,
  }: {
    username?: string;
    employee_code?: string;
  }) {
    if (!username && !employee_code) return null;

    return await PrismaTimesheet.user.findFirst({
      where: {
        OR: [
          username ? { username } : {},
          employee_code ? { employee_code } : {},
        ].filter((cond) => Object.keys(cond).length > 0) as any,
      },
      orderBy: { is_deleted: "asc" }, // เอาคนที่ไม่โดนลบขึ้นมาก่อน
    });
  },

  // ดึงข้อมูลผู้ใช้งานสำรองกรณีไม่มีรหัส (สุ่มรหัส)
  async getNextUnknownCode() {
    const lastUnknown = await PrismaTimesheet.user.findFirst({
      where: { employee_code: { startsWith: "JJ_UNKNOWN_CODE_" } },
      orderBy: { employee_code: "desc" },
    });

    if (!lastUnknown || !lastUnknown.employee_code)
      return "JJ_UNKNOWN_CODE_001";

    const lastNum = parseInt(
      lastUnknown.employee_code.replace("JJ_UNKNOWN_CODE_", ""),
    );
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    return `JJ_UNKNOWN_CODE_${String(nextNum).padStart(3, "0")}`;
  },

  async findConstants() {
    const roles = await PrismaTimesheet.role.findMany({
      where: { is_deleted: false, is_active: true },
    });
    return { roles };
  },

  // รีเซ็ตรหัสผ่านและส่งอีเมล (IPO Standard Random Password)
  async resetPassword(userId: number, updatedBy?: number) {
    // 1. ตรวจสอบผู้ใช้งาน
    const user = await PrismaTimesheet.user.findUnique({
      where: { id: userId, is_deleted: false },
    });

    if (!user) {
      throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
    }

    if (!user.email) {
      throw new Error(
        `ผู้ใช้งาน ${user.username} ไม่ได้ระบุอีเมล ไม่สามารถส่งรหัสผ่านได้`,
      );
    }

    // 2. สร้างรหัสผ่านแบบสุ่ม (ความยาว 10 ตัวอักษร ผสมตัวเล็ก ตัวใหญ่ ตัวเลข)
    const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // 3. Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. อัปเดตฐานข้อมูล
    await PrismaTimesheet.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
        updated_by: updatedBy,
      },
    });

    // 5. ส่งอีเมล
    try {
      const subject = "แจ้งการรีเซ็ตรหัสผ่าน - ระบบ SchoolBright Web Helper";
      const websiteLink = "https://sb-helper.schoolbright.co/";
      const logoUrl =
        "https://sb-helper.schoolbright.co/photo/schoolbright-logo-full-image.png";
      const html = `
        <div style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; width: 100%;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 48px 10px;">
            <tr>
              <td align="center">
                <!-- Logo -->
                <div style="margin-bottom: 32px;">
                  <img src="${logoUrl}" alt="SchoolBright Logo" style="height: 60px; width: auto; display: block;" />
                </div>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
                  <tr>
                    <td style="padding: 48px 40px;">
                      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">สวัสดีครับ/ค่ะ!</h1>
                      <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                        คุณได้รับอีเมลนี้เนื่องจากรหัสผ่านของคุณได้รับการรีเซ็ตเรียบร้อยแล้วโดยผู้ดูแลระบบ
                      </p>

                      <div style="background-color: #fef2f2; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #fee2e2;">
                        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em;">รหัสผ่านใหม่ของคุณคือ</p>
                        <div style="font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace; font-size: 32px; font-weight: 800; color: #ef4444; letter-spacing: 4px;">${newPassword}</div>
                      </div>

                      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${websiteLink}" style="display: inline-block; padding: 16px 40px; background-color: #111827; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; transition: all 0.2s ease;">เข้าสู่ระบบ</a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 32px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                        * เพื่อความปลอดภัยสูงสุด กรุณาเปลี่ยนรหัสผ่านนี้ทันทีที่หน้าเมนู <strong>"โปรไฟล์"</strong> หลังจากเข้าสู่ระบบครั้งแรก
                      </p>

                      <div style="height: 1px; background-color: #f3f4f6; margin-bottom: 32px;"></div>

                      <p style="margin: 0; font-size: 15px; color: #111827;">ด้วยความเคารพ,</p>
                      <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #F97316;">(c) ${new Date().getFullYear()} The Best SchoolBright Developer Team By Head of Technology Light</p>
                    </td>
                  </tr>
                </table>

                <!-- Bottom Subtext -->
                <div style="margin-top: 32px; text-align: center; max-width: 560px;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                    หากคุณมีข้อสงสัยประการใดเกี่ยวกับระบบ SchoolBright Web Helper <br/>
                    กรุณาติดต่อ IT Support ขององค์กรท่าน
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendMail(
        user.email,
        subject,
        `รหัสผ่านใหม่ของคุณคือ: ${newPassword}\nเข้าใช้งานได้ที่: ${websiteLink}`,
        html,
      );

      return {
        success: true,
        username: user.username,
        email: user.email,
      };
    } catch (emailError: any) {
      console.error("Email Reset Password Error:", emailError);
      throw new Error(
        `อัปเดตรหัสผ่านสำเร็จแต่ไม่สามารถส่งเมลถึง ${user.email} ได้: ${emailError.message}`,
      );
    }
  },

  // รีเซ็ตรหัสผ่านเป็นเบอร์โทรศัพท์ (Custom Request)
  async resetPasswordToPhone(userIds: number | number[], updatedBy?: number) {
    const idList = Array.isArray(userIds) ? userIds : [userIds];
    const results = [];

    const users = await PrismaTimesheet.user.findMany({
      where: { id: { in: idList.map((id) => Number(id)) }, is_deleted: false },
    });

    if (users.length === 0) {
      throw new Error("ไม่พบข้อมูลผู้ใช้งานที่ต้องการรีเซ็ต");
    }

    for (const user of users) {
      if (!user.phone) {
        continue; // Skip user with no phone, or handle as error for single request
      }

      const newPassword = user.phone;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await PrismaTimesheet.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updated_at: new Date(),
          updated_by: updatedBy,
        },
      });

      if (user.email) {
        try {
          const subject = "แจ้งรหัสผ่านบัญชีผู้ใช้งาน SchoolBright Web Helper";
          const websiteLink = "https://sb-helper.schoolbright.co/";
          const logoUrl =
            "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ";
          const html = `
            <div style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; width: 100%;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 48px 10px;">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="margin-bottom: 32px;">
                      <img src="${logoUrl}" alt="SchoolBright Logo" style="height: 60px; width: auto; display: block;" />
                    </div>

                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
                      <tr>
                        <td style="padding: 48px 40px;">
                          <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">สวัสดีครับ/ค่ะ!</h1>
                          <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                            เรียนคุณ <strong>${user.firstname_th}</strong>,<br/><br/>
                            บัญชีผู้ใช้งานของคุณถูกตั้งค่ารหัสผ่านเบื้องต้นเรียบร้อยแล้ว โดยใช้ข้อมูลจาก <strong>เบอร์โทรศัพท์</strong> ที่คุณใช้ลงทะเบียน
                          </p>

                          <div style="background-color: #fffaf5; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #ffedd5;">
                            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #c2410c; text-transform: uppercase;">รหัสผ่านของคุณคือ</p>
                            <div style="font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace; font-size: 32px; font-weight: 800; color: #ea580c; letter-spacing: 2px;">${newPassword}</div>
                          </div>

                          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                            <tr>
                              <td align="center">
                                <a href="${websiteLink}" style="display: inline-block; padding: 16px 40px; background-color: #111827; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">เข้าสู่ระบบ</a>
                              </td>
                            </tr>
                          </table>

                          <div style="height: 1px; background-color: #f3f4f6; margin-bottom: 32px;"></div>

                          <p style="margin: 0; font-size: 15px; color: #111827;">ด้วยความเคารพ,</p>
                          <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #F97316;">(c) ${new Date().getFullYear()} The Best SchoolBright Developer Team By Head of Technology Light</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer Help -->
                    <div style="margin-top: 32px; text-align: center; max-width: 560px;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                        หากท่านมีปัญหาในการคลิกปุ่ม "เข้าสู่ระบบ" สามารถคัดลอกและวางลิงก์ด้านล่างนี้ลงในเบราว์เซอร์ของท่าน: <br/>
                        <a href="${websiteLink}" style="color: #F97316;">${websiteLink}</a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          `;

          await sendMail(
            user.email,
            subject,
            `รหัสผ่านของคุณคือ: ${newPassword} (${websiteLink})`,
            html,
          );
        } catch (err) {
          console.error("Email send failed:", err);
        }
      }

      results.push({
        id: user.id,
        username: user.username,
        success: true,
      });
    }

    return {
      success: true,
      results,
    };
  },

  // ปรับปรุงตำแหน่งแบบกลุ่ม
  async bulkUpdatePosition(
    userIds: number[],
    positionId: number,
    adminId?: number,
  ) {
    return await PrismaTimesheet.user.updateMany({
      where: {
        id: { in: userIds.map((id) => Number(id)) },
        is_deleted: false,
      },
      data: {
        position_id: positionId,
        updated_at: new Date(),
        updated_by: adminId,
      },
    });
  },

  // ปรับปรุงแผนกแบบกลุ่ม
  async bulkUpdateDepartment(
    userIds: number[],
    departmentId: number,
    adminId?: number,
  ) {
    return await PrismaTimesheet.user.updateMany({
      where: {
        id: { in: userIds.map((id) => Number(id)) },
        is_deleted: false,
      },
      data: {
        department_id: departmentId,
        updated_at: new Date(),
        updated_by: adminId,
      },
    });
  },

  // ปรับปรุงสิทธิ์แบบกลุ่ม
  async bulkUpdateRole(userIds: number[], roleId: number, adminId?: number) {
    return await PrismaTimesheet.user.updateMany({
      where: {
        id: { in: userIds.map((id) => Number(id)) },
        is_deleted: false,
      },
      data: {
        role_id: roleId,
        updated_at: new Date(),
        updated_by: adminId,
      },
    });
  },

  // ปรับปรุงประเภทการจ้างงานแบบกลุ่ม
  async bulkUpdateEmploymentType(
    userIds: number[],
    employmentType: string,
    adminId?: number,
  ) {
    return await PrismaTimesheet.user.updateMany({
      where: {
        id: { in: userIds.map((id) => Number(id)) },
        is_deleted: false,
      },
      data: {
        employment_type: employmentType,
        updated_at: new Date(),
        updated_by: adminId,
      },
    });
  },

  // กู้คืนรหัสผ่านผ่านอีเมล (สำหรับหน้า Forgot Password)
  async forgotPasswordByEmail(email: string) {
    // 1. ตรวจสอบผู้ใช้งานจาก Email
    const user = await PrismaTimesheet.user.findFirst({
      where: { email: email, is_deleted: false },
    });

    if (!user) {
      throw new Error("ไม่พบข้อมูลผู้ใช้งานที่เชื่อมโยงกับอีเมลนี้");
    }

    if (!user.email) {
      throw new Error("ข้อมูลผู้ใช้งานนี้ไม่มีอีเมลผูกไว้ในระบบ");
    }

    // 2. สร้างรหัสผ่านแบบสุ่ม (ความยาว 10 ตัวอักษร ผสมตัวเล็ก ตัวใหญ่ ตัวเลข)
    const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // 3. Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. อัปเดตฐานข้อมูล
    await PrismaTimesheet.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    // 5. ส่งอีเมล
    try {
      const subject = "กู้คืนรหัสผ่าน - ระบบ SchoolBright Web Helper";
      const websiteLink = "https://sb-helper.schoolbright.co/";
      const logoUrl =
        "https://sb-helper.schoolbright.co/photo/schoolbright-logo-full-image.png";
      const html = `
        <div style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; width: 100%;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 48px 10px;">
            <tr>
              <td align="center">
                <!-- Simple Logo -->
                <div style="margin-bottom: 40px;">
                  <img src="${logoUrl}" alt="SchoolBright" style="height: 54px; width: auto; display: block;" />
                </div>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff;">
                  <tr>
                    <td>
                      <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.4px;">สวัสดีครับ/ค่ะ!</h1>
                      <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.7;">
                        คุณได้รับอีเมลนี้เนื่องจากเราได้รับคำร้องขอกู้คืนรหัสผ่านสำหรับบัญชีของคุณในระบบ SchoolBright Web Helper
                      </p>

                      <!-- Password Highlight -->
                      <div style="background-color: #fff7ed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #ffedd5;">
                        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #c2410c; text-transform: uppercase;">รหัสผ่านใหม่ของคุณคือ</p>
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 800; color: #ea580c; letter-spacing: 4px;">${newPassword}</div>
                      </div>

                      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${websiteLink}" style="display: inline-block; padding: 14px 32px; background-color: #2d3748; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 5px;">กู้คืนรหัสผ่าน</a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 24px; font-size: 15px; color: #374151; line-height: 1.7;">
                        หากคุณไม่ได้ส่งคำขอกู้คืนรหัสผ่าน คุณไม่จำเป็นต้องดำเนินการใดๆ
                      </p>

                      <p style="margin: 0; font-size: 15px; color: #111827;">ด้วยความเคารพ,</p>
                      <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #111827;">(c) ${new Date().getFullYear()} The Best SchoolBright Developer Team By Head of Technology Light</p>

                      <div style="height: 1px; background-color: #e5e7eb; margin: 40px 0 24px;"></div>

                      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                        หากท่านมีปัญหาในการคลิกปุ่ม "กู้คืนรหัสผ่าน" สามารถคัดลอกและวางลิงก์ด้านล่างนี้ลงในเบราว์เซอร์ของท่าน: <br/>
                        <a href="${websiteLink}" style="color: #4A5568;">${websiteLink}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendMail(
        user.email as string,
        subject,
        `รหัสผ่านใหม่ของคุณคือ: ${newPassword}\nโดยท่านสามารถล็อกอินได้ที่ลิงก์นี้ : ${websiteLink}`,
        html,
      );

      return { success: true, email: user.email };
    } catch (err: any) {
      console.error("[ForgotPassword] Mail send failed:", err);
      throw new Error("ระบบกู้คืนรหัสผ่านล้มเหลวขณะส่งอีเมล: " + err.message);
    }
  },

  // เปลี่ยนรหัสผ่านโดยตรวจสอบรหัสผ่านเดิม (Self Service)
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await PrismaTimesheet.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      throw new Error("INVALID_OLD_PASSWORD");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await PrismaTimesheet.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        failed_login_attempts: 0,
        updated_at: new Date(),
        updated_by: userId,
      },
    });
  },

  /**
   * สร้างรายงาน Excel พนักงานแบบ Enterprise
   * @description ใช้มาตรฐานการออกแบบระดับสูง (Branding Identity) เหมือนกับ Overtime Service
   */
  async generateExportExcel() {
    const users = await this.findAllForExport();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("พนักงานทั้งหมด");

    // --- Enterprise Setup ---
    worksheet.properties.defaultRowHeight = 32;
    const now = dayjs();
    const formattedDate = now.format("DD/MM/YYYY");
    const formattedTime = now.format("HH:mm");

    // --- ส่วนที่ 1: Header Branding (A1:B3) ---
    const headerCells = ["A1", "B1", "A2", "B2", "A3", "B3"];
    headerCells.forEach((ref) => {
      const cell = worksheet.getCell(ref);
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9D9D9" } },
        left: { style: "thin", color: { argb: "FFD9D9D9" } },
        bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        right: { style: "thin", color: { argb: "FFD9D9D9" } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    worksheet.getCell("A1").value = "ชื่อเอกสาร";
    worksheet.getCell("B1").value =
      "รายงานข้อมูลพนักงานบริษัท (Staff Inventory) - School Bright IPO Preparation";
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF7ED" },
    };

    worksheet.getCell("A2").value = "วันที่ออกรายงาน";
    worksheet.getCell("B2").value = `${formattedDate} เวลา ${formattedTime} น.`;
    worksheet.getCell("A3").value = "จำนวนพนักงานรวม";
    worksheet.getCell("B3").value = `${users.length} รายการ`;

    // ตกแต่ง Font ส่วนหัว
    ["A1", "A2", "A3"].forEach((ref) => {
      const cell = worksheet.getCell(ref);
      cell.font = {
        bold: true,
        name: "Google Sans",
        size: 14,
        color: { argb: "FF8C4D00" },
      };
    });

    ["B1", "B2", "B3"].forEach((ref) => {
      const cell = worksheet.getCell(ref);
      cell.font = {
        name: "Google Sans",
        size: 14,
        color: { argb: "FF434343" },
      };
    });
    worksheet.getCell("B1").font = {
      bold: true,
      name: "Google Sans",
      size: 15,
      color: { argb: "FFF37021" }, // SB Orange
    };

    // --- ส่วนที่ 2: โครงสร้างตาราง (Table Header) ---
    const tableHeaderRowIndex = 5;
    const headers = [
      "ลำดับ",
      "รหัสพนักงาน",
      "Admin ID",
      "Username",
      "ชื่อ (ไทย)",
      "นามสกุล (ไทย)",
      "ชื่อ (EN)",
      "นามสกุล (EN)",
      "ชื่อเล่น",
      "แผนก/ฝ่ายงาน",
      "ตำแหน่งงาน",
      "อีเมลติดต่อ",
      "เบอร์โทรศัพท์",
      "วันเกิด",
      "อายุ (ปี)",
      "ประเภทการจ้างงาน",
      "สิทธิ์การเข้าถึง",
      "วันที่เริ่มงาน",
      "วันที่ลาออก",
      "อายุงาน",
      "เข้าสู่ระบบล่าสุด",
      "วันที่สร้างข้อมูล",
      "สร้างโดย (Admin ID)",
      "วันที่แก้ไขล่าสุด",
      "แก้ไขโดย (Admin ID)",
      "ล็อกอินผิดพลาด (ครั้ง)",
      "สถานะการใช้งาน",
    ];

    worksheet.getRow(tableHeaderRowIndex).values = headers;
    worksheet.columns = [
      { key: "no", width: 8 },
      { key: "employee_code", width: 18 },
      { key: "admin_id", width: 12 },
      { key: "username", width: 18 },
      { key: "firstname_th", width: 22 },
      { key: "lastname_th", width: 22 },
      { key: "firstname_en", width: 22 },
      { key: "lastname_en", width: 22 },
      { key: "nickname", width: 14 },
      { key: "department", width: 25 },
      { key: "position", width: 28 },
      { key: "email", width: 30 },
      { key: "phone", width: 18 },
      { key: "birth_date", width: 16 },
      { key: "age", width: 10 },
      { key: "employment_type", width: 20 },
      { key: "role", width: 20 },
      { key: "joined_date", width: 16 },
      { key: "resigned_date", width: 16 },
      { key: "work_period", width: 20 },
      { key: "last_login", width: 20 },
      { key: "created_at", width: 20 },
      { key: "created_by", width: 15 },
      { key: "updated_at", width: 20 },
      { key: "updated_by", width: 15 },
      { key: "failed_attempts", width: 15 },
      { key: "status", width: 15 },
    ];

    const headerRow = worksheet.getRow(tableHeaderRowIndex);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Google Sans",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF37021" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE25E00" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "medium", color: { argb: "FFE25E00" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    });

    // --- ส่วนที่ 3: จัดการ Data Rows ---
    const getEmploymentLabel = (type?: string | null) => {
      const map: any = {
        FULL_TIME: "พนักงานประจำ",
        PART_TIME: "พาร์ทไทม์",
        CONTRACT: "สัญญาจ้าง",
        INTERN: "ฝึกงาน",
      };
      return map[type || ""] || "ไม่ระบุ";
    };

    const getStatusLabel = (status?: string | null) => {
      const map: any = {
        ACTIVE: "กำลังทำงาน",
        INACTIVE: "ลาออก/ปิดใช้งาน",
        SUSPENDED: "ระงับชั่วคราว",
      };
      return map[status || ""] || (status === "ACTIVE" ? "กำลังทำงาน" : status);
    };

    users.forEach((u, idx) => {
      const joined = u.joined_date ? dayjs(u.joined_date) : null;
      const resigned = u.resigned_date ? dayjs(u.resigned_date) : null;
      const birth = u.birth_date ? dayjs(u.birth_date) : null;
      const created = u.created_at ? dayjs(u.created_at) : null;
      const updated = u.updated_at ? dayjs(u.updated_at) : null;
      const lastLogin = u.last_login ? dayjs(u.last_login) : null;

      let durationStr = "-";
      if (joined) {
        const compareDate = resigned || now;
        const diffY = compareDate.diff(joined, "year");
        const diffM = compareDate.diff(joined.add(diffY, "year"), "month");
        durationStr = `${diffY} ปี ${diffM} เดือน`;
      }

      const row = worksheet.addRow({
        no: idx + 1,
        employee_code: u.employee_code || "-",
        admin_id: u.admin_id,
        username: u.username || "-",
        firstname_th: u.firstname_th || "-",
        lastname_th: u.lastname_th || "-",
        firstname_en: u.firstname_en || "-",
        lastname_en: u.lastname_en || "-",
        nickname: u.nickname || "-",
        department: u.department?.name_th || "-",
        position: u.position_ref?.name_th || "-",
        email: u.email || "-",
        phone: u.phone || "-",
        birth_date: birth ? birth.format("DD/MM/YYYY") : "-",
        age: birth ? now.diff(birth, "year") : "-",
        employment_type: getEmploymentLabel(u.employment_type),
        role: u.role?.role_name || u.role?.name || "-",
        joined_date: joined ? joined.format("DD/MM/YYYY") : "-",
        resigned_date: resigned ? resigned.format("DD/MM/YYYY") : "-",
        work_period: durationStr,
        last_login: lastLogin
          ? lastLogin.format("DD/MM/YYYY HH:mm")
          : "ยังไม่เคยเข้าใช้",
        created_at: created ? created.format("DD/MM/YYYY HH:mm") : "-",
        created_by: u.created_by || "-",
        updated_at: updated ? updated.format("DD/MM/YYYY HH:mm") : "-",
        updated_by: u.updated_by || "-",
        failed_attempts: u.failed_login_attempts ?? 0,
        status: getStatusLabel(u.status),
      });

      // Format Data Row
      row.height = 32;
      row.eachCell((cell) => {
        cell.font = {
          name: "Google Sans",
          size: 13,
          color: { argb: "FF434343" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFF9E7D8" } },
          left: { style: "thin", color: { argb: "FFF9E7D8" } },
          bottom: { style: "thin", color: { argb: "FFF9E7D8" } },
          right: { style: "thin", color: { argb: "FFF9E7D8" } },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Zebra effect
      if ((idx + 1) % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF7ED" },
          };
        });
      }

      // Status Coloring
      const statusCell = row.getCell("status");
      const statusVal = u.status;
      if (statusVal === "ACTIVE") {
        statusCell.font = {
          bold: true,
          color: { argb: "FF107C10" },
          name: "Google Sans",
          size: 13,
        };
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8F5E9" },
        };
      } else if (statusVal === "INACTIVE") {
        statusCell.font = {
          bold: true,
          color: { argb: "FFC62828" },
          name: "Google Sans",
          size: 13,
        };
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEBEE" },
        };
      }
    });

    // --- Final Step: Return Buffer ---
    return (await workbook.xlsx.writeBuffer()) as Buffer;
  },
};
