import axios from "axios";

type HistoryEntry = {
  description?: string | null;
  project?: { name?: string | null };
  feature?: { name?: string | null };
};

export async function generateDescriptionWithChatGPT({
  history,
  fallback,
  projectName,
  featureName,
  role: userRole,
}: {
  history: HistoryEntry[];
  fallback?: string | null;
  projectName?: string;
  featureName?: string;
  role?: string;
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
- ต้องเขียนให้คลอบคลุมเนื้องานที่ทำจริง โดยอ้างอิงจาก Feature และ Project

Guidelines:
1. **เริ่มประโยคด้วยกริยาการกระทำทันที** เช่น "ดำเนินการ...", "มุ่งเน้นการสร้าง...", "วิจัยและออกแบบ...", "พัฒนาส่วนขยาย..."
2. **ห้าม** พูดซ้ำว่า "พัฒนาฟีเจอร์ X ในโปรเจกต์ Y" หรือ "สำหรับฟีเจอร์..." เพราะเป็นข้อมูลที่ซ้ำซ้อน
3. **ตัดส่วนเกริ่นนำทิ้งทั้งหมด** ให้เข้าเรื่องเนื้องานที่ทำในฟีเจอร์นั้นๆ ทันที
4. **ห้าม** สร้างรหัส Ticket MOCK UP (เช่น DEV-123)
5. ถ้าจะใส่รหัสงาน ต้องใช้ Prefix: "SB-", "SBAPP-", "ACA-", "SH-", "ACC-"
6. ภาษาที่ใช้: ทางการแต่ทันสมัย (Semi-formal)
7. **ความยาวต้องเกิน 100 ตัวอักษร** โดยให้อธิบายถึงรายละเอียดเนื้องานและผลลัพธ์ที่ได้จากการทำฟีเจอร์นั้นๆ อย่างสังเขปแต่ได้ใจความ`;

  let userPrompt = `Input History (ประวัติงานที่ผ่านมาเพื่อดูสไตล์):
${JSON.stringify(historySample, null, 2)}`;

  if (projectName && featureName) {
    userPrompt += `

โจทย์ปัจจุบัน:
Project: ${projectName}
Feature: ${featureName}
Role (บทบาทพนักงาน): ${userRole || "ไม่ระบุ"}

คำสั่งพิเศษ:
- เขียนรายละเอียดงานที่ทำจริงสำหรับ "${featureName}" ของโปรเจกต์ "${projectName}" ในฐานะพนักงานตำแหน่ง "${userRole || "ไม่ระบุ"}"
- เนื้อหาต้องสอดคล้องกับบทบาท เช่น ถ้าเป็น QA ต้องเน้นตรวจอบ, ถ้าเป็น Developer ต้องเน้นพัฒนาระบบหรือแก้ Bug
- อธิบายขั้นตอนหรือเป้าหมายที่พนักงานทำ เช่น การออกแบบระบบ, การจัดการข้อมูล, หรือการปรับปรุงประสิทธิภาพ
- ห้ามมีคำเกริ่นนำประเภท "พัฒนาฟีเจอร์..." หรือ "ในโปรเจกต์..." ให้เริ่มที่กริยาอาการที่ทำเลย`;
  }

  userPrompt += `

Output: ขอข้อความบรรยายงาน 1 รายการตามโจทย์ที่ได้รับ (ตอบแค่ข้อความบรรยายเท่านั้น)`;

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
