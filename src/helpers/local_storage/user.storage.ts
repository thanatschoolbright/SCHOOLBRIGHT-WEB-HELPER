import { UserProfile } from "@stores/type";

export const getUserData = (): UserProfile[] | null => {
  if (typeof window === "undefined") return null;
  const userDataString = localStorage.getItem("user_data");
  if (!userDataString) return null;
  try {
    return JSON.parse(userDataString);
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};

export const getUserById = (identifier: string | number): UserProfile | null => {
  const usersArray = getUserData();
  if (!Array.isArray(usersArray)) return null;
  return (
    usersArray.find(
      (userItem) =>
        String(userItem.admin_id) === String(identifier) ||
        String(userItem.id) === String(identifier),
    ) || null
  );
};

export const getUserByLocalStorage = async (): Promise<UserProfile[] | null> => {
  return getUserData();
};
