import type {Metadata} from "next";

export const metadata: Metadata = {
    title: {
        default: "ระบบมือถือ",
        template: "%s | ระบบมือถือ",
    },
    description: "ระบบจัดการข้อมูลและเครื่องมือสำหรับอุปกรณ์มือถือ",
};

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}