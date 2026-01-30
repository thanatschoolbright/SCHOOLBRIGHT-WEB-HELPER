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
                      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">Hello!</h1>
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

                      <p style="margin: 0; font-size: 15px; color: #111827;">Regards,</p>
                      <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #F97316;">© ${new Date().getFullYear()} The Best SchoolBright Developer Team By Head of Technology Light</p>
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
          const subject =
            "🔐 แจ้งรหัสผ่านบัญชีผู้ใช้งาน SchoolBright Web Helper";
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
                          <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">Hello!</h1>
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
                                <a href="${websiteLink}" style="display: inline-block; padding: 16px 40px; background-color: #111827; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">Sign in to account</a>
                              </td>
                            </tr>
                          </table>

                          <div style="height: 1px; background-color: #f3f4f6; margin-bottom: 32px;"></div>

                          <p style="margin: 0; font-size: 15px; color: #111827;">Regards,</p>
                          <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #F97316;">© ${new Date().getFullYear()} The Best SchoolBright Developer Team By Head of Technology Light</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer Help -->
                    <div style="margin-top: 32px; text-align: center; max-width: 560px;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                        If you're having trouble clicking the "Sign in to account" button, copy and paste the URL below into your web browser: <br/>
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
      const subject = "🔑 กู้คืนรหัสผ่าน - ระบบ SchoolBright Web Helper";
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
                      <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.4px;">Hello!</h1>
                      <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.7;">
                        You are receiving this email because we received a password reset request for your account on SchoolBright Web Helper.
                      </p>

                      <!-- Password Highlight -->
                      <div style="background-color: #fff7ed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #ffedd5;">
                        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #c2410c; text-transform: uppercase;">รหัสผ่านใหม่ของคุณคือ</p>
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 800; color: #ea580c; letter-spacing: 4px;">${newPassword}</div>
                      </div>

                      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${websiteLink}" style="display: inline-block; padding: 14px 32px; background-color: #2d3748; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 24px; font-size: 15px; color: #374151; line-height: 1.7;">
                        If you did not request a password reset, no further action is required.
                      </p>

                      <p style="margin: 0; font-size: 15px; color: #111827;">Regards,</p>
                      <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #111827;">© ${new Date().getFullYear()} The Best SchoolBright Developer Team By Head of Technology Light</p>

                      <div style="height: 1px; background-color: #e5e7eb; margin: 40px 0 24px;"></div>
                      
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                        If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser: <br/>
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
      console.error("❌ [ForgotPassword] Mail send failed:", err);
      throw new Error("ระบบกู้คืนรหัสผ่านล้มเหลวขณะส่งอีเมล: " + err.message);
    }
  },
};
