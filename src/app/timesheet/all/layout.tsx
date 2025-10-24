import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "รายงานเวลาทำงาน",
    description: "ดูรายงานและสรุปข้อมูลเวลาทำงานทั้งหมด",
};

export default function TimesheetAllLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}