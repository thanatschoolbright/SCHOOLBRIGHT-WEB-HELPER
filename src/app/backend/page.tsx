"use client";
import React from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation("mock");

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1  gap-6 mt-6 w-full">
        <ContentCard title="Release Note" fullWidth className=" w-full">
          <div className="p-4">
            <div className="space-y-6">
              {releaseNotes
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((group, groupIdx) => (
                  <ContentCard
                    key={group.date}
                    title={group.date}
                    className="w-full"
                    fullWidth={false}
                  >
                    <ul className="space-y-3">
                      {group.release_note
                        .sort((a, b) => {
                          const order = { add: 0, update: 1, remove: 2 };
                          return (
                            order[a.type as keyof typeof order] -
                            order[b.type as keyof typeof order]
                          );
                        })
                        .map((note, idx) => (
                          <li
                            key={idx}
                            className={`flex items-start gap-2 rounded px-3 py-2 border border-gray-200 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:-translate-y-1 ${
                              note.type === "add"
                                ? "bg-green-50"
                                : note.type === "remove"
                                ? "bg-red-50"
                                : "bg-yellow-50"
                            }`}
                          >
                            <span className="text-xl" aria-label={note.type}>
                              {note.emoji}
                            </span>
                            <span
                              className={`font-medium ${
                                note.type === "add"
                                  ? "text-green-700"
                                  : note.type === "remove"
                                  ? "text-red-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {note.message}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </ContentCard>
                ))}
            </div>
          </div>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}

// Release notes grouped by date
const releaseNotes = [
  {
    date: "2024-08-29",
    release_note: [
      {
        type: "add",
        emoji: "🔘",
        message:
          "เพิ่ม Toggle Switch component สำหรับการตั้งค่า เช่น 'เป็นเวอร์ชันล่าสุด' และ 'Force Update'",
      },
      {
        type: "update",
        emoji: "🎨",
        message:
          "ปรับ InputComponent เป็น Floating Label แบบ Google Material Design พร้อมสถานะ Disabled สีเทา",
      },
      {
        type: "update",
        emoji: "⬇️",
        message:
          "ปรับ SearchableSelectComponent ให้ใช้งานง่ายขึ้น พร้อม animation และ label หายเมื่อเลือกแล้ว",
      },
      {
        type: "update",
        emoji: "📂",
        message:
          "อัปเดต UploadComponent ให้เป็นปุ่ม Upload พร้อม animation hover",
      },
      {
        type: "update",
        emoji: "📌",
        message:
          "DropdownButtonComponent ปรับดีไซน์ใหม่ เพิ่มความเด่นและ animation slide",
      },
      {
        type: "update",
        emoji: "🖼️",
        message: "ModalComponent รองรับ onCancel และปรับ animation overlay",
      },
      {
        type: "update",
        emoji: "⚙️",
        message:
          "ปรับหน้า Hardware Canteen Page: Modal Add/Edit Version ให้แยก Section, validation แบบ semantic version, toggle switch",
      },
      {
        type: "add",
        emoji: "📄",
        message: "เพิ่มหน้า Release Note สำหรับติดตามประวัติการอัปเดต",
      },
      {
        type: "update",
        emoji: "🌐",
        message: "แก้ไขข้อความในเมนู (eng/thai menu.json)",
      },
    ],
  },
  {
    date: "2024-06-03",
    release_note: [
      {
        type: "add",
        emoji: "🔺",
        message:
          "เพิ่มหน้า Release Note สำหรับติดตามความเปลี่ยนแปลงล่าสุดในระบบ",
      },
      {
        type: "update",
        emoji: "⚡️",
        message: "ปรับปรุงความเร็วในการโหลดข้อมูลหน้า Dashboard",
      },
      {
        type: "remove",
        emoji: "🔻",
        message: "ลดปุ่มที่ไม่จำเป็นออกจากเมนูด้านข้าง",
      },
      {
        type: "add",
        emoji: "🎨",
        message: "เพิ่มแอนิเมชันปุ่ม hover/scale และปุ่ม login สีเขียว",
      },
      {
        type: "add",
        emoji: "✨",
        message: "เปลี่ยนมาใช้ Toast จาก Sonner แทน SweetAlert2",
      },
      {
        type: "update",
        emoji: "⏳",
        message: "ปรับปรุง Loading Component ให้แสดง spinner มาตรฐาน",
      },
      {
        type: "update",
        emoji: "📌",
        message:
          "ปรับปรุง Sidebar ให้สามารถย่อ/ขยายได้, ติดขอบหน้าจอ และเพิ่มแอนิเมชัน",
      },
      {
        type: "update",
        emoji: "🔝",
        message: "ปรับปรุง Topbar พร้อมแอนิเมชันการเลื่อน",
      },
      {
        type: "update",
        emoji: "⬇️",
        message: "ปรับปรุงเมนู Dropdown ด้วยแอนิเมชันเลื่อนและเส้นขอบ",
      },
      {
        type: "add",
        emoji: "📄",
        message: "เพิ่มหน้า Release Note สำหรับแสดงประวัติการอัพเดทระบบ",
      },
    ],
  },
  {
    date: "2024-06-02",
    release_note: [
      {
        type: "update",
        emoji: "🛠️",
        message: "แก้ไขบัคในการโหลดข้อมูลผู้ใช้งานที่ทำให้บางครั้งแสดงผลล่าช้า",
      },
    ],
  },
];
