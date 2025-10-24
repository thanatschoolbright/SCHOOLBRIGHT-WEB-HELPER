import AuthLoader from "./auth-loader";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "เข้าสู่ระบบ",
    description: "เข้าสู่ระบบ SchoolBright Web Helper",
};

export default function AuthPage() {
  return <AuthLoader />;
}
