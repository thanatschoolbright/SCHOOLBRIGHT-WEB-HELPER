// ไม่ต้องใช้ "use client" หรือ dynamic import ที่นี่แล้ว
import AuthLoader from "./auth-loader";

// ไฟล์นี้จะกลับมาเป็น Server Component ที่สะอาด
export default function AuthPage() {
  return <AuthLoader />;
}
