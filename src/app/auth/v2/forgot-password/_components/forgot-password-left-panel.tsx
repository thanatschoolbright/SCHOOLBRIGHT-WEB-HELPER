"use client";

import { type Variants, motion } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// เส้น Grid พื้นหลัง (เหมือน signin)
function GridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    />
  );
}

// ขั้นตอนการกู้คืนรหัสผ่าน
const STEPS = [
  { step: "01", label: "ระบุอีเมล", desc: "กรอกอีเมลที่ลงทะเบียนกับระบบ" },
  { step: "02", label: "ตรวจสอบ Inbox", desc: "รหัสผ่านใหม่จะถูกส่งไปทางอีเมล" },
  { step: "03", label: "เข้าสู่ระบบ", desc: "ใช้รหัสผ่านใหม่เพื่อเข้าใช้งาน" },
];

export default function ForgotPasswordLeftPanel() {
  return (
    <div
      className="hidden md:flex md:w-[46%] lg:w-[48%] flex-col justify-between px-14 py-14 relative overflow-hidden"
      style={{ background: "#0c0f14" }}
    >
      <GridBackground />

      {/* เส้น subtle ขวา */}
      <div
        className="absolute right-0 top-0 bottom-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)",
        }}
      />

      {/* Glow บนขวา */}
      <div
        className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col h-full justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* โลโก้ */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#f97316" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-wide">
            SchoolBright
          </span>
        </motion.div>

        {/* Main content */}
        <motion.div variants={itemVariants} className="flex flex-col gap-10">
          <div>
            <p
              className="text-[13px] font-medium tracking-[0.12em] uppercase mb-5"
              style={{ color: "#f97316" }}
            >
              Account Recovery
            </p>
            <h1
              className="text-white font-bold leading-tight m-0"
              style={{
                fontSize: "clamp(28px, 2.8vw, 44px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              กู้คืนบัญชี<br />
              <span style={{ color: "rgba(255,255,255,0.45)" }}>อย่างปลอดภัย</span>
            </h1>
          </div>

          {/* ขั้นตอน */}
          <div className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                variants={itemVariants}
                custom={i}
                className="flex items-start gap-4"
              >
                <span
                  className="text-[11px] font-bold tracking-widest flex-shrink-0 mt-0.5"
                  style={{ color: "rgba(249,115,22,0.6)" }}
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white/80 m-0 leading-snug">
                    {s.label}
                  </p>
                  <p className="text-xs text-white/35 m-0 mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-5 text-[12px]"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <span>© {new Date().getFullYear()} SchoolBright</span>
          <span className="w-px h-3 bg-white/15" />
          <span>Security Policy</span>
          <span className="w-px h-3 bg-white/15" />
          <span>v2.0.0</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
