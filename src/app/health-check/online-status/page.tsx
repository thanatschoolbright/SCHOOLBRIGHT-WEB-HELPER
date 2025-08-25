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
import { unwrapResult } from "@reduxjs/toolkit";
import { CallAPI as GET_ONLINE_DEVICE } from "@stores/actions/hardware/call-get-online-device";
import { CallAPI as POST_CHECK_ONLINE_DEVICE } from "@stores/actions/hardware/call-post-online-device";
import { RequestDeviceDailyStatusTypes } from "@/types/device-daily-status.types";
import { DeviceDailyStatus as ResponseOnlineDeviceType } from "generated/prisma";

const columns: { key: string; label: string }[] = [
  { key: "SchoolID", label: "โรงเรียน" },
  { key: "DeviceID", label: "รหัสอุปกรณ์ (Device ID)" },
  { key: "Login", label: "สถานะการเข้าสู่ระบบ" },
  { key: "Tstamp", label: "ออนไลน์ล่าสุดเมื่อ" },
  { key: "BusinessDate", label: "ทำรายการขายล่าสุดเมื่อ" },
  { key: "OnlineStatus", label: "สถานะออนไลน์" },

  { key: "CallAPI", label: "ทดสอบออนไลน์" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const REGISTER_DEVICE_STATE = useAppSelector(
    (state) => state.callGetOnlineDevice
  );
  const CHECK_ONLINE_DEVICE_STATE = useAppSelector(
    (state) => state.callPostOnlineDevice
  );
  const [selectedSchool, setSelectedSchool] = useState<string | string[]>("");
  // filter by selected school
  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    REGISTER_DEVICE_STATE.loading,
    CHECK_ONLINE_DEVICE_STATE.loading,
  ].some(Boolean);
  const [table, setTable] = useState<ResponseOnlineDeviceType[]>([]);
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
    const defaultRequest: RequestDeviceDailyStatusTypes = {
      schoolId: selectedSchool as string,
      deviceId: deviceIdSearch,
      limit: rowsPerPage.toString(),
    };
    dispatch(GET_ONLINE_DEVICE(defaultRequest));
  }, [selectedSchool, deviceIdSearch, rowsPerPage]);

  useEffect(() => {
    const data = REGISTER_DEVICE_STATE?.response?.data?.data;
    setTable(data);
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
        const message = `อุปกรณ์ ${deviceId}  \n${findSchoolName(
          schoolId,
          schoolList
        )} สามารถออนไลน์ได้`;

        toast.success("ระบบสามารถออนไลน์ได้ตามปกติ", {
          description: message,
          duration: 5000,
          position: "bottom-center",
          action: {
            label: "Copy CURL",
            onClick: () => {
              navigator.clipboard.writeText(result.curl).then(() => {
                toast.success("Copied!", {
                  description: "CURL copied to clipboard.",
                  duration: 1500,
                  position: "bottom-center",
                });
              });
            },
          },
        });
      } else {
        toast.error("ไม่สามารถออนไลน์ได้", {
          description:
            result?.data?.message || "ไม่สามารถเชื่อมต่อกับอุปกรณ์ได้",
          duration: 6000,
          position: "bottom-center",
          action: {
            label: "Copy CURL",
            onClick: () => {
              navigator.clipboard.writeText(result.curl).then(() => {
                toast.success("Copied!", {
                  description: "CURL copied to clipboard.",
                  duration: 1500,
                  position: "bottom-center",
                });
              });
            },
          },
        });
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        duration: 6000,
        position: "bottom-center",
      });
      console.error("Error posting online device:", error);
      return false;
    }
  };

  const renderTableData = (data: ResponseOnlineDeviceType[]) =>
    data.map((row, idx) => (
      <MinimalRow key={idx}>
        {({ index, row }: { index: number; row: ResponseOnlineDeviceType }) => (
          <>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {index}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {findSchoolName(row.SchoolID, schoolList)} ({row.SchoolID})
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {row.DeviceID}
            </td>

            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {row.Login ? "เข้าสู่ระบบแล้ว" : "ยังไม่ได้เข้าสู่ระบบ"}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {convertTimeZoneToThai(new Date(row.Tstamp))}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {convertTimeZoneToThai(new Date(row.BusinessDate))}
            </td>
            <td className="p-4">
              {isOnline(row.OnlineTime) ? (
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
              ) : (
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
              )}
            </td>
            <td className="p-4 font-medium text-sm  text-gray-900 dark:text-gray-200">
              <MinimalButton
                className="bg-green-500"
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
      <Toaster richColors position="bottom-center" closeButton />
      {isLoading && <BaseLoadingComponent />}

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
          {/* <ContentCard
            title="หมายเหตุ (2)"
            fullWidth
            className="w-full col-span-1 row-span-2"
          >
            <p className="text-sm text-red-500">
              {t(
                "กรณีที่ไม่พบข้อมูลใน https://www.canteen.schoolbright.co แต่พบข้อมูลที่นี่ แปลว่าเป็นปัญหาที่ Memory Sharing ของระบบ Canteen Web ให้แจ้ง Vimal"
              )}
            </p>
          </ContentCard> */}
        </div>

        <ContentCard
          title="รายงานการเชื่อมต่อเครื่อง Canteen Online"
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
          title="ตารางการเชื่อมต่อเครื่อง Canteen Online"
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
