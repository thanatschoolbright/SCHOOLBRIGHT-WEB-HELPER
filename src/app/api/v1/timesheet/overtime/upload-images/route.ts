import { NextRequest, NextResponse } from "next/server";
import { ObsService } from "@/services/backend/huawei/obs.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

/**
 * API สำหรับจัดการรูปภาพหลักฐาน (Proof of Work) ใน Overtime Description
 * รองรับการ อัปโหลด (รวมแก้ไข) และ ลบ
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get("action") as string; // 'upload' หรือ 'delete'
    const descriptionIdStr = formData.get("description_id") as string;
    const imageKey = formData.get("image_key") as string; // เช่น 'image_1', 'image_2'

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!descriptionIdStr || !imageKey) {
      return NextResponse.json(
        errorResponse({
          message_th: "ข้อมูลไม่ครบถ้วน (ต้องการ description_id และ image_key)",
          message_en: "Missing description_id or image_key",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const descriptionId = parseInt(descriptionIdStr);
    if (isNaN(descriptionId)) {
      return NextResponse.json(
        errorResponse({
          message_th: "id รายการไม่ถูกต้อง",
          message_en: "Invalid description_id",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // ดึงข้อมูลเดิมจาก Database
    const descModel = (PrismaTimesheet as any).overtimeDescription;
    if (!descModel) {
      throw new Error("Prisma model 'overtimeDescription' not found.");
    }

    const description = await descModel.findUnique({
      where: { id: descriptionId },
    });

    if (!description) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบข้อมูลรายการ OT ที่ต้องการจัดการรูปภาพ",
          message_en: "Overtime description not found",
          status: 404,
        }),
        { status: 404 },
      );
    }

    // จัดการ Object Proof (JSON)
    let proof = (description.proof as Record<string, string>) || {};

    const bucket = process.env.OBS_BUCKET_NAME || "";
    const domain =
      process.env.OBS_DOMAIN || "obs.ap-southeast-2.myhuaweicloud.com";

    // ---------------------------------------------------------
    // CASE: DELETE IMAGE
    // ---------------------------------------------------------
    if (action === "delete") {
      const oldUrl = proof[imageKey];

      if (oldUrl) {
        // ลบไฟล์จาก OBS จริงๆ
        if (oldUrl.includes(domain)) {
          const keyInObs = oldUrl.split(`${domain}/`)[1];
          if (keyInObs) {
            await ObsService.deleteFile(bucket, keyInObs);
          }
        }

        // ลบ key ออกจาก JSON object
        delete proof[imageKey];

        // อัปเดต DB
        await (PrismaTimesheet as any).overtimeDescription.update({
          where: { id: descriptionId },
          data: { proof },
        });
      }

      return NextResponse.json(
        successResponse({
          message_th: `ลบรูปภาพ ${imageKey} สำเร็จ`,
          message_en: `Image ${imageKey} deleted successfully`,
          data: { proof },
        }),
      );
    }

    // ---------------------------------------------------------
    // CASE: UPLOAD / UPDATE IMAGE
    // ---------------------------------------------------------
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        errorResponse({
          message_th: "กรุณาแนบไฟล์รูปภาพ",
          message_en: "File is required for upload action",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // จำกัดขนาดไฟล์ 2MB
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 2MB)",
          message_en: "File size too large (limit 2MB)",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // Cleanup รูปเก่าถ้ามี (กรณี Update)
    const oldUrl = proof[imageKey];
    if (oldUrl && oldUrl.includes(domain)) {
      const oldKeyInObs = oldUrl.split(`${domain}/`)[1];
      if (oldKeyInObs) {
        try {
          await ObsService.deleteFile(bucket, oldKeyInObs);
        } catch (e) {
          console.warn("Cleanup old file failed:", e);
        }
      }
    }

    // เตรียมไฟล์สำหรับ Upload
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "png";
    const newObsKey = `overtime/proof/${descriptionId}/${imageKey}_${timestamp}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload ไปยัง OBS
    const uploadResult = await ObsService.uploadFile(
      bucket,
      newObsKey,
      buffer,
      file.type,
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.url); // ใน logic ObsService.ts url อาจเก็บ error message ถ้า success false
    }

    // อัปเดต JSON proof (รักษา image ตัวอื่นๆ ไว้)
    proof[imageKey] = uploadResult.url;

    // บันทึกลง Database
    await (PrismaTimesheet as any).overtimeDescription.update({
      where: { id: descriptionId },
      data: { proof },
    });

    return NextResponse.json(
      successResponse({
        message_th: `อัปโหลดรูปภาพ ${imageKey} สำเร็จ`,
        message_en: `Image ${imageKey} uploaded successfully`,
        data: {
          url: uploadResult.url,
          proof: proof,
        },
      }),
    );
  } catch (error: any) {
    console.error("OT Proof Management Error:", error);
    return NextResponse.json(
      errorResponse({
        message_th:
          "เกิดข้อผิดพลาดของระบบในการจัดการรูปภาพ: " +
          (error.message || "Unknown Error"),
        message_en: error.message || "Internal Server Error",
        error: error.stack,
      }),
      { status: 500 },
    );
  }
}
