//** Run Command : npx tsx prisma/timesheet/seed.ts */
import { PrismaClient } from "../../generated/prisma-timesheet";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding...");

  // 1. Clean up existing data (Optional - ระวังถ้าใช้บน Production)
  // await prisma.projectStatus.deleteMany();

  // 2. Seed Project Status (ตามหลัก SDLC)
  const statuses = [
    {
      priority: 1,
      nameTh: "รวบรวมความต้องการ",
      nameEn: "Requirement & Analysis",
    },
    { priority: 2, nameTh: "ออกแบบระบบ", nameEn: "System Design" },
    { priority: 3, nameTh: "กำลังพัฒนา", nameEn: "Development" },
    { priority: 4, nameTh: "กำลังทดสอบ", nameEn: "QA & Testing" },
    {
      priority: 5,
      nameTh: "ตรวจรับงานโดยผู้ใช้",
      nameEn: "User Acceptance Test (UAT)",
    },
    { priority: 6, nameTh: "เสร็จสิ้น/ส่งมอบ", nameEn: "Deployment & Done" },
    { priority: 99, nameTh: "ระงับชั่วคราว", nameEn: "On Hold" },
  ];

  console.log("Creating Project Statuses...");
  for (const status of statuses) {
    await prisma.projectStatus.upsert({
      where: { id: statuses.indexOf(status) + 1 }, // ใช้ ID คงที่เพื่อง่ายต่อการอ้างอิง
      update: {},
      create: {
        priority: status.priority,
        nameTh: status.nameTh,
        nameEn: status.nameEn,
      },
    });
  }

  // 3. Seed ตัวอย่าง Group
  const group = await prisma.group.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name_th: "ทีมพัฒนาซอฟต์แวร์",
      name_en: "Software Development Team",
    },
  });

  // 4. Seed ตัวอย่าง Project & Features
  const project = await prisma.project.create({
    data: {
      name: "Timesheet Application v2",
      description: "ระบบลงเวลาทำงานพนักงานรุ่นใหม่",
      status: "open",
      group_id: group.id,
      features: {
        create: [
          {
            name: "Authentication Module",
            name_en: "Login/Register System",
            status: "Development", // ผูกตาม SDLC
          },
          {
            name: "Dashboard Report",
            name_en: "Management Dashboard",
            status: "Requirement Analysis",
          },
        ],
      },
    },
  });

  console.log({ project });
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
