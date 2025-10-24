import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "ตรวจสอบสถานะระบบ",
    description: "ตรวจสอบสถานะและความพร้อมใช้งานของระบบต่างๆ",
};

export default function HealthCheckLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}