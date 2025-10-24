import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "จัดการโครงการ",
    description: "จัดการและติดตามโครงการต่างๆ ในระบบ",
};

export default function TimesheetProjectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}