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
  projectName,
  featureName,
}: {
  history: HistoryEntry[];
  fallback?: string | null;
  projectName?: string;
  featureName?: string;
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

  let prompt = `Role: คุณคือ AI Assistant ที่ช่วยเขียน Timesheet สำหรับบริษัท Software ด้านการศึกษา (EdTech) ที่พัฒนาจัดการโรงเรียนครบวงจร

Context:
- งานต้องเกี่ยวข้องกับระบบการศึกษา เช่น: **ระบบวิชาการ, ระบบเกรด/วัดผล, ระบบพฤติกรรม, ระบบตารางสอน, ระบบห้องเรียน, ระบบการเงินโรงเรียน, ระบบรับสมัครนักเรียน** เป็นต้น
- ต้องเขียนให้คลอบคลุมเนื้องานที่ทำจริง โดยอ้างอิงจาก Feature และ Project

Guidelines:
1. **เริ่มประโยคด้วยกริยาการกระทำทันที** เช่น "ดำเนินการ...", "มุ่งเน้นการสร้าง...", "วิจัยและออกแบบ...", "พัฒนาส่วนขยาย..."
2. **ห้าม** พูดซ้ำว่า "พัฒนาฟีเจอร์ X ในโปรเจกต์ Y" หรือ "สำหรับฟีเจอร์..." เพราะเป็นข้อมูลที่ซ้ำซ้อน
3. **ตัดส่วนเกริ่นนำทิ้งทั้งหมด** ให้เข้าเรื่องเนื้องานที่ทำในฟีเจอร์นั้นๆ ทันที
4. **ห้าม** สร้างรหัส Ticket MOCK UP (เช่น DEV-123)
5. ถ้าจะใส่รหัสงาน ต้องใช้ Prefix: "SB-", "SBAPP-", "ACA-", "SH-", "ACC-"
6. ภาษาที่ใช้: ทางการแต่ทันสมัย (Semi-formal)
7. **ความยาวต้องเกิน 100 ตัวอักษร** โดยให้อธิบายถึงรายละเอียดเนื้องานและผลลัพธ์ที่ได้จากการทำฟีเจอร์นั้นๆ อย่างสังเขปแต่ได้ใจความ

โจทย์ปัจจุบัน:
Project: ${projectName}
Feature: ${featureName}

คำสั่งพิเศษ:
- เขียนรายละเอียดงานที่ทำจริงสำหรับ "${featureName}" ของโปรเจกต์ "${projectName}"
- อธิบายขั้นตอนหรือเป้าหมายที่พนักงานทำ เช่น การออกแบบระบบ, การจัดการข้อมูล, หรือการปรับปรุงประสิทธิภาพ
- ห้ามมีคำเกริ่นนำประเภท "พัฒนาฟีเจอร์..." หรือ "ในโปรเจกต์..." ให้เริ่มที่กริยาอาการที่ทำเลย`;

  prompt += `

Input History (ประวัติงานที่ผ่านมาเพื่อดูสไตล์):
${JSON.stringify(historySample, null, 2)}

Output: ขอข้อความบรรยายงาน 1 รายการตามโจทย์ที่ได้รับ (ส่งคืนเฉพาะข้อความบรรยายเท่านั้น)`;

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
        },
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
