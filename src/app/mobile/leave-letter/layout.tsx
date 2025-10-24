import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "จดหมายลาหยุด",
    description: "จัดการและตรวจสอบจดหมายลาหยุดของนักเรียนและบุคลากร",
};

export default function LeaveLetterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}