//** ประเภทข้อมูล Release Note เพื่อความเป็น Type Safety
export type ReleaseNoteItem = {
  type: "add" | "update" | "remove";
  emoji: string;
  message: string;
};

export type ReleaseNoteGroup = {
  date: string; // รูปแบบ YYYY-MM-DD
  release_note: ReleaseNoteItem[];
};

