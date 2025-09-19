import { UserProfile } from "@/stores/type";

export const getUserData = () => {
  const userData = localStorage.getItem("users");
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};

export const getUserById = (id: string | number) => {
  const users: UserProfile[] = getUserData();
  if (users) {
    const user = users.find((user) => String(user.admin_id) === String(id));
    return user;
  }
  return null;
};
