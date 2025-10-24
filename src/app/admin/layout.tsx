import type {Metadata} from "next";

export const metadata: Metadata = {
    title: {
        default: "จัดการระบบ",
        template: "%s | จัดการระบบ",
    },
    description: "ระบบจัดการผู้ใช้งานและการตั้งค่าต่างๆ",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}