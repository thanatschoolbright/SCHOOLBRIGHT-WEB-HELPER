"use client";

import { loginAction } from "@/actions/auth";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { type Variants, AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignInStore } from "../_state/signin-store";
import SignInProcessingModal from "./signin-processing-modal";

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

// ข้อมูล error ตาม code
function getErrorContent(errorCode: string | null) {
  switch (errorCode) {
    case "MAX_ATTEMPTS_EXCEEDED":
      return { title: "บัญชีถูกล็อกชั่วคราว" };
    case "ACCOUNT_LOCKED_OR_INACTIVE":
      return { title: "บัญชีไม่สามารถใช้งานได้" };
    case "INVALID_CREDENTIALS":
      return { title: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" };
    default:
      return { title: "การยืนยันตัวตนล้มเหลว" };
  }
}

// SVG icons ที่ไม่ต้องพึ่ง Ant Design
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// Input Field แบบ minimal — ไม่มีเส้นข้าง มีแค่ border-bottom
interface InputFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  isPassword?: boolean;
}

function InputField({ label, name, placeholder, icon, value, onChange, error, isPassword }: InputFieldProps) {
  const [showPw, setShowPw] = useState(false);
  const inputType = isPassword ? (showPw ? "text" : "password") : "text";

  return (
    <motion.div variants={fieldVariants} className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-400">
        {label}
      </label>
      <div
        className={`group flex items-center gap-3 px-0 py-3 border-b transition-all duration-200
          ${error
            ? "border-red-400"
            : "border-slate-200 focus-within:border-slate-900"
          }`}
      >
        <span className={`flex-shrink-0 transition-colors duration-200 ${error ? "text-red-400" : "text-slate-300 group-focus-within:text-slate-600"}`}>
          {icon}
        </span>
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          className="flex-1 bg-transparent outline-none text-[15px] text-slate-800 placeholder-slate-300 font-medium"
          autoComplete={isPassword ? "current-password" : "username"}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
          >
            <IconEye open={showPw} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-[11px] text-red-500 m-0"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SignInForm() {
  const router = useRouter();

  const {
    loading,
    isModalVisible,
    currentStep,
    loginStatus,
    errorMessage,
    errorCode,
    debugData,
    setLoading,
    setIsModalVisible,
    setCurrentStep,
    setLoginStatus,
    setErrorMessage,
    setErrorCode,
    setDebugData,
  } = useSignInStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const errorContent = getErrorContent(errorCode);

  const validate = () => {
    let valid = true;
    if (!username.trim()) {
      setUsernameError("กรุณาระบุอีเมล หรือ รหัสพนักงาน");
      valid = false;
    } else {
      setUsernameError("");
    }
    if (!password) {
      setPasswordError("กรุณาระบุรหัสผ่าน");
      valid = false;
    } else {
      setPasswordError("");
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setIsModalVisible(true);
    setCurrentStep(0);
    setLoginStatus("process");
    setErrorMessage(null);
    setErrorCode(null);
    setDebugData(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep(1);

      const result = await loginAction({ username, password });

      if (result?.error) {
        setLoginStatus("error");
        setErrorMessage(result.error);
        setErrorCode(result?.code || "AUTH_FAILED");
        setDebugData({
          timestamp: new Date().toISOString(),
          username,
          errorCode: result?.code || "AUTH_FAILED",
          serverMessage: result.error,
        });
      } else {
        setCurrentStep(2);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setCurrentStep(3);
        setLoginStatus("finish");
        setTimeout(() => { window.location.href = "/main"; }, 1000);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; digest?: string; stack?: string };
      const isActionError =
        err.message?.includes("Server Action") ||
        err.message?.includes("not found") ||
        err.digest?.includes("ACTION_NOT_FOUND");

      if (isActionError) {
        setLoginStatus("error");
        setErrorMessage("ตรวจพบการอัปเดตระบบ กำลังรีเฟรชหน้าจออัตโนมัติ...");
        setTimeout(() => { window.location.reload(); }, 2500);
      } else {
        setLoginStatus("error");
        setErrorMessage(
          err.message?.includes("fetch") || err.message?.includes("network")
            ? "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ โปรดตรวจสอบการเชื่อมต่อ"
            : "เกิดข้อผิดพลาดที่ไม่คาดคิดในการเข้าสู่ระบบ",
        );
      }
      setDebugData({
        timestamp: new Date().toISOString(),
        error: err.message,
        digest: err.digest,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-white px-8 sm:px-16 py-14 min-h-screen md:min-h-0">
      <motion.div
        className="w-full max-w-[420px]"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        {/* โลโก้ */}
        <motion.div variants={fieldVariants} className="mb-12">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "#f97316" }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="font-bold text-[15px] text-slate-800 tracking-tight">SchoolBright</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fieldVariants} className="mb-10">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight m-0 mb-2" style={{ letterSpacing: "-0.02em" }}>
            ลงชื่อเข้าใช้งาน
          </h1>
          <p className="text-[14px] text-slate-400 m-0 font-normal">
            ยินดีต้อนรับกลับสู่ SchoolBright Portal
          </p>
        </motion.div>

        {/* ฟอร์ม */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-7">
            <InputField
              label="อีเมล หรือ รหัสพนักงาน"
              name="username"
              placeholder="you@schoolbright.co"
              icon={<IconUser />}
              value={username}
              onChange={setUsername}
              error={usernameError}
            />

            <InputField
              label="รหัสผ่าน"
              name="password"
              placeholder="••••••••"
              icon={<IconLock />}
              value={password}
              onChange={setPassword}
              error={passwordError}
              isPassword
            />
          </div>

          {/* ลืมรหัสผ่าน */}
          <motion.div variants={fieldVariants} className="flex justify-end mt-4 mb-8">
            <button
              type="button"
              onClick={() => router.push("/auth/v2/forgot-password")}
              className="text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors tracking-wide"
            >
              ลืมรหัสผ่าน?
            </button>
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
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fieldVariants} className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-300 font-medium tracking-wide uppercase">หรือ</span>
            <div className="flex-1 h-px bg-slate-100" />
          </motion.div>

          {/* Google SSO */}
          <motion.div variants={fieldVariants} className="relative">
            <button
              type="button"
              disabled
              className="w-full h-[52px] rounded-xl text-[13px] font-medium text-slate-400 bg-white border border-slate-150 flex items-center justify-center gap-3 cursor-not-allowed"
              style={{ borderColor: "#f1f5f9" }}
            >
              <IconGoogle />
              Continue with Google Workspace
              <span className="ml-auto text-[10px] font-semibold text-orange-400 bg-orange-50 rounded-md px-1.5 py-0.5 tracking-wide">
                เร็วๆนี้
              </span>
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.p
          variants={fieldVariants}
          className="text-center text-[12px] text-slate-300 mt-10 m-0"
        >
          ยังไม่มีบัญชี?{" "}
          <button
            type="button"
            className="text-slate-500 font-semibold hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer text-[12px] p-0"
          >
            ติดต่อผู้ดูแลระบบ
          </button>
        </motion.p>
      </motion.div>

      {/* Modals */}
      <SignInProcessingModal
        open={isModalVisible && loginStatus === "process"}
        currentStep={currentStep}
      />
      <StatusModalComponent
        open={isModalVisible && loginStatus === "finish"}
        type="success"
        title="ยินดีต้อนรับ"
        message="บัญชีของคุณได้รับการยืนยันเรียบร้อยแล้ว"
        onClose={() => setIsModalVisible(false)}
      />
      <StatusModalComponent
        open={isModalVisible && loginStatus === "error"}
        type="error"
        title={errorContent.title}
        message={errorMessage ?? "เข้าสู่ระบบไม่สำเร็จ"}
        errorDetails={debugData}
        confirmLabel="ลองใหม่อีกครั้ง"
        onClose={() => setIsModalVisible(false)}
      />
    </div>
  );
}
