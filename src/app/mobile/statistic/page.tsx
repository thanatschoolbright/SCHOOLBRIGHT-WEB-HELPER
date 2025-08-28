"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import MinimalButton from "@/components/button/minimal-button-component";
import { toast } from "sonner";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";
import { MinimalRow } from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { InputFieldComponent } from "@components/input-field/input-field-component";

import {
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiBriefcase,
  FiHeart,
  FiHelpCircle,
} from "react-icons/fi";
import * as type from "@/stores/type";
import DatePickerComponent from "@components/input-field/date-picker-component";

import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { CallAPI as POST_TO_GET_STATISTIC } from "@stores/actions/mobile/call-post-statistic";
import formatDateToMMDDYYYY from "@helpers/convert-to-mm-dd-yyyy";

// ---------------------------------------------
// {* โครงสร้างข้อมูลจาก API สถิติการมาเรียน *}
type AttendanceRow = {
  SchoolID: number;
  dScan: string; // วันที่สแกน (ISO string)
  StatusIN: string; // รหัสสถานะเข้าโรงเรียน
  TimeIn: string; // เวลาเข้า (ISO string)
  StatusOut: string; // รหัสสถานะออกโรงเรียน
  TimeOut: string; // เวลาออก (ISO string)
};

// {* แปลงรหัสสถานะ -> ป้ายภาษาไทย + สีแสดงผล (ใช้เฉดสีอ่อน) *}
const getStatusInfo = (status: string): { label: string; color: string } => {
  switch (status) {
    case "0":
    case "7":
      return { label: "ตรงเวลา", color: "bg-green-100 text-green-700" };
    case "1":
      return { label: "สาย", color: "bg-red-100 text-red-700" };
    case "3":
      return { label: "ขาด", color: "bg-gray-100 text-gray-700" };
    case "4":
    case "10":
      return { label: "ลากิจ", color: "bg-yellow-100 text-yellow-700" };
    case "5":
    case "11":
      return { label: "ลาป่วย", color: "bg-blue-100 text-blue-700" };
    case "6":
    case "12":
      return { label: "กิจกรรม", color: "bg-purple-100 text-purple-700" };
    case "21":
    case "22":
    case "23":
    case "24":
    case "25":
    case "26":
      return { label: "ลาอื่นๆ", color: "bg-pink-100 text-pink-700" };
    case "99":
      return { label: "ไม่เช็กชื่อ", color: "bg-orange-100 text-orange-700" };
    case "-":
      return { label: "ไม่ทราบ", color: "bg-gray-100 text-gray-700" };
    default:
      return { label: "ไม่ทราบ", color: "bg-gray-100 text-gray-700" };
  }
};

const getStatusElement = (info: { label: string; color: string }) => {
  let Icon = FiHelpCircle;
  switch (info.label) {
    case "ตรงเวลา":
      Icon = FiCheckCircle;
      break;
    case "สาย":
      Icon = FiClock;
      break;
    case "ขาด":
      Icon = FiXCircle;
      break;
    case "ลากิจ":
      Icon = FiBriefcase;
      break;
    case "ลาป่วย":
      Icon = FiHeart;
      break;
    default:
      Icon = FiHelpCircle;
  }
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 ${info.color}`}
    >
      <Icon className="w-4 h-4 animate-bounce" />
      {info.label}
    </span>
  );
};
// ---------------------------------------------

// {* คอลัมน์สำหรับตารางสถิติการมาเรียน *}
const columns: { key: string; label: string }[] = [
  { key: "SchoolID", label: "รหัสโรงเรียน" },
  { key: "Owner", label: "ผู้ที่แสกน" },
  { key: "dScan", label: "วันที่สแกน" },
  { key: "TimeIn", label: "เวลาเข้า" },
  { key: "TimeOut", label: "เวลาออก" },
  { key: "StatusIN", label: "สถานะเข้า" },
  { key: "StatusOut", label: "สถานะออก" },
  { key: "action", label: "การกระทำ" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);

  const USER_LIST_STATE = useAppSelector(
    (state) => state.callGetuserBySchoolId
  );

  const NOTIFICATION_READ_MESSAGE_STATE = useAppSelector(
    (state) => state.callGetNotificationMessage
  );

  const STATISTIC_STATE = useAppSelector((state) => state.callPostStatistic);

  const [selectedSchool, setSelectedSchool] = useState<string | string[]>("");
  // filter by selected school
  const isLoading = [SCHOOL_LIST_STATE.loading, USER_LIST_STATE.loading].some(
    Boolean
  );
  // {"table" เก็บรายการสแกนเข้า-ออกโรงเรียน}
  const [table, setTable] = useState<AttendanceRow[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  const [deviceIdSearch, setDeviceIdSearch] = useState<string>("");
  const [modal, setModal] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<AttendanceRow | undefined>();
  const [form, setForm] = useState<{
    school_id: string;
    user_id: string;
    start_date: string;
    end_date: string;
  }>({
    school_id: "",
    user_id: "",
    start_date: "",
    end_date: "",
  });
  const [page, setPage] = useState<number>(0);

  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName,
        value: item.SchoolID,
      })) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  useEffect(() => {
    getUserBySchoolId(form.school_id);
  }, [form.school_id]);

  useEffect(() => {
    if (page !== 0 && table?.length < 1) {
      toast.error("ไม่พบข้อมูล", {
        duration: 3000,
        position: "top-right",
      });
    }
  }, [table]);

  useEffect(() => {
    page === 0 ? setPage(1) : setPage(page);
  }, [page]);

  const getUserBySchoolId = async (schoolId: string) => {
    try {
      const response = await dispatch(GET_USER_BY_SCHOOLID({ schoolId }));
      setUserList(
        response?.payload?.data?.map(
          (item: type.ResponseUserList["draftValues"]) => ({
            label: `${item?.Name} \t ${item?.LastName}\t(ID : ${item?.UserID} Username : ${item?.username})`,
            value: item?.UserID,
          })
        )
      );
      console.log(response);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  const handleSubmitForm = async () => {
    try {
      const response = await dispatch(
        POST_TO_GET_STATISTIC({
          user_id: form.user_id,
          school_id: form.school_id,
          start_date: formatDateToMMDDYYYY(form.start_date),
          end_date: formatDateToMMDDYYYY(form.end_date),
        })
      ).unwrap();

      setTable(response?.data);

      // ✅ แจ้งเตือนเมื่อค้นหาสำเร็จ
      if (response?.data?.length > 0) {
        toast.success("ค้นหาสำเร็จ", {
          description: `รหัสนักเรียน/บุคลากร: ${form.user_id}`,
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // { * สร้างแถวข้อมูลสำหรับตารางสถิติการมาเรียน * }
  const renderTableData = (data: AttendanceRow[]) =>
    data.map((row, idx) => (
      <MinimalRow key={idx}>
        {({ index }: { index: number }) => {
          const inInfo = getStatusInfo(row.StatusIN);
          const outInfo = getStatusInfo(row.StatusOut);
          return (
            <>
              {/* { * ลำดับรายการ * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {index + 1}
              </td>
              {/* { * รหัสโรงเรียน * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {row.SchoolID}
              </td>
              {/* { * ผู้ที่แสกน * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {userList.find(
                  (user: any) => String(user.value) === String(form.user_id)
                )?.label ?? "ไม่พบข้อมูลผู้ใช้"}
              </td>
              {/* { * วันที่สแกน * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {convertTimeZoneToThai(new Date(row.dScan))}
              </td>
              {/* { * เวลาเข้า * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {convertTimeZoneToThai(new Date(row.TimeIn))}
              </td>
              {/* { * เวลาออก * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {convertTimeZoneToThai(new Date(row.TimeOut))}
              </td>
              {/* { * สถานะเข้า * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {getStatusElement(inInfo)}
              </td>
              {/* { * สถานะออก * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                {getStatusElement(outInfo)}
              </td>
              {/* { * ปุ่มคัดลอก CURL * } */}
              <td className="p-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                <div className="grid grid-cols-1 justify-between">
                  <MinimalButton
                    className="bg-green-600 text-green-700 rounded-lg hover:bg-green-900 w-24 h-9 text-xs transition-all duration-300 hover:scale-105 active:scale-95"
                    onClick={() => {
                      const curlCommand = STATISTIC_STATE?.response?.curl;
                      if (curlCommand) {
                        navigator.clipboard.writeText(String(curlCommand));
                        toast.success("Copied CURL", {
                          description: "CURL command copied to clipboard.",
                          duration: 3000,
                          position: "top-right",
                        });
                      } else {
                        toast.error("ไม่มี CURL Command", {
                          duration: 3000,
                          position: "top-right",
                        });
                      }
                    }}
                  >
                    COPY CURL
                  </MinimalButton>
                </div>
              </td>
            </>
          );
        }}
      </MinimalRow>
    ));

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* หมายเหตุ */}
        <div className="grid grid-cols-1 grid-rows-1 gap-0 w-full">
          <div className="space-y-3 w-full grid-cols-2">
            <ContentCard title="สถิติการมาเรียน" fullWidth className="w-full">
              {/* ห่อสองช่องด้วย grid จริง ๆ */}
              <div className="grid grid-cols-2 gap-4 w-full">
                {/* กรอก School Id */}
                <div>
                  <SearchableSelectComponent
                    label="เลือกโรงเรียน"
                    options={[
                      { label: "เลือกรายการ", value: "" },
                      ...schoolList.map((s) => ({
                        label: s.label + " (" + s.value + ")",
                        value: String(s.value),
                      })),
                    ]}
                    value={form.school_id}
                    onChange={(event: any) => {
                      setForm({ ...form, school_id: event });
                    }}
                    placeholder="เลือกโรงเรียน"
                  />
                </div>

                {/* กรอกรหัส User ID  */}
                <div>
                  <SearchableSelectComponent
                    label="กรอกรหัส User ID ที่ต้องการค้นหา"
                    options={[
                      { label: "เลือกรายการ", value: "" },
                      ...(userList ?? []).map((s) => ({
                        label: s.label,
                        value: String(s.value),
                      })),
                    ]}
                    value={form.user_id}
                    onChange={(event: any) => {
                      setForm({ ...form, user_id: event });
                    }}
                    placeholder="กรอกรหัส User ID"
                  />
                </div>

                {/* จากวันที่ */}
                <div>
                  <DatePickerComponent
                    label="จากวันที่"
                    value={form.start_date}
                    onChange={(event: any) => {
                      setForm({
                        ...form,
                        start_date: event ? event : "",
                      });
                    }}
                    className="w-full"
                  />
                </div>

                {/* ถึงวันที่ */}
                <div>
                  <DatePickerComponent
                    label="ถึงวันที่"
                    value={form.end_date}
                    onChange={(event: any) => {
                      setForm({
                        ...form,
                        end_date: event ? event : "",
                      });
                    }}
                    className="w-full"
                  />
                </div>

                <div className="flex justify-center  col-span-2 ">
                  <MinimalButton
                    type="button"
                    textSize="lg"
                    className={`${
                      form?.user_id
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-300"
                    }`}
                    isLoading={isLoading}
                    disabled={
                      !form?.user_id || !form?.start_date || !form?.end_date
                    }
                    onClick={async () => {
                      await handleSubmitForm();
                    }}
                  >
                    ค้นหา
                  </MinimalButton>
                </div>
              </div>
            </ContentCard>
          </div>
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
            </div>
          </form>
        </ContentCard>

        {/* ตาราง */}
        <ContentCard
          title={`ตาราง (หน้าที่ ${page})`}
          className="xl:col-span-4 w-full"
          hidden={table?.length < 1}
        >
          <MinimalTable
            isLoading={STATISTIC_STATE.loading}
            header={columns}
            data={table}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            hiddenProps={false}
          >
            {table ? renderTableData(table) : null}
          </MinimalTable>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
