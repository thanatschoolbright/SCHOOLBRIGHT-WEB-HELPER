import type {Metadata} from "next";

export const metadata: Metadata = {
    title: {
        default: "จัดการฮาร์ดแวร์",
        template: "%s | จัดการฮาร์ดแวร์",
    },
    description: "ระบบจัดการฮาร์ดแวร์และอุปกรณ์ต่างๆ ของโรงเรียน",
};

export default function HardwareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}