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

  const prompt = `ช่วยสร้างคำอธิบาย Timesheet สำหรับการบันทึกงาน โดยวิเคราะห์จากประวัติงานย้อนหลัง (History) ด้านล่างนี้:

Guidelines:
1. เขียนบรรยายงานที่ทำสั้นๆ กระชับ และดูเป็นธรรมชาติ (Human-like) เข้าใจง่าย
2. **สำคัญมาก**: ห้ามสร้างรหัส Ticket มั่วๆ (เช่น DEV-123, TASK-001) โดยเด็ดขาด
3. หากจะระบุรหัสงาน (Task ID) ต้องขึ้นต้นด้วย Prefix เหล่านี้เท่านั้น: "SB-", "SBAPP-", "ACA-", "SH-", "ACC-" ตามด้วยตัวเลข
4. หากไม่มีข้อมูลเลขงานที่ชัดเจน ให้เขียนบรรยายเนื้องานหรือฟีเจอร์แทน

ประวัติงานย้อนหลัง (History):
${JSON.stringify(historySample, null, 2)}

Output: ขอข้อความสั้นๆ บรรทัดเดียว`;

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
