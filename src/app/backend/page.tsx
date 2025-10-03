"use client";
//** หน้า Dashboard (Release Notes) โทน Minimal ใช้ Ant Design ทั้งหมด และโครงสร้างโค้ดที่อ่านง่าย
import React from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { Card, Space, Typography } from "antd";
import ReleaseNoteGroupCard from "@components/release-note/release-note-group-card";
import type { ReleaseNoteGroup } from "@components/release-note/types";

//** คอมโพเนนต์หลักของหน้า: แสดงหัวเรื่อง + กลุ่มการ์ด Release Notes
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 16 }}>
        {/* 1) หัวเรื่องหน้า */}
        <Card size="small">
          <Space direction="vertical" size={4}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Release Notes
            </Typography.Title>
            <Typography.Text type="secondary">
              บันทึกความเปลี่ยนแปลงล่าสุดของระบบ (Minimal • Ant Design)
            </Typography.Text>
          </Space>
        </Card>

        {/* 2) กลุ่มการ์ด Release Notes */}
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {releaseNotes.map((group) => (
            <ReleaseNoteGroupCard key={group.date} group={group} />
          ))}
        </Space>
      </Space>
    </DashboardLayout>
  );
}

// Release notes grouped by date
//** ข้อมูล Release Notes (ตัวอย่าง) — จัดกลุ่มตามวันที่
const releaseNotes: ReleaseNoteGroup[] = [
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
