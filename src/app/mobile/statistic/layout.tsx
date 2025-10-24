import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "สถิติการใช้งาน",
    description: "ดูสถิติและข้อมูลการใช้งานระบบต่างๆ",
};

export default function StatisticLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}