import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "บันทึกเวลาทำงาน",
    description: "บันทึกและจัดการข้อมูลเวลาทำงานรายวัน",
};

export default function TimesheetEntryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}