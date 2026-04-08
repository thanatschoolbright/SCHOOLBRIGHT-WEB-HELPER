"use client";

import { forgotPasswordAction } from "@/actions/auth";
import { type Variants, AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useForgotPasswordStore } from "../_state/forgot-password-store";

// Variants
const formVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// SVG Icons
function IconMail() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22c55e"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// State สำเร็จ
function SuccessView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center text-center gap-6"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fieldVariants}>
        <IconCheckCircle />
      </motion.div>

      <motion.div variants={fieldVariants} className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold text-slate-900 m-0" style={{ letterSpacing: "-0.02em" }}>
          ส่งอีเมลเรียบร้อยแล้ว
        </h2>
        <p className="text-[14px] text-slate-400 m-0 max-w-[320px] leading-relaxed">
          ระบบส่งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว
          กรุณาตรวจสอบ Inbox หรือ Junk Mail
        </p>
      </motion.div>

      <motion.div variants={fieldVariants} className="flex flex-col gap-3 w-full">
        <motion.button
          type="button"
          onClick={onBack}
          className="w-full h-[52px] rounded-xl text-[14px] font-semibold text-white flex items-center justify-center cursor-pointer border-none"
          style={{ background: "#0c0f14" }}
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.15 }}
        >
          กลับไปยังหน้าเข้าสู่ระบบ
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { loading, isSuccess, error, setLoading, setIsSuccess, setError } =
    useForgotPasswordStore();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Validate email
  const validate = () => {
    if (!email.trim()) {
      setEmailError("กรุณาระบุอีเมล");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await forgotPasswordAction(email.trim());
      if (result.success) {
        setIsSuccess(true);
        toast.success("ส่งรหัสผ่านใหม่ไปที่อีเมลเรียบร้อยแล้ว");
      } else {
        setError(result.error ?? "เกิดข้อผิดพลาด");
        toast.error(result.error);
      }
    } catch {
      const msg = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-white px-8 sm:px-16 py-14 min-h-screen md:min-h-0">
      <div className="w-full max-w-[420px]">
        {/* โลโก้ + ปุ่มกลับ */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "#f97316" }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>
            </div>
            <span className="font-bold text-[15px] text-slate-800 tracking-tight">
              SchoolBright
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/auth/v2/signin")}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
          >
            <IconArrowLeft />
            กลับหน้าเข้าสู่ระบบ
          </button>
        </div>

        {/* สลับระหว่าง Form / Success */}
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <SuccessView onBack={() => router.push("/auth/v2/signin")} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -12 }}
            >
              {/* Heading */}
              <motion.div variants={fieldVariants} className="mb-10">
                <h1
                  className="text-[28px] font-bold text-slate-900 tracking-tight m-0 mb-2"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  ลืมรหัสผ่าน?
                </h1>
                <p className="text-[14px] text-slate-400 m-0 font-normal">
                  ระบุอีเมลที่ลงทะเบียนไว้เพื่อรับรหัสผ่านใหม่
                </p>
              </motion.div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="flex items-start gap-3 p-4 rounded-xl mb-6"
                    style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-[13px] text-red-600 m-0 leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ฟอร์ม */}
              <form onSubmit={handleSubmit} noValidate>
                <motion.div variants={fieldVariants} className="flex flex-col gap-1.5 mb-8">
                  <label className="text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-400">
                    อีเมลที่ลงทะเบียน
                  </label>
                  <div
                    className={`group flex items-center gap-3 py-3 border-b transition-all duration-200
                      ${emailError
                        ? "border-red-400"
                        : "border-slate-200 focus-within:border-slate-900"
                      }`}
                  >
                    <span
                      className={`flex-shrink-0 transition-colors duration-200 ${
                        emailError
                          ? "text-red-400"
                          : "text-slate-300 group-focus-within:text-slate-600"
                      }`}
                    >
                      <IconMail />
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@schoolbright.co"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      className="flex-1 bg-transparent outline-none text-[15px] text-slate-800 placeholder-slate-300 font-medium"
                      autoComplete="email"
                    />
                  </div>
                  <AnimatePresence>
                    {emailError && (
                      <motion.p
                        className="text-[11px] text-red-500 m-0"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit */}
                <motion.div variants={fieldVariants}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[52px] rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2.5 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#0c0f14" }}
                    whileHover={{ opacity: loading ? 0.5 : 0.88 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.15 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        <span>กำลังส่ง...</span>
                      </>
                    ) : (
                      "ส่งรหัสผ่านไปที่อีเมล"
                    )}
                  </motion.button>
                </motion.div>
              </form>

              {/* Footer link */}
              <motion.p
                variants={fieldVariants}
                className="text-center text-[12px] text-slate-300 mt-10 m-0"
              >
                ต้องการความช่วยเหลือเพิ่มเติม?{" "}
                <button
                  type="button"
                  className="text-slate-500 font-semibold hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer text-[12px] p-0"
                >
                  ติดต่อผู้ดูแลระบบ
                </button>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
