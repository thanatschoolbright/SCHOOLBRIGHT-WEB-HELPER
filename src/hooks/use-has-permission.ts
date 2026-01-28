import { useSession } from "next-auth/react";
import { PermissionCode } from "@/constants/permission.constant";

/**
 * @description Hook for checking user permissions inside components
 * @example const { can } = useHasPermission();
 *          if (can("user.manage")) { ... }
 */
export const useHasPermission = () => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const permissions: string[] = user?.permissions || [];
  const isAdmin = Number(user?.admin_id) === 117;

  const can = (permissionCode: PermissionCode | PermissionCode[]) => {
    if (isAdmin) return true;

    if (Array.isArray(permissionCode)) {
      return permissionCode.some((p) => permissions.includes(p));
    }
    return permissions.includes(permissionCode);
  };

  return { can, permissions, isAdmin };
};
