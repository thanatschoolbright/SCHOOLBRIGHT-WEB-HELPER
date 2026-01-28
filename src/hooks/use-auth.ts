"use client";

import { useSession } from "next-auth/react";

export const useAuth = () => {
  const { data: session, status, update } = useSession();

  return {
    user: session?.user,
    role_id: (session?.user as any)?.role_id,
    role_name: (session?.user as any)?.role_name,
    employee_code: (session?.user as any)?.employee_code,
    permissions: (session?.user as any)?.permissions || [],
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    update,
  };
};

export const hasPermission = (
  permissions: string[],
  requiredPermission: string,
) => {
  return permissions.includes(requiredPermission);
};
