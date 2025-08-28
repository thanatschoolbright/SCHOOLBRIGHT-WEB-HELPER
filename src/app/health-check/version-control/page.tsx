"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import MinimalButton from "@/components/button/minimal-button-component";
import { Toaster, toast } from "sonner";
import { MinimalRow } from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import { FiRefreshCw } from "react-icons/fi";
import { ResponseVersionControl } from "@/stores/type";
import MinimalModal from "@components/modal/minimal-modal-component";
import { CallAPI as GET_VERSION_CONTROL } from "@/stores/actions/health-check/version-control/action";
import { convertTimeZoneToThai } from "@/helpers/convert-time-zone-to-thai";

const columns: { key: string; label: string }[] = [
  { key: "system", label: "ระบบ" },
  { key: "environment", label: "สภาพแวดล้อม" },
  { key: "version", label: "เวอร์ชัน" },
  { key: "updated_at", label: "อัปเดทวันที่" },
  { key: "actions", label: "การทำงาน" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);

  const GET_VERSION_CONTROL_STATE = useAppSelector(
    (state) => state.callVersionControlReducer
  );

  // filter by selected school
  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    GET_VERSION_CONTROL_STATE.loading,
  ].some(Boolean);
  const [table, setTable] = useState<ResponseVersionControl["data"]["data"]>(
    []
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState<string>("");
  const [selectedRow, setSelectedRow] =
    useState<ResponseVersionControl["data"]["data"][number]>();

  useEffect(() => {
    dispatch(GET_VERSION_CONTROL());
  }, []);

  useEffect(() => {
    const response = GET_VERSION_CONTROL_STATE?.response?.data?.data ?? [];
    console.info("Response : ", JSON.stringify(response, null, 2));
    setTable(response);
  }, [GET_VERSION_CONTROL_STATE]);

  const getEnvBadge = (env: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium";
    if (env === "production") return `${base} bg-green-100 text-green-700`;
    if (env === "staging" || env === "beta")
      return `${base} bg-yellow-100 text-yellow-700`;
    return `${base} bg-blue-100 text-blue-700`;
  };

  const renderTableData = (data: ResponseVersionControl["data"]["data"]) =>
    data?.map((row, idx) => (
      <MinimalRow key={idx}>
        {({ index }: { index: number }) => (
          <>
            {/* ลำดับ */}
            <td className="p-4 font-medium text-sm">{index}</td>

            {/* system */}
            <td className="p-4 text-sm font-semibold">
              {row.system.toUpperCase()}
            </td>

            {/* environment */}
            <td className="p-4 text-sm">
              <span className={getEnvBadge(row.environment)}>
                {row.environment}
              </span>
            </td>

            {/* version */}
            <td className="p-4 text-sm">
              {row.version ? (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                  {row.version}
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                  no version
                </span>
              )}
            </td>

            {/* updated_at */}
            <td className="p-4 text-xs text-gray-500">
              {convertTimeZoneToThai(new Date(row.updated_at))}
            </td>

            {/* ปุ่ม Response */}
            <td className="p-4 text-sm">
              <MinimalButton
                className="bg-slate-600 dark:bg-gray-600"
                onClick={() => {
                  setModal("response_open");
                  setSelectedRow(row);
                }}
              >
                ดูรายละเอียด
              </MinimalButton>
            </td>
          </>
        )}
      </MinimalRow>
    ));

  const renderModal = () => (
    <MinimalModal title="รายละเอียดเซิร์ฟเวอร์" onClose={() => setModal("")}>
      <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">
        {JSON.stringify(selectedRow, null, 2)}
      </pre>
    </MinimalModal>
  );

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}
      {modal === "response_open" && renderModal()}

      <div className="w-full space-y-4">
        {/* หมายเหตุ */}
        <div className="grid grid-cols-2 grid-rows-1 gap-6 w-full">
          <ContentCard
            title="ทดสอบสถานะเซิฟเวอร์อีกครั้ง"
            fullWidth
            className="w-full col-span-1 row-span-2"
          >
            <p className="text-sm text-red-500">
              <MinimalButton
                iconLeft={<FiRefreshCw className="" />}
                className="bg-green-500 hover:bg-green-600"
                onClick={() => {
                  dispatch(GET_VERSION_CONTROL());
                  toast.success("รีเฟรชสำเร็จ", {
                    duration: 3000,
                    position: "top-right",
                  });
                }}
              >
                รีเฟรช
              </MinimalButton>
            </p>
          </ContentCard>
        </div>

        <ContentCard
          title="รายงานการทำงานทุกระบบ"
          fullWidth
          className="md:col-span-2 xl:col-span-4 w-full hidden"
        >
          {/* -- ใน <ContentCard> ส่วนฟอร์ม -- */}
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4"></div>
          </form>
        </ContentCard>

        {/* ตาราง */}
        <ContentCard
          title="ตารางรายงานการทำงานทุกระบบ"
          className="xl:col-span-4 w-full"
        >
          <MinimalTable
            isLoading={isLoading}
            header={columns}
            data={table}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
          >
            {table ? renderTableData(table) : null}
          </MinimalTable>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
