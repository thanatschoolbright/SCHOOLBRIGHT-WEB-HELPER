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
import { ResponseCardComponent } from "@/components/card/curl-card-component";
import MethodBadge from "@components/badge/method-badge-component";
import { MinimalRow } from "@components/table/minimal-row-component";
import StatusBadge from "@components/badge/status-badge-component";
import { CallGetRegisterDeviceState } from "@stores/type";
import MinimalTable from "@components/table/minimal-table-component";
import { findSchoolName } from "@helpers/find-school-id";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { InputFieldComponent } from "@components/input-field/input-field-component";
import DatePickerComponent from "@components/input-field/date-picker-component";
import { FiSearch } from "react-icons/fi";
import { isOnline } from "@helpers/check-online-device-status";
import { CallAPI as GET_REGISTER_DEVICE } from "@/stores/actions/hardware/call-get-register-device";
import { CallAPI as POST_CHECK_ONLINE_DEVICE } from "@stores/actions/hardware/call-post-online-device";

import { unwrapResult } from "@reduxjs/toolkit";

const columns = [
  { key: "ID", label: "ID" },
  { key: "DeviceID", label: "รหัสอุปกรณ์ (Device ID)" },
  { key: "NeedToUpdate", label: "สถานะอัพเดทอุปกรณ์" },
  { key: "SchoolID", label: "โรงเรียน" },
  { key: "Tstamp", label: "ออนไลน์ล่าสุดเมื่อ" },
  { key: "OnlineStatus", label: "สถานะออนไลน์" },
  { key: "UserID", label: "User ID" },
  { key: "CallAPI", label: "ทดสอบออนไลน์" },
];

type CallGetRegisterDeviceType =
  CallGetRegisterDeviceState["draftValues"]["Array"];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const REGISTER_DEVICE_STATE = useAppSelector(
    (state) => state.callGetRegisterDevice
  );
  const CHECK_ONLINE_DEVICE_STATE = useAppSelector(
    (state) => state.callPostOnlineDevice
  );
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  // filter by selected school
  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    REGISTER_DEVICE_STATE.loading,
    CHECK_ONLINE_DEVICE_STATE.loading,
  ].some(Boolean);
  const [table, setTable] = useState<CallGetRegisterDeviceType>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [deviceIdSearch, setDeviceIdSearch] = useState<string>("");

  const filteredTable = (table ?? [])
    .filter((row) =>
      deviceIdSearch
        ? row.DeviceID.toLowerCase().includes(deviceIdSearch.toLowerCase())
        : true
    )
    .filter((row) =>
      // กรองโรงเรียนเหมือนเดิม
      selectedSchool ? String(row.SchoolID) === selectedSchool : true
    )
    .filter((row) => {
      if (!fromDate && !toDate) return true;
      const ts = new Date(row.Tstamp).getTime();
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
    dispatch(GET_REGISTER_DEVICE());
  }, []);

  useEffect(() => {
    const data = REGISTER_DEVICE_STATE?.response?.data?.data;
    setTable(data);
    console.log("REGISTER DEVICE", data);
  }, [REGISTER_DEVICE_STATE]);

  //* ฟังก์ชันสำหรับตรวจสอบสถานะออนไลน์ของอุปกรณ์
  const CHECK_ONLINE_DEVICE = async (schoolId: number, deviceId: string) => {
    try {
      const response = await dispatch(
        POST_CHECK_ONLINE_DEVICE({
          SchoolID: schoolId,
          DeviceID: deviceId,
          Status: "Online",
        })
      );
      const result: {
        data: {
          success: boolean;
          statusCode: number;
          message: string;
        };
        curl: string;
      } = unwrapResult(response);

      if (result?.data?.statusCode === 200) {
        const message = `อุปกรณ์ ${deviceId}  
${findSchoolName(schoolId, schoolList)} สามารถออนไลน์ได้  
`;

        Swal.fire({
          title: "ระบบสามารถออนไลน์ได้ตามปกติ",
          text: message,
          icon: "success",
          showDenyButton: true,
          confirmButtonText: "OK",
          denyButtonText: "Copy CURL",
        }).then((res) => {
          if (res.isDenied) {
            // คัดลอกคำสั่ง CURL
            navigator.clipboard.writeText(result.curl).then(() => {
              Swal.fire({
                icon: "success",
                title: "Copied!",
                text: "CURL copied to clipboard.",
                timer: 1500,
                showConfirmButton: false,
              });
            });
          }
        });
      }
    } catch (error: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        icon: "error",
      });
      console.error("Error posting online device:", error);
      return false;
    }
  };

  const renderTableData = (data: CallGetRegisterDeviceType) =>
    data.map((row, idx) => (
      <MinimalRow key={row.ID ?? idx}>
        {({
          index,
          row,
        }: {
          index: number;
          row: CallGetRegisterDeviceType[number];
        }) => (
          <>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {index}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {row.ID}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {row.DeviceID}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {row.NeedToUpdate ? "อัพเดทแล้ว" : "ยังไม่ได้อัพเดท"}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {findSchoolName(row.SchoolID, schoolList)} ({row.SchoolID})
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {convertTimeZoneToThai(new Date(row.Tstamp))}
            </td>
            <td className="p-4">
              {isOnline(row.Tstamp) ? (
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
              ) : (
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
              )}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              {row.UserID}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">
              <MinimalButton
                onClick={() => {
                  CHECK_ONLINE_DEVICE(row.SchoolID, row.DeviceID);
                }}
              >
                ทดสอบ
              </MinimalButton>
            </td>
          </>
        )}
      </MinimalRow>
    ));

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* บังคับให้ card แรกอยู่เต็มความกว้างใน md และ xl */}

        <ContentCard
          title="รายงานซิงก์ข้อมูลออฟไลน์ล่าสุด"
          fullWidth
          className="md:col-span-2 xl:col-span-4 w-full "
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
              <div>
                <DatePickerComponent
                  label="จากวันที่"
                  value={fromDate}
                  onChange={setFromDate}
                  className="w-full"
                />
              </div>

              {/* ถึงวันที่ */}
              <div>
                <DatePickerComponent
                  label="ถึงวันที่"
                  value={toDate}
                  onChange={setToDate}
                  className="w-full"
                />
              </div>
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
          title="รายงานซิงก์ข้อมูลออฟไลน์ล่าสุด"
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
