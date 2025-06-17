"use client";
import { useEffect, useState } from "react";
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
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { InputFieldComponent } from "@components/input-field/input-field-component";

import { FiArrowLeft, FiArrowRight, FiSearch } from "react-icons/fi";
import * as type from "@/stores/type";
import MinimalModal from "@components/modal/minimal-modal-component";

import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { CallAPI as GET_LEAVE_LETTER_LIST } from "@stores/actions/mobile/call-get-leave-letter";
import { CallAPI as FIX_LEAVE_LETTER_DETAIL } from "@stores/actions/mobile/call-get-fix-leave-letter-status";

const columns: { key: string; label: string }[] = [
  { key: "letterId", label: "รหัสจดหมาย" },
  { key: "letterSubmitDate", label: "วันที่ส่งคำร้อง" },
  { key: "letterType", label: "ประเภทการลา" },
  { key: "senderName", label: "ชื่อผู้ส่งคำร้อง" },
  { key: "userType", label: "ประเภทผู้ใช้งาน" },
  { key: "status", label: "สถานะ" },
  { key: "action", label: "การกระทำ" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);

  const USER_LIST_STATE = useAppSelector(
    (state) => state.callGetuserBySchoolId
  );

  const LEAVE_LETTER_LIST = useAppSelector(
    (state) => state.callGetLeaveLetterList
  );

  const NOTIFICATION_READ_MESSAGE_STATE = useAppSelector(
    (state) => state.callGetNotificationMessage
  );

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  // filter by selected school
  const isLoading = [SCHOOL_LIST_STATE.loading, USER_LIST_STATE.loading].some(
    Boolean
  );
  const [table, setTable] = useState<type.ResponseLeaveLetter[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [deviceIdSearch, setDeviceIdSearch] = useState<string>("");
  const [modal, setModal] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<type.ResponseLeaveLetter>();
  const [form, setForm] = useState<{
    schoolID: string;
    userID: string;
    letter_id: string;
  }>({ schoolID: "", userID: "", letter_id: "" });
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
    getUserBySchoolId(form.schoolID);
  }, [form.schoolID]);

  useEffect(() => {
    if (page !== 0 && table?.length < 1) {
      Swal.fire({
        title: "ไม่พบข้อมูล",
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

  const confirmFixStatusLeaveLetter = async (letter_id: string) => {
    try {
      await dispatch(
        FIX_LEAVE_LETTER_DETAIL({
          school_id: form.schoolID,
          letter_id: letter_id,
        })
      ).unwrap();
      Swal.fire({
        icon: "success",
        title: "แก้ไขสถานะสำเร็จ",
        text: `แก้ไขสถานะจดหมายลาหยุดที่รหัส ${letter_id} สำเร็จแล้ว`,
      }).then(() => {
        setModal("");
        handleSubmitForm(page);
        setForm({ ...form, letter_id: "" });
        setSelectedRow(undefined);
      });
    } catch (error: any) {
      throw new Error(
        "Function [confirmFixStatusLeaveLetter] :",
        error.message
      );
    }
  };

  const handleSubmitForm = async (page?: number) => {
    try {
      const response = await dispatch(
        GET_LEAVE_LETTER_LIST({
          user_id: form.userID,
          page: page?.toString() ?? "1",
        })
      ).unwrap();
      setTable(response?.data);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const renderTableData = (data: type.ResponseLeaveLetter[]) =>
    data.map((row, idx) => (
      <MinimalRow key={idx}>
        {({
          index,
          row,
        }: {
          index: number;
          row: type.ResponseLeaveLetter["data"];
        }) => (
          <>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {index}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {row.letterId}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {convertTimeZoneToThai(new Date(row.letterSubmitDate))}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full">
                {row.letterType}
              </span>
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              {row.senderName}
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold text-white ${
                  row.userType === "0" ? "bg-orange-400" : "bg-orange-400"
                } rounded-full`}
              >
                {row.userType === "0" ? "นักเรียน" : "คุณครู"}
              </span>
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-full`}
              >
                {row.ApprovedStatus?.TextTH || "-"}
              </span>
            </td>
            <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
              <div className="grid grid-cols-1 justify-between">
                <MinimalButton
                  className=" bg-green-500 text-white rounded hover:bg-green-600 w-24 h-10 text-sm"
                  onClick={() => {
                    const curlCommand = LEAVE_LETTER_LIST?.response?.curl || "";
                    navigator.clipboard.writeText(curlCommand.toString());
                    Swal.fire({
                      icon: "success",
                      title: "Copied!",
                      text: "Copy CURL to clipboard.",
                      confirmButtonText: "OK",
                    });
                  }}
                >
                  CURL
                </MinimalButton>
                <MinimalButton
                  className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 w-24 h-10 text-[0.75rem]"
                  onClick={() => {
                    setForm({
                      ...form,
                      letter_id: row.leaveLetterId.toString(),
                    });
                    setModal("confirm_fix_letter");
                  }}
                >
                  แก้ไขสถานะ
                </MinimalButton>
              </div>
            </td>
          </>
        )}
      </MinimalRow>
    ));

  const renderModal = () => (
    <MinimalModal
      title="ยืนยันการแก้ไขสถานะ"
      onClose={() => setModal("")}
      confirmMode
      onConfirm={() => {
        confirmFixStatusLeaveLetter(form.letter_id);
      }}
    >
      <p className="text-gray-700 dark:text-gray-300">
        สามารถกดยืนยันได้เลย หากสถานะถูกต้องอยู่แล้ว ก็กดไปได้เลย ไม่เป็นอะไร
        หากสถานะผิดจะแก้ให้ถูก คุณต้องการแก้ไขสถานะที่รหัสข้อความ :
        {form.letter_id}
      </p>
    </MinimalModal>
  );

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}
      {modal === "confirm_fix_letter" && renderModal()}

      <div className="w-full space-y-4">
        {/* หมายเหตุ */}
        <div className="grid grid-cols-1 grid-rows-1 gap-0 w-full">
          <div className="space-y-3 w-full grid-cols-2">
            <ContentCard title="ค้นหาจดหมายลาหยุด" fullWidth className="w-full">
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
                    value={form.schoolID}
                    onChange={(event: any) => {
                      setForm({ ...form, schoolID: event });
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
                    value={form.userID}
                    onChange={(event: any) => {
                      setForm({ ...form, userID: event });
                    }}
                    placeholder="กรอกรหัส User ID"
                  />
                </div>

                <div></div>

                <div className="flex justify-end w-full">
                  <MinimalButton
                    type="button"
                    textSize="base"
                    className={` ${
                      form?.userID
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-300"
                    }`}
                    isLoading={isLoading}
                    disabled={!form?.userID}
                    onClick={async () => {
                      setPage(1);
                      await handleSubmitForm(1);
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

        {/* Reponse From Server */}
        {/* <ResponseCardComponent
          responseData={SCHOOL_LIST_STATE.response.data?.data}
          curlCommand={SCHOOL_LIST_STATE.response.data?.curl}
        /> */}

        {/* ตาราง */}
        <ContentCard
          title={`ตารางแสดงข้อความแจ้งเตือน (หน้าที่ ${page})`}
          className="xl:col-span-4 w-full"
          hidden={table?.length < 1}
        >
          <MinimalTable
            isLoading={LEAVE_LETTER_LIST.loading}
            header={columns}
            data={table}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            hiddenProps={true}
          >
            {table ? renderTableData(table) : null}
          </MinimalTable>
          <div className="flex justify-between">
            <MinimalButton
              type="submit"
              textSize="base"
              className="bg-sky-500 hover:bg-sky-700 w-10 justify-center"
              isLoading={isLoading}
              onClick={() => {
                setPage(page - 1);
                handleSubmitForm(page - 1);
              }}
            >
              <FiArrowLeft />
            </MinimalButton>
            <MinimalButton
              type="submit"
              textSize="base"
              className="bg-sky-500 hover:bg-sky-700 w-10 justify-center "
              isLoading={isLoading}
              onClick={() => {
                setPage(page + 1);
                handleSubmitForm(page + 1);
              }}
            >
              <FiArrowRight />
            </MinimalButton>
          </div>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
