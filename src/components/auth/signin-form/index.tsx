//** Functionality: Main sign in form component orchestrating step-based authentication
//** Note: Composes LogoHeader, EmailStepForm, PasswordStepForm for modular design

import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import {Card, Steps, theme} from "antd";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {toast} from "sonner";
import EmailStepForm from "../email-step-form";
import LogoHeader from "../logo-header";
import PasswordStepForm from "../password-step-form";
import {fetchUserRank} from "@/services/user-rank/user-rank.service";

const {useToken} = theme;

const steps = [
    {title: "Username"},
    {title: "รหัสผ่าน"},
];

const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    minWidth: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg,#ffecd2 0%,#fcb69f 100%)",
};

const wrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: 480,
};

const loadingBarContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    height: 4,
    width: "100%",
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 10,
};

export default function SignInForm() {
    const router = useRouter();
    const {token} = useToken();

    const [step, setStep] = useState(0);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const cardStyle: React.CSSProperties = {
        margin: "auto",
        maxWidth: 480,
        width: "100%",
        minHeight: 480,
        borderRadius: 24,
        padding: 48,
        textAlign: "center",
        background: token.colorBgContainer,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    };

    const loadingBarStyle: React.CSSProperties = {
        width: "30%",
        height: "100%",
        background: token.colorPrimary,
        animation: "loadingBar 1.2s linear infinite",
    };

    const handleLogin = async (password: string) => {
        setLoading(true);
        const tId = toast.loading("กำลังเข้าสู่ระบบ...");
        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);
            const response = await axios.post("/api/v2/authentication/sign-in", formData);
            
            if (response?.data?.token) {
                const userData = {
                    token: response.data.token,
                    user_data: response.data.user_data,
                };
                
                // บันทึก AUTH_USER ก่อน
                localStorage.setItem("AUTH_USER", JSON.stringify(userData));
                
                // 🏆 ดึงข้อมูล rank หลังจาก login สำเร็จ
                try {
                    toast.loading("กำลังโหลดข้อมูลอันดับ...", { id: tId });
                    const adminId = response.data.user_data.admin_id.toString();
                    console.log(`🔍 [Login] Fetching rank for admin_id: ${adminId}`);
                    console.log(`👤 [Login] User data:`, response.data.user_data);
                    
                    const rankData = await fetchUserRank(adminId);
                    if (rankData && rankData.rank) {
                        // เก็บข้อมูล rank ใน localStorage
                        localStorage.setItem("USER_RANK_DATA", JSON.stringify(rankData));
                        console.log("✅ Rank data loaded:", rankData);
                    } else {
                        console.warn("⚠️ No rank data returned from API");
                    }
                } catch (rankError) {
                    console.error("❌ Failed to load rank data:", rankError);
                    // ไม่ให้ rank error ขัดขวางการ login
                }
                
                toast.success("เข้าสู่ระบบสำเร็จ", {id: tId});
                setTimeout(() => {
                    router.replace("/main");
                }, 500);
                
            } else {
                toast.error("เข้าสู่ระบบล้มเหลว", {
                    description: "โปรดตรวจสอบรหัสผ่านอีกครั้ง",
                    id: tId,
                });
            }
        } catch (err: any) {
            toast.error("เข้าสู่ระบบล้มเหลว", {
                description: err?.response?.data?.message || "โปรดลองอีกครั้ง",
                id: tId,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={wrapperStyle}>
                {loading && (
                    <div style={loadingBarContainerStyle}>
                        <div style={loadingBarStyle}/>
                        <style>
                            {`
                              @keyframes loadingBar {
                                0% { transform: translateX(-100%); }
                                50% { transform: translateX(50%); }
                                100% { transform: translateX(200%); }
                              }
                            `}
                        </style>
                    </div>
                )}
                <Card style={cardStyle}>
                    <LogoHeader/>
                    <Steps current={step} items={steps} style={{marginBottom: 24}}/>
                    {step === 0 && <EmailStepForm onNext={(username) => {
                        setUsername(username);
                        setStep(1);
                    }}/>}
                    {step === 1 &&
                        <PasswordStepForm onBack={() => setStep(0)} onLogin={handleLogin} loading={loading}
                                          username={username}/>}
                </Card>
            </div>
        </div>
    );
}
