import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "จัดการระบบ Backend",
    description: "เครื่องมือจัดการระบบและการตั้งค่า Backend",
};

export default function BackendLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}