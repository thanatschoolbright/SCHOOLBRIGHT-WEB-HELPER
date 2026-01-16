import axios from "axios";

type HistoryEntry = {
  description?: string | null;
  project?: { name?: string | null };
  feature?: { name?: string | null };
};

const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

const MODEL_FALLBACKS: string[] = [
  process.env.GOOGLE_GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
].filter(Boolean) as string[];

const extractText = (payload: any) =>
  payload?.data?.candidates?.[0]?.content?.parts?.[0]?.text as
    | string
    | undefined;

export async function generateDescriptionWithGemini({
  history,
  fallback,
}: {
  history: HistoryEntry[];
  fallback?: string | null;
}) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || !history.length) {
    return fallback ?? "Auto fill timesheet";
  }

  const historySample = history.slice(0, 5).map((item) => ({
    description: item.description,
    project: item.project?.name,
    feature: item.feature?.name,
  }));

  const prompt = `Role: คุณคือ AI Assistant ที่ช่วยเขียน Timesheet สำหรับบริษัท Software ด้านการศึกษา (EdTech) ที่พัฒนาจัดการโรงเรียนครบวงจร

Context:
- งานต้องเกี่ยวข้องกับระบบการศึกษา เช่น: **ระบบวิชาการ, ระบบเกรด/วัดผล, ระบบพฤติกรรม, ระบบตารางสอน, ระบบห้องเรียน, ระบบการเงินโรงเรียน, ระบบรับสมัครนักเรียน** เป็นต้น
- ต้องเขียนให้สอดคล้องกับ "Project" และ "Feature" ที่ระบุใน Input เสมอ

Guidelines:
1. เขียนบรรยายงานสั้นๆ (One-liner) กระชับ เป็นธรรมชาติ
2. **ห้าม** สร้างรหัส Ticket MOCK UP (เช่น DEV-123) เด็ดขาด
3. ถ้าจะใส่รหัสงาน ต้องใช้ Prefix ที่ถูกต้องเท่านั้น: "SB-", "SBAPP-", "ACA-", "SH-", "ACC-"
4. ถ้าไม่มีรหัสในประวัติ ให้เน้นชื่อ Feature หรือ Module เป็นหลัก
5. ภาษาที่ใช้: ทางการแต่ทันสมัย (Semi-formal) เหมาะกับคนทำงาน Tech ในสายการศึกษา

Input History (ประวัติงานที่ผ่านมา):
${JSON.stringify(historySample, null, 2)}

Output: ขอข้อความสั้นๆ 1 บรรทัด สำหรับรายการล่าสุด`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];

  for (const model of MODEL_FALLBACKS) {
    try {
      const url = `${buildGeminiUrl(model)}?key=${apiKey}`;
      const response = await axios.post(
        url,
        { contents },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 8000,
          validateStatus: () => true,
        }
      );
      if (response.status >= 200 && response.status < 300) {
        const text = extractText(response);
        if (text) return text.trim();
      }
    } catch (err) {
      // silently continue to next model
    }
  }

  return fallback ?? "Auto fill timesheet";
}
