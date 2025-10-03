// ✅ 2. components/auth/auth-tabs.tsx
"use client";

interface Props {
  tab: "signup" | "signin";
  setTab: (tab: "signup" | "signin") => void;
}

export default function AuthTabs({ tab, setTab }: Props) {
  return (
    <div className="flex justify-between text-sm font-medium border-b border-gray-300 mb-6">
      {["signin"].map((item) => (
        <button
          key={item}
          className={`w-full text-center pb-2 transition-all duration-300 ${
            tab === item
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-400"
          }`}
          onClick={() => setTab(item as "signup" | "signin")}
        >
          {/* {item === "signup" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"} */}
          เข้าสู่ระบบ
        </button>
      ))}
    </div>
  );
}
