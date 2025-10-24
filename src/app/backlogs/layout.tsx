import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "รายการงานค้าง",
    description: "จัดการและติดตามงานค้างที่ต้องดำเนินการ",
};

export default function BacklogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}