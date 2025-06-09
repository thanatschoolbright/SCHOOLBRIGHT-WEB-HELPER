"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import MinimalButton from "@/components/button/minimal-button-component";
import Swal from "sweetalert2";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";
import { MinimalRow } from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import { findSchoolName } from "@helpers/find-school-id";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { InputFieldComponent } from "@components/input-field/input-field-component";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { isOnline } from "@helpers/check-online-device-status";
import { unwrapResult } from "@reduxjs/toolkit";
import { ResponseGetServerStatus } from "@/stores/type";
import MinimalModal from "@components/modal/minimal-modal-component";
import { CallAPI as GET_SERVER_STATUS } from "@/stores/actions/server/call-get-server-status";

const columns: { key: string; label: string }[] = [
  { key: "server", label: "เซิฟเวอร์" },
  { key: "description", label: "คำอธิบาย" },
  { key: "Status", label: "สถานะเซิฟเวอร์" },
  { key: "timestamp", label: "ตรวจสอบล่าสุดเมื่อ" },
  { key: "url", label: "URL" },
  { key: "endpoint", label: "ENDPOINT" },
  { key: "response", label: "RESPONSE" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const GET_SERVER_STATUS_STATE = useAppSelector(
    (state) => state.callGetServerStatus
  );

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  // filter by selected school
  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    GET_SERVER_STATUS_STATE.loading,
  ].some(Boolean);
  const [table, setTable] = useState<
    ResponseGetServerStatus["draftValues"]["Array"]
  >([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [deviceIdSearch, setDeviceIdSearch] = useState<string>("");
  const [modal, setModal] = useState<string>("");
  const [selectedRow, setSelectedRow] =
    useState<ResponseGetServerStatus["draftValues"]["Array"][number]>();

  const filteredTable = (table ?? []).filter((row) => {
    if (!fromDate && !toDate) return true;
    const ts = new Date(row.timestamp).getTime();
    const fromTs = fromDate ? new Date(fromDate).getTime() : -Infinity;
    // วันสุดท้าย ให้ตีเป็นเที่ยงคืนถัดไป เพื่อรวมทั้งวัน
    const toTs = toDate
      ? new Date(
          new Date(toDate).setDate(new Date(toDate).getDate() + 1)
        ).getTime()
      : Infinity;
    return ts >= fromTs && ts < toTs;
  });

  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName,
        value: item.SchoolID,
      })) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  useEffect(() => {
    dispatch(GET_SERVER_STATUS());
  }, []);

  useEffect(() => {
    const response = GET_SERVER_STATUS_STATE?.response?.data?.data;
    console.log("Res", response);
    setTable(response);
  }, [GET_SERVER_STATUS_STATE]);

  const renderTableData = (
    data: ResponseGetServerStatus["draftValues"]["Array"]
  ) =>
    data.map((row, idx) => (
      <MinimalRow key={idx}>
        {({
          index,
          row,
        }: {
          index: number;
          row: ResponseGetServerStatus["draftValues"]["Array"][number];
        }) => (
          <>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {index}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {row.server}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {row.description}
            </td>
            <td className="p-4">
              {row.Status === "Online" ? (
                <div>
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <span className="text-green-600 font-semibold">Online</span>
                </div>
              ) : (
                <div>
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <span className="text-red-600 font-semibold">Offline</span>
                </div>
              )}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {convertTimeZoneToThai(new Date(row.timestamp))}
            </td>
            <td className="p-4 text-sm text-blue-600 hover:underline break-all">
              <a href={row.url} target="_blank" rel="noopener noreferrer">
                {row.url}
              </a>
            </td>
            <td className="p-4 text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded break-all">
              <code>{row.endpoint}</code>
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 ">
              <MinimalButton
                className="bg-slate-600 dark:bg-gray-600"
                onClick={() => {
                  setModal("response_open");
                  setSelectedRow(row);
                }}
              >
                Response
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
            title="หมายเหตุ (1)"
            fullWidth
            className="w-full col-span-1 row-span-2"
          >
            <p className="text-sm text-red-500">
              {t("ค้นหาด้วยชื่อโรงเรียน หรือ Device ID ก่อนแล้วข้อมูลจะขึ้น")}
            </p>
          </ContentCard>
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
                  dispatch(GET_SERVER_STATUS());
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
            <div className="grid grid-cols-2 gap-4">
              {/* เลือกโรงเรียน */}
              <div className="flex-1">
                <SearchableSelectComponent
                  label="เลือกโรงเรียน"
                  options={[
                    { label: "เลือกรายการ", value: "" },
                    ...schoolList.map((s) => ({
                      label: s.label + " (" + s.value + ")",
                      value: String(s.value),
                    })),
                  ]}
                  value={selectedSchool}
                  onChange={setSelectedSchool}
                  placeholder="เลือกโรงเรียน"
                />
              </div>

              {/* ค้นหา Device ID */}
              <div>
                <InputFieldComponent
                  label="ค้นหา Device ID"
                  placeholder="พิมพ์ Device ID"
                  icon={
                    <FiSearch className="text-gray-400 dark:text-gray-500" />
                  }
                  value={deviceIdSearch}
                  onChange={(e) => setDeviceIdSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* จากวันที่ */}
              {/* <div>
                <DatePickerComponent
                  label="จากวันที่"
                  value={fromDate}
                  onChange={setFromDate}
                  className="w-full"
                />
              </div> */}

              {/* ถึงวันที่ */}
              {/* <div>
                <DatePickerComponent
                  label="ถึงวันที่"
                  value={toDate}
                  onChange={setToDate}
                  className="w-full"
                />
              </div> */}
            </div>
          </form>
        </ContentCard>

        {/* Reponse From Server */}
        {/* <ResponseCardComponent
          responseData={SCHOOL_LIST_STATE.response.data?.data}
          curlCommand={SCHOOL_LIST_STATE.response.data?.curl}
        /> */}

        {/* ตาราง */}
        <ContentCard
          title="ตารางรายงานการทำงานทุกระบบ"
          className="xl:col-span-4 w-full"
        >
          <MinimalTable
            isLoading={isLoading}
            header={columns}
            data={filteredTable}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
          >
            {filteredTable ? renderTableData(filteredTable) : null}
          </MinimalTable>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
