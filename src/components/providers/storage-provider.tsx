"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { callApiService } from "@services/axios-instance/sb-helper.axios";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  projectName: string;
  status: string;
}

interface StorageCache {
  users: User[];
  projects: Project[];
}

interface StorageContextType {
  cache: StorageCache;
  requestUserListData: () => Promise<void>;
  requestProjectListData: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: React.PropsWithChildren) {
  const [cache, setCache] = useState<StorageCache>({
    users: [],
    projects: [],
  });

  const requestUserListData = useCallback(async () => {
    try {
      const { data } = await callApiService.get("/api/v1/admin/user/");
      const userList = data?.data?.data ?? [];
      setCache((prev) => ({ ...prev, users: userList }));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const requestProjectListData = useCallback(async () => {
    try {
      const { data } = await callApiService.post(
        "/api/v1/timesheet/project/read/",
        { limit: 50, page: 1 },
        { headers: { "Content-Type": "application/json" } },
      );
      setCache((prev) => ({ ...prev, projects: data.data ?? [] }));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void requestUserListData();
    void requestProjectListData();
  }, [requestUserListData, requestProjectListData]);

  const value = useMemo(
    () => ({
      cache,
      requestUserListData,
      requestProjectListData,
    }),
    [cache, requestUserListData, requestProjectListData],
  );

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export const useMemoryStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useMemoryStorage must be used within a StorageProvider");
  }
  return context;
};
