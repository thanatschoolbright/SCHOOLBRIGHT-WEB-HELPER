import axios from "axios";

type HistoryEntry = {
  description?: string | null;
  project?: { name?: string | null };
  feature?: { name?: string | null };
};

export async function generateDescriptionWithChatGPT({
  history,
  fallback,
}: {
  history: HistoryEntry[];
  fallback?: string | null;
}) {
  const apiKey = process.env.CHATGPT_API_KEY;
  if (!apiKey || !history.length) {
    return fallback ?? "Auto fill timesheet";
  }

  const historySample = history.slice(0, 5).map((item) => ({
    description: item.description,
    project: item.project?.name,
    feature: item.feature?.name,
  }));

  const systemPrompt = `Role: คุณคือ AI Assistant ที่ช่วยเขียน Timesheet สำหรับบริษัท Software ด้านการศึกษา (EdTech) ที่พัฒนาจัดการโรงเรียนครบวงจร

Context:
- งานต้องเกี่ยวข้องกับระบบการศึกษา เช่น: **ระบบวิชาการ, ระบบเกรด/วัดผล, ระบบพฤติกรรม, ระบบตารางสอน, ระบบห้องเรียน, ระบบการเงินโรงเรียน, ระบบรับสมัครนักเรียน** เป็นต้น
- ต้องเขียนให้สอดคล้องกับ "Project" และ "Feature" ที่ระบุใน Input เสมอ

Guidelines:
1. เขียนบรรยายงานสั้นๆ (One-liner) กระชับ เป็นธรรมชาติ
2. **ห้าม** สร้างรหัส Ticket MOCK UP (เช่น DEV-123) เด็ดขาด
3. ถ้าจะใส่รหัสงาน ต้องใช้ Prefix ที่ถูกต้องเท่านั้น: "SB-", "SBAPP-", "ACA-", "SH-", "ACC-"
4. ถ้าไม่มีรหัสในประวัติ ให้เน้นชื่อ Feature หรือ Module เป็นหลัก
5. ภาษาที่ใช้: ทางการแต่ทันสมัย (Semi-formal) เหมาะกับคนทำงาน Tech ในสายการศึกษา`;

  const userPrompt = `Input History (ประวัติงานที่ผ่านมา):
${JSON.stringify(historySample, null, 2)}

Output: ขอข้อความสั้นๆ 1 บรรทัด สำหรับรายการล่าสุด (ตอบแค่ข้อความงานเท่านั้น)`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (text) return text.trim();
  } catch (err) {
    console.error("[ChatGPT] API Error:", err);
  }

  return fallback ?? "Auto fill timesheet";
}
