import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "จัดการผู้ใช้งาน",
    description: "จัดการข้อมูลผู้ใช้งานในระบบ SchoolBright",
};

export default function UserProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}