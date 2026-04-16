import { ObsService } from "@/services/backend/huawei/obs.service";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

const OBS_BUCKET = process.env.OBS_BUCKET_NAME || "";
const OBS_DOMAIN = process.env.OBS_DOMAIN || "";

// อัปโหลดลายเซ็นไปยัง OBS และบันทึก path ลงฐานข้อมูล
export async function uploadSignatureService(
  file: File,
  user_id: number,
  old_signature_path?: string,
): Promise<{ signature_url: string }> {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const key = `signatures/${user_id}/sig_${timestamp}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await ObsService.uploadFile(OBS_BUCKET, key, buffer, file.type);

  if (!result.success) {
    throw new Error("อัปโหลดไปยัง OBS ไม่สำเร็จ");
  }

  // ลบลายเซ็นเก่าออกจาก OBS ถ้ามี (soft cleanup ไม่ throw ถ้าล้มเหลว)
  if (old_signature_path && old_signature_path.includes(OBS_DOMAIN)) {
    try {
      const oldKey = old_signature_path.split(`${OBS_DOMAIN}/`)[1];
      if (oldKey) {
        await ObsService.deleteFile(OBS_BUCKET, oldKey);
      }
    } catch {
      // ไม่ block flow หลัก ถ้าลบไฟล์เก่าไม่ได้
    }
  }

  // บันทึก signature_url ลงในตาราง user
  await PrismaTimesheet.user.update({
    where: { id: user_id },
    data: { profile_image_path: undefined },  // ไม่แก้ profile
  });

  // ใช้ raw query เพื่อ update field signature_path ที่อาจยังไม่อยู่ใน schema
  await PrismaTimesheet.$executeRaw`
    UPDATE "user"
    SET signature_path = ${result.url}, updated_at = NOW()
    WHERE id = ${user_id}
  `;

  return { signature_url: result.url };
}

// ดึง URL ลายเซ็นของ user จากฐานข้อมูล
export async function readSignatureService(
  user_id: number,
): Promise<{ signature_url: string | null }> {
  const row = await PrismaTimesheet.$queryRaw<{ signature_path: string | null }[]>`
    SELECT signature_path FROM "user" WHERE id = ${user_id} AND is_deleted = false LIMIT 1
  `;

  const signature_url = row[0]?.signature_path ?? null;
  return { signature_url };
}

// ลบลายเซ็นออกจาก OBS และล้าง path ในฐานข้อมูล
export async function deleteSignatureService(
  user_id: number,
  signature_path: string,
): Promise<void> {
  if (signature_path.includes(OBS_DOMAIN)) {
    const key = signature_path.split(`${OBS_DOMAIN}/`)[1];
    if (key) {
      await ObsService.deleteFile(OBS_BUCKET, key);
    }
  }

  await PrismaTimesheet.$executeRaw`
    UPDATE "user"
    SET signature_path = NULL, updated_at = NOW()
    WHERE id = ${user_id}
  `;
}
