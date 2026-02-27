// components/ClientProvider.tsx
"use client";

import { registerServiceWorker } from "@services/progressive-web-app";
import { StoreProvider } from "@stores/store-provider";
import { App as AntdApp } from "antd";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

// Import All Client Providers
import AuthenticationProvider from "./auth-provider";
import ChartProvider from "./chartjs-provider";
import ForceLogoutProvider from "./force-logout-provider";
import LocaleProvider from "./i18n-provider";
import SchoolReduxProvider from "./school-list-provider";
import { StorageProvider } from "./storage-provider";

/**
 * CombinedProviders - ศูนย์รวม Provider ทั้งหมดเพื่อความ Clean Code
 */
export default function CombinedProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SessionProvider>
      <StoreProvider>
        <AntdApp>
          <ForceLogoutProvider>
            <LocaleProvider locale="th">
              <AuthenticationProvider>
                <SchoolReduxProvider>
                  <StorageProvider>
                    <ChartProvider>{children}</ChartProvider>
                  </StorageProvider>
                </SchoolReduxProvider>
              </AuthenticationProvider>
            </LocaleProvider>
          </ForceLogoutProvider>
        </AntdApp>
      </StoreProvider>
    </SessionProvider>
  );
}
