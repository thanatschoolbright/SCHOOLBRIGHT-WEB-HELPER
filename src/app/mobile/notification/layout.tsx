import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "การแจ้งเตือน",
    description: "จัดการระบบการแจ้งเตือนและข้อความต่างๆ",
};

export default function NotificationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}