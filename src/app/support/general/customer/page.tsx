"use client";

import DashboardLayout from "@components/layouts/backend-layout";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

export default function ServerStatusPage() {
  return (
    <DashboardLayout>
      <></>
    </DashboardLayout>
  );
}
