import type {Metadata} from "next";

export const metadata: Metadata = {
    title: {
        default: "ระบบบันทึกเวลา",
        template: "%s | ระบบบันทึกเวลา",
    },
    description: "ระบบบันทึกเวลาทำงานและโครงการต่างๆ",
};

export default function TimesheetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}