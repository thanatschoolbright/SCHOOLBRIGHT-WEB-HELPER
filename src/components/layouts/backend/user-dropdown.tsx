"use client";

/**
 * 👤 UserDropdown: Dropdown เมนูผู้ใช้
 * ใช้ Ant Design สำหรับ UI minimal, รองรับ Dark Mode
 */

import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Divider,
  Popover,
  Segmented,
  Spin,
  theme,
  Typography,
  Badge,
  Progress,
  Space,
  Card,
  Tag,
} from "antd";
import {
  DownOutlined,
  LogoutOutlined,
  TranslationOutlined,
  TrophyOutlined,
  StarOutlined,
  FireOutlined,
} from "@ant-design/icons";
import i18n from "@/i18n";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import {
  getUserRankFromStorage,
  getDisciplineLevel,
} from "@/helpers/user-rank.helper";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";

/**
 * 📦 UserDropdown: Component Dropdown สำหรับเมนูผู้ใช้
 * - แสดงชื่อและรูปโปรไฟล์
 * - เมนูเปลี่ยนภาษาและออกจากระบบ
 * - ใช้ Toast สำหรับสถานะ logout
 */
export default function UserDropdown(): JSX.Element {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const { token } = theme.useToken();
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);
  const [isChangingLanguage, setIsChangingLanguage] = useState<boolean>(false);
  const [userRank, setUserRank] = useState<any>(null);

  const userData = AUTHENTICATION?.response?.data?.user_data || {};

  // โหลด/รีเฟรช rank ทุกครั้งที่มี user_id
  useEffect(() => {
    const loadRank = async () => {
      const userId = userData?.admin_id;
      if (!userId) return;
      try {
        const latest = await fetchUserRank(String(userId));
        if (latest) {
          const mapped = {
            rank: latest.rank,
            rankLetter: latest.rankLetter,
            rankDescription: latest.rankDescription,
            admin_id: latest.admin_id,
            fullName: latest.fullName,
            completion_rate: latest.completion_rate,
            total_hours: latest.total_hours,
            expected_hours: latest.expected_hours,
            month: latest.month,
            year: latest.year,
            updated_at: new Date().toISOString(),
            discipline_score: latest.rawData,
          };
          setUserRank(mapped);
          // เก็บ cache ไว้เพื่อลด latency รอบถัดไป
          try {
            const existingAuth = JSON.parse(
              localStorage.getItem("AUTH_USER") || "{}"
            );
            localStorage.setItem(
              "AUTH_USER",
              JSON.stringify({
                ...existingAuth,
                user_rank: mapped,
              })
            );
            localStorage.setItem("USER_RANK_DATA", JSON.stringify(mapped));
          } catch {
            // ignore storage errors
          }
        } else {
          // fallback จาก storage หาก API ไม่มีข้อมูล
          const stored = getUserRankFromStorage();
          if (stored) setUserRank(stored);
        }
      } catch (err) {
        console.error("[UserDropdown] fetchUserRank failed", err);
        const stored = getUserRankFromStorage();
        if (stored) setUserRank(stored);
      }
    };
    loadRank();
  }, [userData?.admin_id]);

  /**
   * 🏆 แปลง rank letter เป็น display info
   */
  const getRankGrade = (
    rankLetter: string
  ): {
    grade: string;
    color: string;
    bgColor: string;
    description: string;
  } => {
    switch (rankLetter?.toUpperCase()) {
      case "S":
        return {
          grade: "S",
          color: "#FFD700",
          bgColor: "linear-gradient(135deg, #FFD700, #FFA500)",
          description: "ระดับเทพ",
        };
      case "A":
        return {
          grade: "A",
          color: "#52C41A",
          bgColor: "linear-gradient(135deg, #52C41A, #389E0D)",
          description: "ระดับเยี่ยม",
        };
      case "B":
        return {
          grade: "B",
          color: "#1890FF",
          bgColor: "linear-gradient(135deg, #1890FF, #096DD9)",
          description: "ระดับดี",
        };
      case "C":
        return {
          grade: "C",
          color: "#FAAD14",
          bgColor: "linear-gradient(135deg, #FAAD14, #D48806)",
          description: "ระดับปานกลาง",
        };
      case "D":
        return {
          grade: "D",
          color: "#FA8C16",
          bgColor: "linear-gradient(135deg, #FA8C16, #D46B08)",
          description: "ระดับพอใช้",
        };
      case "E":
        return {
          grade: "E",
          color: "#FF7875",
          bgColor: "linear-gradient(135deg, #FF7875, #F5222D)",
          description: "ต้องปรับปรุง",
        };
      default: // 'F' or anything else
        return {
          grade: "F",
          color: "#CF1322",
          bgColor: "linear-gradient(135deg, #CF1322, #A8071A)",
          description: "ต้องเร่งด่วน",
        };
    }
  };

  /**
   * 🌐 เปลี่ยนภาษา
   */
  const changeLanguage = async (lng: string): Promise<void> => {
    if (lng === currentLanguage) return; // ไม่เปลี่ยนถ้าเป็นภาษาเดียวกัน
    setIsChangingLanguage(true);
    const toastId = toast.loading(
      `กำลังเปลี่ยนภาษาเป็น ${lng === "th" ? "ไทย" : "English"}...`
    );
    try {
      await i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
      toast.success(
        `เปลี่ยนภาษาเป็น ${lng === "th" ? "ไทย" : "English"} สำเร็จ`,
        { id: toastId }
      );
    } catch (error) {
      toast.error("เปลี่ยนภาษาไม่สำเร็จ", { id: toastId });
    } finally {
      setIsChangingLanguage(false);
    }
  };

  /**
   * ⏳ Sleep function สำหรับ delay
   */
  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * 🗑️ ลบข้อมูลใน Storage
   */
  const clearStorage = (): void => {
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
  };

  /**
   * 🚪 จัดการการออกจากระบบ
   */
  const handleLogout = async (): Promise<void> => {
    const toastId = toast.loading("1/2 กำลังโหลด...", { duration: Infinity });
    try {
      await sleep(400);
      toast.loading("2/2 กำลังลบข้อมูล...", {
        id: toastId,
        duration: Infinity,
      });
      clearStorage();
      await sleep(300);
      toast.success("ออกจากระบบสำเร็จ", { id: toastId, duration: 2000 });
      setTimeout(() => {
        window.location.href = "/";
      }, 400);
    } catch {
      toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", {
        id: toastId,
        duration: 4000,
      });
    }
  };

  /**
   * 📋 Overlay สำหรับ Dropdown Menu (ใช้ Ant Design + Tailwind)
   */
  const dropdownOverlay = (
    <Card className="min-w-[280px] p-3 shadow-sm">
      <Space direction="vertical" size="middle" className="w-full">
        {userRank &&
          (() => {
            const rankInfo = getRankGrade(userRank.rankLetter || "F");
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            const isHighRank = ["S", "A"].includes(rankInfo.grade);
            return (
              <Card
                size="small"
                className="w-full border border-slate-200/60 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${rankInfo.color}15, ${rankInfo.color}05)`,
                }}
              >
                <Space align="start" className="w-full" size="middle">
                  <Tag
                    className={`text-white text-lg font-bold px-3 py-2 rounded-md ${
                      isHighRank ? "animate-pulse" : ""
                    }`}
                    style={{
                      background: rankInfo.bgColor,
                      boxShadow: isHighRank
                        ? `0 4px 16px ${rankInfo.color}60, inset 0 1px 0 rgba(255,255,255,0.3)`
                        : `0 2px 8px ${rankInfo.color}40`,
                    }}
                  >
                    {rankInfo.grade}
                  </Tag>
                  <Space direction="vertical" size={4} className="flex-1">
                    <Typography.Text
                      strong
                      className="text-[13px] flex items-center gap-2"
                    >
                      {rankInfo.description}
                      {isHighRank && (
                        <Tag
                          color="gold"
                          className="text-[11px] font-bold rounded"
                        >
                          {rankInfo.grade === "S" ? "LEGEND" : "ELITE"}
                        </Tag>
                      )}
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      className="text-xs flex items-center gap-2"
                    >
                      <span>อันดับ {userRank.rank}</span>
                      <span className="text-gray-400">•</span>
                      <span>
                        {currentMonth}/{currentYear}
                      </span>
                      {isHighRank && (
                        <FireOutlined style={{ color: rankInfo.color }} />
                      )}
                    </Typography.Text>
                  </Space>
                </Space>
              </Card>
            );
          })()}

        <Space direction="vertical" size={4} className="w-full">
          <Typography.Text
            strong
            className="text-xs text-gray-500 flex items-center gap-2"
          >
            เปลี่ยนภาษา {isChangingLanguage && <Spin size="small" />}
          </Typography.Text>
          <Segmented
            options={[
              { label: "ไทย", value: "th", icon: <TranslationOutlined /> },
              { label: "English", value: "en", icon: <TranslationOutlined /> },
            ]}
            value={currentLanguage}
            onChange={(value) => changeLanguage(value as string)}
            disabled={isChangingLanguage}
            className="w-full"
          />
        </Space>

        <Divider className="my-1" />

        <Button
          type="text"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          className="w-full"
        >
          ออกจากระบบ
        </Button>
      </Space>
    </Card>
  );

  useEffect(() => {
    console.log("AUTHENTICATION", AUTHENTICATION);
  }, [AUTHENTICATION]);

  //** 🔄 Listen สำหรับการเปลี่ยนภาษา
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  return (
    <>
      <Popover content={dropdownOverlay} trigger={["click"]}>
        <Space
          align="center"
          className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200"
          size="small"
        >
          <Space align="center" size={6}>
            <span>
              สวัสดีคุณ{" "}
              {`${userData.firstname ?? "Name"} ${userData.lastname ?? ""}`}
            </span>
            {userRank &&
              (() => {
                const rankInfo = getRankGrade(userRank.rankLetter || "F");
                const isHighRank = ["S", "A"].includes(rankInfo.grade);
                return (
                  <Tag
                    className={`px-2 py-1 rounded-full text-white text-xs font-bold ${
                      isHighRank ? "animate-pulse" : ""
                    }`}
                    style={{
                      background: rankInfo.bgColor,
                      boxShadow: `0 2px 8px ${rankInfo.color}40`,
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {rankInfo.grade}
                  </Tag>
                );
              })()}
          </Space>

          <Badge dot>
            {(() => {
              const rankInfo = userRank
                ? getRankGrade(userRank.rankLetter || "F")
                : null;
              const isHighRank =
                rankInfo && ["S", "A"].includes(rankInfo.grade);
              const getAvatarUrl = () => {
                const adminId = userData.admin_id || 1;
                const avatarSeed = `${userData.firstname}_${userData.lastname}_${adminId}`;
                return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  avatarSeed
                )}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
              };
              return (
                <Avatar
                  src={getAvatarUrl()}
                  alt={`${userData.firstname} ${userData.lastname}`}
                  size={36}
                  className={`border ${
                    isHighRank ? "border-white shadow-lg" : "border-gray-200"
                  }`}
                />
              );
            })()}
          </Badge>
          <DownOutlined className="text-gray-400" />
        </Space>
      </Popover>
    </>
  );
}
