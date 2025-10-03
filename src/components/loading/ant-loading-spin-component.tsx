import { Spin } from "antd";
import DashboardLayout from "../layouts/backend-layout";

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="กำลังโหลด...">
          <div style={{ height: 100, width: 100 }} />
        </Spin>
      </div>
    </DashboardLayout>
  );
}
