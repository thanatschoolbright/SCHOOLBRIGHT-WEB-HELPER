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
  payload?.data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;

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

  const prompt = `ช่วยสร้างคำอธิบาย timesheet แบบสั้น โดยดูจากตัวอย่างด้านล่าง แล้วสุ่มแนวทางให้คล้ายกับตัวอย่าง
ควรกล่าวถึงงานหรือฟีเจอร์ที่ทำอยู่ และไม่ต้องยาวเกินไป

ตัวอย่าง:
${JSON.stringify(historySample, null, 2)}

ให้ตอบเป็นข้อความสั้นบรรทัดเดียวเท่านั้น`;

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
