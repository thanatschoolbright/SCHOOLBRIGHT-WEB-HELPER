import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "ทดสอบ QR Code",
    description: "ทดสอบและตรวจสอบการทำงานของระบบ QR Code",
};

export default function QRCodeHealthCheckLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}