"use client"; //  <-- สำคัญมาก! ทำให้ไฟล์นี้เป็น Client Component

import dynamic from "next/dynamic";

// ย้ายโค้ด dynamic import มาไว้ในไฟล์นี้
const AuthForm = dynamic(() => import("./auth-form"), {
  ssr: false,
  // เพิ่ม Loading UI เพื่อประสบการณ์ใช้งานที่ดีขึ้น (แนะนำ)
  loading: () => <p>Loading form...</p>,
});

export default function AuthLoader() {
  return <AuthForm />;
}
