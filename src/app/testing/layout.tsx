import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "ทดสอบระบบ",
    description: "เครื่องมือทดสอบและตรวจสอบการทำงานของระบบ",
};

export default function TestingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}