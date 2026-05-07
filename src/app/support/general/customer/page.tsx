"use client";

import DashboardLayout from "@components/layouts/backend-layout";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { useEffect } from "react";

dayjs.extend(buddhistEra);
dayjs.locale("th");

export default function ServerStatusPage() {
  const { fetchServerStatus } = useServerStatusStore();

  useEffect(() => {
    fetchServerStatus("normal");
  }, [fetchServerStatus]);

  return (
    <DashboardLayout>
      <></>
    </DashboardLayout>
  );
}
