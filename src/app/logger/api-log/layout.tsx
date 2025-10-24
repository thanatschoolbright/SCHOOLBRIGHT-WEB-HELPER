import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "API Log",
    description: "ติดตามและจัดการ Log การเรียกใช้ API ของระบบ",
};

export default function ApiLogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}