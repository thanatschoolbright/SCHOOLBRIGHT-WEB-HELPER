//** ประเภทข้อมูลที่ใช้กับ Backlog (Type Safety)
export type BacklogProject = {
  id: number;
  projectKey: string;
  name: string;
  archived?: boolean;
};

