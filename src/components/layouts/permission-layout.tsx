import { useAppSelector } from "@stores/store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  role: string[];
  children: React.ReactNode;
}

export default function PermissionLayout({ role, children }: Props) {
  const router = useRouter();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const AUTH_USER = AUTHENTICATION?.response?.data?.user_data;

  useEffect(() => {
    // ✅ เช็คว่าโหลดเสร็จแล้วเท่านั้น
    if (AUTHENTICATION?.loading) return;

    // ✅ ถ้าไม่มี user เลย (ยังไม่ได้ login) → redirect
    if (!AUTH_USER) {
      return router.replace("/login");
    }

    // ✅ เช็ค role
    if (!role.includes(AUTH_USER?.position)) {
      toast.error(
        `คุณมีสิทธิ์ไม่ถึงที่กำหนด คุณต้องเป็น ${role.join(", ")} เท่านั้น`,
        { duration: 3000 }
      );
      router.replace("/backend");
    }
  }, [AUTHENTICATION?.loading, AUTH_USER, role, router]);

  // ⏳ ยังโหลดอยู่ แสดง placeholder กันกระพริบ/redirect ตอน refresh
  if (AUTHENTICATION?.loading || !AUTH_USER) {
    return <div>กำลังตรวจสอบสิทธิ์...</div>;
  }

  return <>{children}</>;
}
