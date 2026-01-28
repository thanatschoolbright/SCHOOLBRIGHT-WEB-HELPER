import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import bcrypt from "bcryptjs";
import { sendMail } from "@/server/mailer";

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
  role_id?: number | null;
  position_id?: number | null;
  profile_image?: string | null;
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
  role_id?: number | null;
  position_id?: number | null;
  profile_image?: string | null;
  updated_by?: number | null;
  joined_date?: string | Date | null;
  resigned_date?: string | Date | null;
  employment_type?: string | null;
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
        status: "ACTIVE",
        role_id: data.role_id ?? undefined,
        position_id: data.position_id ?? undefined,
        profile_image_path: data.profile_image,
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
      status: data.status,
      role_id: data.role_id ?? undefined,
      position_id: data.position_id ?? undefined,
      profile_image_path: data.profile_image,
      joined_date: data.joined_date ? new Date(data.joined_date) : undefined,
      resigned_date: data.resigned_date
        ? new Date(data.resigned_date)
        : undefined,
      employment_type: data.employment_type,
      updated_at: new Date(),
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return await PrismaTimesheet.user.update({
      where: { id },
      data: updateData,
    });
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
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { firstname_th: { contains: search, mode: "insensitive" } },
        { lastname_th: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employee_code: { contains: search, mode: "insensitive" } },
      ];
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
      const subject = "⚠️ แจ้งการรีเซ็ตรหัสผ่าน - ระบบ SchoolBright Web Helper";
      const html = `
        <div style="font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #1890ff;">แจ้งข้อมูลรหัสผ่านใหม่</h2>
          <p>เรียน คุณ <strong>${user.firstname_th} ${user.lastname_th}</strong>,</p>
          <p>รหัสผ่านสำหรับเข้าใช้งานระบบของคุณได้รับการรีเซ็ตเรียบร้อยแล้วตามคำร้องขอจากผู้ดูแลระบบ</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d9d9d9;">
            <p style="margin: 0; font-size: 14px; color: #666;">รหัสผ่านใหม่ของคุณคือ:</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #f5222d;">${newPassword}</p>
          </div>

          <p style="color: #faad14;">* หมายเหตุ: กรุณาเปลี่ยนรหัสผ่านทันทีหลังจากการเข้าใช้งานครั้งแรกเพื่อความปลอดภัยสูงสุดตามมาตรฐาน IPO Monitoring</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">
            ข้อความนี้เป็นระบบตอบรับอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้<br/>
            © ${new Date().getFullYear()} SchoolBright Portfolio Team. All rights reserved.
          </p>
        </div>
      `;

      await sendMail(
        user.email,
        subject,
        `รหัสผ่านใหม่ของคุณคือ: ${newPassword}`,
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
          const subject =
            "🔐 แจ้งรหัสผ่านบัญชีผู้ใช้งาน SchoolBright Web Helper";
          const websiteLink = "https://sb-helper.schoolbright.co/";
          const html = `
            <div style="font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; line-height: 1.6;">
              <h2 style="color: #1890ff;">แจ้งข้อมูลรหัสผ่านตามเบอร์โทรศัพท์</h2>
              <p>เรียน คุณ <strong>${user.firstname_th} ${user.lastname_th}</strong>,</p>
              <p>ผู้ดูแลระบบได้ทำการตั้งค่ารหัสผ่านเบื้องต้นให้กับบัญชีของคุณให้เท่ากับ <strong>เบอร์โทรศัพท์</strong> ที่ลงทะเบียนไว้ในระบบเรียบร้อยแล้ว</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d9d9d9;">
                <p style="margin: 0; font-size: 14px; color: #666;">รหัสผ่านของคุณคือ:</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1890ff;">${newPassword}</p>
              </div>

              <p>คุณสามารถเข้าใช้งานระบบได้ที่:</p>
              <p><a href="${websiteLink}" style="color: #1890ff; font-weight: bold; text-decoration: none;">${websiteLink}</a></p>

              <p style="color: #faad14;">* หมายเหตุ: กรุณาเปลี่ยนรหัสผ่านทันทีเพื่อความปลอดภัย</p>
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} SchoolBright Portfolio Team.
              </p>
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
};
