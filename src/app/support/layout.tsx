import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "ระบบสนับสนุน",
    description: "เครื่องมือและการสนับสนุนการใช้งานระบบ",
};

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}