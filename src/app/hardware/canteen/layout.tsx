import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "ระบบโรงอาหาร",
    description: "จัดการฮาร์ดแวร์และแอปพลิเคชันระบบโรงอาหาร",
};

export default function HardwareCanteenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}