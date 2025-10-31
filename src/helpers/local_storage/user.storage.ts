import {UserProfile} from "@stores/type";

export const getUserData = () => {
    const userData = localStorage.getItem("users");
    if (userData) {
        return JSON.parse(userData);
    }
    return null;
};

export const getUserById = (id: string | number) => {
    const users: UserProfile[] = getUserData()
    if (users) {
        const user = users.find((user) => String(user.admin_id) === String(id));
        return user;
    }
    return null;
};


export const getUserByLocalStorage = async () => {
    const user = localStorage.getItem("AUTH_USER");
    const extractedUser = user ? JSON.parse(user) : null;
    const name = extractedUser?.user_data?.firstname + " " + extractedUser?.user_data?.lastname;
    const id = extractedUser?.user_data?.admin_id;
    console.log("Current User from localStorage:", name);
    if (user) {
        return id;
    }
    return null;
}
