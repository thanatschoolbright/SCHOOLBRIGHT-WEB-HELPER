import { UserProfile } from "@/stores/type";

export const getProjectData = () => {
  const userData = localStorage.getItem("projects");
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};

export const getProjectById = (id: string | number) => {
  const data: any[] = getProjectData();
  if (data) {
    const project = data.find((user) => String(user.id) === String(id));
    return project;
  }
  return null;
};
