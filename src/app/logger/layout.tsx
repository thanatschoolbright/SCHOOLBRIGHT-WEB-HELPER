import type {Metadata} from "next";

export const metadata: Metadata = {
    title: {
        default: "ระบบ Log",
        template: "%s | ระบบ Log",
    },
    description: "ระบบติดตามและจัดการ Log ต่างๆ ของระบบ",
};

export default function LoggerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}