// components/AuthLayout.tsx
export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-white">
            <div className="relative z-10 w-full max-w-md">{children}</div>
        </div>
    );
}
