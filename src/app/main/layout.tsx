import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "หน้าหลัก",
    description: "หน้าหลักของระบบ SchoolBright Web Helper",
};

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}