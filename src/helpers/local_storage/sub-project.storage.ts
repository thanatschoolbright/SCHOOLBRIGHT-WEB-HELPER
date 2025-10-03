import { UserProfile } from "@/stores/type";

export const getSubProject = () => {
  const userData = localStorage.getItem("sub_projects");
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};

export const getSubProjectById = (id: string | number) => {
  const data: any[] = getSubProject();
  console.info("Get Sub Project", data);
  if (data) {
    const subProject = data.find(
      (user) => String(user.admin_id) === String(id)
    );
    return subProject;
  }
  return null;
};
