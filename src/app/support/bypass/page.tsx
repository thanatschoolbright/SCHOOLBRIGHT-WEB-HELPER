"use client";
import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import MinimalButton from "@/components/button/minimal-button-component";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";
import { MinimalRow } from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import { CallAPI as GET_SCHOOL_LIST_DETAIL } from "@stores/actions/support/call-get-school-list-detail";
import * as type from "@stores/type";

const columns: { key: string; label: string }[] = [
  { key: "school_id", label: "รหัสโรงเรียน" },
  { key: "company_name", label: "ชื่อโรงเรียน" },
  { key: "province", label: "จังหวัด" },
  { key: "school_group", label: "กลุ่มโรงเรียน" },
  { key: "school_class", label: "ระดับชั้นที่เปิดสอน" },
  { key: "school_grade", label: "เกรดโรงเรียน" },
  { key: "isActive", label: "สถานะการใช้งาน" },

  { key: "action", label: "การกระทำ" }, // เช่น ปุ่มแก้ไข ลบ ฯลฯ
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const SCHOOL_LIST_WITH_DETAIL = useAppSelector(
    (state) => state.callGetSchooListDetail
  );

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const handleEdit = (row: any) => {
    console.log("Edit", row);
    setDropdownOpen(null);
  };

  const handleDelete = (row: any) => {
    console.log("Delete", row);
    setDropdownOpen(null);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const data = SCHOOL_LIST_WITH_DETAIL?.response?.data?.data ?? [];
    const filtered = selectedSchool
      ? data.filter((d) => String(d.school_id) === selectedSchool)
      : data;
    setTable(filtered);
  }, [selectedSchool, SCHOOL_LIST_WITH_DETAIL]);
  const [table, setTable] = useState<
    type.ResponseSchoolListWithMoreDetail["data"]["data"]
  >([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    SCHOOL_LIST_WITH_DETAIL.loading,
  ].some(Boolean);

  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName,
        value: item.SchoolID,
      })) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  useEffect(() => {
    dispatch(GET_SCHOOL_LIST_DETAIL());
  }, []);

  useEffect(() => {
    const data = SCHOOL_LIST_WITH_DETAIL?.response?.data?.data ?? [];
    const filtered = selectedSchool
      ? data.filter((d) => String(d.school_id) === selectedSchool)
      : data;
    setTable(filtered);
  }, [SCHOOL_LIST_WITH_DETAIL]);

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* บังคับให้ card แรกอยู่เต็มความกว้างใน md และ xl */}

        <ContentCard
          title="ตารางแสดงรายละเอียดโรงเรียน"
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
          title="ตารางแสดงรายละเอียดโรงเรียน"
          className="xl:col-span-4 w-full"
        >
          <MinimalTable
            isLoading={isLoading}
            header={columns}
            data={table}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            rowRenderer={(row, idx) => (
              <tr key={idx}>
                <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {idx + 1}
                </td>
                <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.school_id}
                </td>

                <td className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">{row.company_name}</span>
                </td>

                <td className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  {row.province}
                </td>

                <td className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  {row.school_group || "-"}
                </td>
                <td className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  {row.school_class || "-"}
                </td>
                <td className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full transition-all duration-500
                      ${
                        row.school_grade === "A"
                          ? "bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100 animate-pulse"
                          : row.school_grade === "B"
                          ? "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100 animate-pulse"
                          : row.school_grade === "C"
                          ? "bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100 animate-pulse"
                          : row.school_grade === "D"
                          ? "bg-orange-200 text-orange-900 dark:bg-orange-700 dark:text-orange-100 animate-pulse"
                          : row.school_grade === "E"
                          ? "bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-100 animate-pulse"
                          : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                  >
                    {row.school_grade}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      row.isActive === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200"
                    }`}
                  >
                    {row.isActive}
                  </span>
                </td>

                <td className="p-4 relative">
                  <div
                    ref={dropdownRef}
                    className="relative inline-block text-left"
                  >
                    <MinimalButton
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      onClick={() => setDropdownOpen(idx)}
                    >
                      จัดการ
                    </MinimalButton>

                    <div
                      className={`absolute right-0 z-10 mt-2 w-52 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-300 ease-in-out transform ${
                        dropdownOpen === idx
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95"
                      }`}
                      style={{
                        pointerEvents: dropdownOpen === idx ? "auto" : "none",
                      }}
                    >
                      <ul className="py-1 text-sm text-gray-700 dark:text-gray-100">
                        <li className="group relative px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Login
                          <ul className="absolute right-full top-0 mr-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg hidden group-hover:block transition-all duration-300">
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Production
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Dev
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Beta
                            </li>
                          </ul>
                        </li>
                        <li className="group relative px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Academic
                          <ul className="absolute right-full top-0 mr-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg hidden group-hover:block transition-all duration-300">
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Login Grade
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Login Grade Memory
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Login Academic
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                              Login Dev Academic
                            </li>
                          </ul>
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Accounting Dev
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Login Library
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Login Canteen
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Login Kindergarten
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          Edit
                        </li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            children={undefined}
          />
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
