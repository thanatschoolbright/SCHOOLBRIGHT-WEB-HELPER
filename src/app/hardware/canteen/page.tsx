"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";

import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { MinimalRow } from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import DropdownButtonComponent from "@components/button/dropdown-button-component";
import { CallAPI as GET_APPLICATION_LIST } from "@stores/actions/hardware/canteen/call-get-application";
import { CallAPI as GET_APPLICATION_VERSION_BY_APPID } from "@stores/actions/hardware/canteen/call-get-application-by-appId";
import { CallAPI as POST_CREATE_APPLICATION_VERSION } from "@stores/actions/hardware/canteen/call-post-create-application-version";
import { CallAPI as POST_UPDATE_APPLICATION_VERSION } from "@stores/actions/hardware/canteen/call-post-update-application-version";
import { setDraftValues as setDraftValuesCallPostCreateApplicationVersion } from "@stores/reducers/hardware/canteen/call-post-create-application-version";
import { setDraftValues as setDraftValuesCallGetApplicationByAppId } from "@stores/reducers/hardware/canteen/call-get-application-by-appId";
import {
  RequestCreateApplicationVersion,
  ResponseApplicationList,
  ResponseApplicationVersionList,
} from "@stores/type";
import ModalComponent from "@components/modal/modal-component";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import RoundedButton from "@/components/button/rounded-button-component";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
import InputComponent from "@/components/input-field/input-component";
import UploadComponent from "@/components/input-field/upload-component";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";
import Swal from "sweetalert2";
const TableHardwareApplicationList = ({
  data,
  openVersionModal,
}: {
  data: ResponseApplicationList["data"]["data"];
  openVersionModal: (
    data: ResponseApplicationList["data"]["data"][number]
  ) => void;
}) => {
  return (
    <>
      {data.map((row, idx) => (
        <MinimalRow key={`${row.app_id}-${idx}`}>
          {({ index }) => (
            <>
              <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
                {index}
              </td>
              <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
                {row.app_id}
              </td>
              <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
                {row.app_name}
              </td>
              <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
                {row.app_type}
              </td>
              <td className="p-4">
                <span className="inline-flex">
                  <DropdownButtonComponent
                    id={row.app_id}
                    items={[
                      {
                        label: "ดูเวอร์ชัน",
                        onClick: () => openVersionModal(row),
                      },
                    ]}
                  />
                </span>
              </td>
            </>
          )}
        </MinimalRow>
      ))}
    </>
  );
};

const TableHardwareVersionByAppIdList: React.FC<{
  data: ResponseApplicationVersionList["data"]["data"];
  setShowEditVersionModal: (type: string) => void;
}> = ({ data, setShowEditVersionModal }) => {
  const dispatch = useDispatch<AppDispatch>();
  const STATE_HARDWARE_APPLICATION_BY_APP_ID = useAppSelector(
    (state) => state.callGetHardwareApplicationByAppId
  );
  return (
    <>
      {data.map((v: any, idx: number) => (
        <MinimalRow key={`${v.version_id}-${idx}`} row={v} index={idx + 1}>
          {({ row, index }) => (
            <>
              <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
                {index}
              </td>
              <td className="p-4">{row.version_name}</td>
              <td className="p-4">{row.env}</td>
              <td className="p-4">
                {row.updated_at
                  ? new Date(row.updated_at).toLocaleString("th-TH")
                  : "-"}
              </td>
              <td className="p-4">
                <span className="inline-flex">
                  <DropdownButtonComponent
                    id={row.version_id}
                    items={[
                      {
                        label: "ดาวน์โหลด",
                        onClick: () => console.log("ดาวน์โหลด", row.version_id),
                      },
                      {
                        label: "แก้ไข",
                        onClick: () => {
                          console.log("แก้ไข", row.version_id);
                          setShowEditVersionModal("edit");
                          dispatch(
                            setDraftValuesCallPostCreateApplicationVersion({
                              versionID: row.version_id ?? "",
                              appID:
                                (STATE_HARDWARE_APPLICATION_BY_APP_ID as any)
                                  ?.draftValues?.app_id ?? "",
                              versionName: row.version_name ?? "",
                              env: row.env ?? "",
                              note: row.note ?? "",
                              file: null,
                              schoolID: "",
                            })
                          );
                        },
                      },
                      {
                        label: "ลบ",
                        onClick: () => console.log("ลบ", row.version_id),
                        textColor: "text-red-500",
                      },
                    ]}
                  />
                </span>
              </td>
            </>
          )}
        </MinimalRow>
      ))}
    </>
  );
};

const isFormValid = (form: {
  schoolID: string | string[];
  appID: string;
  versionName: string;
  env: string;
  note: string;
  file: File | null;
}): boolean => {
  const { schoolID, appID, versionName, env, note, file } = form;
  return (
    schoolID !== "" &&
    appID !== "" &&
    versionName !== "" &&
    env !== "" &&
    file !== null
  );
};

const buildFormData = (form: RequestCreateApplicationVersion["draftValues"]): FormData => {
  const formData = new FormData();
  formData.append("school_id", form.schoolID.toString());
  formData.append("app_id", form.appID);
  formData.append("version_name", form.versionName);
  formData.append("env", form.env);
  formData.append("note", form.note);
  formData.append("version_id", form.versionID ?? "");
  if (form.file) {
    formData.append("file", form.file);
  }
  return formData;
};

const AddOrEditVersionModal: React.FC<{
  isOpenModal: boolean;
  setIsOpenModal: (isOpen: boolean) => void;
  schoolList: any[];
  appIdList: any[];
  type: string;
}> = ({
  isOpenModal,
  setIsOpenModal,
  schoolList,
  appIdList,

  type,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION = useAppSelector(
    (state) => state.callPostCreateApplicationVersion
  );

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<{
    schoolID: string | string[];
    versionID: string | null;
    appID: string;
    versionName: string;
    env: string;
    note: string;
    file: File | null;
  }>({
    schoolID: "",
    versionID: STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionID?.toString() || "",
    appID:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.appID?.toString() ||
      "",
    versionName:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
        .versionName,
    env: STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.env,
    note:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.note ||
      "",
    file: null,
  });

  useEffect(() => {
    console.log(
      "✅ [STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION]",
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
    );
    if (type === "edit") {
      setForm({
        ...form,
        appID:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.appID?.toString() ||
          "",
        versionName:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
            .versionName,
        env: STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
          .env,
        note:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
            .note || "",
      });
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid(form)) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:`กรุณากรอกข้อมูลให้ครบถ้วน ${JSON.stringify(form)}`,
      });
      return;
    }

    const formData = buildFormData(form);

    try {
      setIsLoading(true);
      let resultAction: any;
      if (type === "add"){
        resultAction = await dispatch(
          POST_CREATE_APPLICATION_VERSION(formData)
        );
      } else if (type === "edit"){
        resultAction = await dispatch(
          POST_UPDATE_APPLICATION_VERSION(formData)
        );
      } 
      setIsLoading(false);
      if (
        (type === "add" && POST_CREATE_APPLICATION_VERSION.fulfilled.match(resultAction)) ||
        (type === "edit" && POST_UPDATE_APPLICATION_VERSION.fulfilled.match(resultAction)) &&
        resultAction.payload?.data?.status !== "failed"
      ) {
        Swal.fire({ 
          icon: "success",
          title: "สำเร็จ",
          html:
            `${resultAction.payload?.data?.message} <br> version id : ${resultAction.payload?.data?.version_id}`  ||
            "สร้างเวอร์ชันแอปพลิเคชันสำเร็จ",
        });
        setIsOpenModal(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text:
            resultAction.payload?.data?.message ||
            resultAction?.payload?.error?.message ||
            "เกิดข้อผิดพลาดในการสร้างเวอร์ชันแอปพลิเคชัน",
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err?.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      });
    }
  };

  const envOptions = [
    { label: "เลือกรายการ", value: "" },
    { label: "Production", value: "production" },
    { label: "Beta", value: "beta" },
  ];

  return (
    <ModalComponent
      isOpen={isOpenModal}
      title={
        type === "add"
          ? "เพิ่มเวอร์ชันแอปพลิเคชัน"
          : `แก้ไขเวอร์ชันแอปพลิเคชัน ${STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionName} (version id : ${STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionID})`
      }
      onClose={() => setIsOpenModal(false)}
    >
      {isLoading && <BaseLoadingComponent />}
      <div className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-4"
          encType="multipart/form-data"
          onSubmit={handleSubmit}
        >
          <SearchableSelectComponent
            label="เลือกโรงเรียน"
            id="school_id"
            name="school_id"
            multiselect={false}
            required={true}
            options={[
              { label: "เลือกรายการ", value: "" },
              ...schoolList.map((s: any) => ({
                label: s.label + " (" + s.value + ")",
                value: String(s.value),
              })),
            ]}
            value={form.schoolID}
            onChange={(value: string | string[]) => {
              setForm({
                ...form,
                schoolID: value,
              });
            }}
            placeholder="เลือกโรงเรียน"
            error={
              (typeof form.schoolID === "string" && form.schoolID === "") ||
              (Array.isArray(form.schoolID) && form.schoolID.length === 0)
                ? "กรุณาเลือกโรงเรียน"
                : ""
            }
          />
          {appIdList.length > 0 && (
            <SearchableSelectComponent
              label="เลือก App ID"
              id="app_id"
              name="app_id"
              options={appIdList}
              value={form.appID}
              multiselect={false}
              required={true}
              onChange={(value: string | string[]) => {
                setForm({
                  ...form,
                  appID: Array.isArray(value) ? value[0] : value,
                });
              }}
              placeholder="เลือก App ID"
              error={form.appID === "" ? "กรุณาเลือก App ID" : ""}
            />
          )}

          <InputComponent
            label="ชื่อเวอร์ชัน (version_name)"
            id="version_name"
            name="version_name"
            value={form.versionName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setForm({ ...form, versionName: event.target.value });
            }}
            type="text"
            required
            placeholder="ชื่อเวอร์ชัน เช่น 1.0.0"
            error={form.versionName === "" ? "กรุณาระบุชื่อเวอร์ชัน" : ""}
          />
          <SearchableSelectComponent
            label="เลือกสภาพแวดล้อม (Environment)"
            options={envOptions}
            value={form.env}
            onChange={(value: string | string[]) => {
              setForm({
                ...form,
                env: Array.isArray(value) ? value[0] : value,
              });
            }}
            placeholder="เลือกสภาพแวดล้อม"
            error={form.env === "" ? "กรุณาเลือกสภาพแวดล้อม" : ""}
          />
          <InputComponent
            label="หมายเหตุ (note)"
            id="note"
            name="note"
            type="text"
            value={form.note}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setForm({ ...form, note: event.target.value });
            }}
            placeholder="หมายเหตุ"
          />
          <UploadComponent
            label="ไฟล์แอป (.apk หรือ .zip)"
            id="file"
            name="file"
            accept=".apk,.zip"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setForm({ ...form, file: event.target.files?.[0] || null });
            }}
            error={form.file === null ? "กรุณาเลือกไฟล์แอป" : ""}
          />
          <button
            type="submit"
            className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            บันทึกเวอร์ชัน
          </button>
        </form>
      </div>
    </ModalComponent>
  );
};

// 🧾 คอลัมน์ของตาราง
const columns: { key: string; label: string }[] = [
  { key: "app_id", label: "APP ID" },
  { key: "app_name", label: "ชื่อแอปพลิเคชัน" },
  { key: "app_type", label: "แพลตฟอร์ม" },
  { key: "action", label: "การกระทำ" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();

  const [applicationList, setApplicationList] = useState<
    ResponseApplicationList["data"]["data"]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] =
    useState<boolean>(false);
  const [selectedAppData, setSelectedAppData] =
    useState<ResponseApplicationList["data"]["data"][number]>();
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showAddOrEditApplicationModal, setShowAddOrEditApplicationModal] =
    useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  
  

  const STATE_HARDWARE_APPLICATION = useAppSelector(
    (state) => state.callGetHardwareApplication
  );

  const STATE_HARDWARE_APPLICATION_BY_APP_ID = useAppSelector(
    (state) => state.callGetHardwareApplicationByAppId
  );

  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);

  const isLoading = [STATE_HARDWARE_APPLICATION_BY_APP_ID.loading].some(
    Boolean
  );

  useEffect(() => {
    if (showAddOrEditApplicationModal === "edit") {
      setIsModalOpen(false);
    }
  }, [showAddOrEditApplicationModal]);

  useEffect(() => {
    setIsPasswordModalOpen(true);
  }, []);

  // 🔄 โหลดข้อมูลรายชื่อโรงเรียน
  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName,
        value: item.SchoolID,
      })) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  // 🚀 โหลดข้อมูลตอนเปิดหน้า (และไม่โหลดซ้ำเมื่อ Modal เปิด)
  useEffect(() => {
    if (!isModalOpen && applicationList.length === 0) {
      dispatch(GET_APPLICATION_LIST()).unwrap();
    }
  }, [isModalOpen]);

  // 🔄 แปลงข้อมูลจาก Redux เป็นรูปแบบที่ต้องการสำหรับตาราง
  useEffect(() => {
    const rawList = STATE_HARDWARE_APPLICATION?.response?.data?.data || [];

    const transformed = rawList.map(
      (item: ResponseApplicationList["data"]["data"][number]) => ({
        app_name: item.app_name,
        app_id: item.app_id,
        app_type: item.app_type,
      })
    );

    setApplicationList(transformed);
  }, [STATE_HARDWARE_APPLICATION?.response]);

  useEffect(() => {
    console.log(
      "✅ [STATE_HARDWARE_APPLICATION_BY_APP_ID]",
      STATE_HARDWARE_APPLICATION_BY_APP_ID.response.data.data
    );
  }, [STATE_HARDWARE_APPLICATION_BY_APP_ID]);

  const openVersionModal = async (
    data: ResponseApplicationList["data"]["data"][number]
  ) => {
    await dispatch(
      setDraftValuesCallGetApplicationByAppId({ app_id: data.app_id })
    );
    await dispatch(GET_APPLICATION_VERSION_BY_APPID({ app_id: data.app_id })); // เรียก API เพื่อดึงข้อมูลเวอร์ชัน
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* 🔘 ปุ่มเพิ่มเติมในอนาคต */}
        <div className="flex justify-end mb-4">
          <RoundedButton
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            iconLeft={<FiPlus className="w-4 h-4" />}
            onClick={() => {
              setShowAddOrEditApplicationModal("add")
            }}
          >
            เพิ่มแอปพลิเคชัน
          </RoundedButton>
        </div>

        {/* 📋 รายการแอปพลิเคชัน */}
        <ContentCard
          title="รายการแอปพลิเคชัน"
          className="xl:col-span-4 w-full"
          isLoading={STATE_HARDWARE_APPLICATION.loading}
        >
          <MinimalTable
            key="application-list"
            isLoading={STATE_HARDWARE_APPLICATION.loading}
            header={columns}
            data={applicationList}
            rowsPerPage={10}
            onRowsPerPageChange={() => {}}
            hiddenProps={false}
          >
            <TableHardwareApplicationList
              data={applicationList}
              openVersionModal={openVersionModal}
            />
          </MinimalTable>
        </ContentCard>
      </div>

      {/* Modal ใส่รหัสผ่านก่อนเปิด AddApplicationModal */}
      <ModalComponent
        isOpen={isPasswordModalOpen}
        title="💬 กรุณาใส่รหัสผ่านก่อนเปิดหน้า"
        onClose={() => setIsPasswordModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <InputComponent
            id="password"
            type="password"
            label="🔒 รหัสผ่าน"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="กรอกรหัสผ่าน"
          />
          {passwordError && (
            <div className="text-red-500 text-sm">{passwordError}</div>
          )}
          <div className="flex justify-end gap-2">
            <RoundedButton
              type="button"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordInput("");
                setPasswordError("");
              }}
              iconLeft={<FiX className="w-4 h-4" />}
            >
              ยกเลิก
            </RoundedButton>
            <RoundedButton
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              iconLeft={<FiCheck className="w-4 h-4" />}
              onClick={async () => {
                const correctPassword = "canteenadmin";
                if (passwordInput === correctPassword) {
                  setIsPasswordModalOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                  Swal.fire({
                    icon: "success",
                    title: "สำเร็จ",
                    text: "รหัสผ่านถูกต้อง",
                  });

                } else {
                  setPasswordError("รหัสผ่านไม่ถูกต้อง");
                }
              }}
              disabled={!passwordInput}
            >
              ตกลง
            </RoundedButton>
          </div>
        </div>
      </ModalComponent>

      {/* Modal สำหรับ AddApplicationModal จริง */}
      <AddOrEditVersionModal
        type={showAddOrEditApplicationModal}
        isOpenModal={showAddOrEditApplicationModal !== ""}
        setIsOpenModal={(isOpen) => setShowAddOrEditApplicationModal("")}
        schoolList={schoolList}
        appIdList={
          STATE_HARDWARE_APPLICATION.response?.data?.data?.map(
            (item: ResponseApplicationList["data"]["data"][number]) => ({
              label: `${item.app_name} (${item.app_id})`,
              value: String(item.app_id),
            })
          ) || []
        }
      />

      <ModalComponent
        isOpen={isModalOpen}
        title={`เวอร์ชันของ ${selectedAppData?.app_name}`}
        onClose={() => {
          setIsModalOpen(false);
        }}
      >
        <MinimalTable
          key={`version-table-${selectedAppData?.app_name}`}
          isLoading={STATE_HARDWARE_APPLICATION_BY_APP_ID.loading}
          header={[
            { key: "version_name", label: "เวอร์ชัน" },
            { key: "env", label: "สภาพแวดล้อม" },
            { key: "updated_at", label: "อัปเดตเมื่อ" },
            { key: "action", label: "การกระทำ" },
          ]}
          data={STATE_HARDWARE_APPLICATION_BY_APP_ID.response?.data?.data || []}
          rowsPerPage={10}
          onRowsPerPageChange={() => {}}
          hiddenProps={false}
        >
          <TableHardwareVersionByAppIdList
            data={
              STATE_HARDWARE_APPLICATION_BY_APP_ID.response?.data?.data || []
            }
            setShowEditVersionModal={(type: string) => {
            
              setShowAddOrEditApplicationModal(type);

            }}
            
          />
        </MinimalTable>
      </ModalComponent>
    </DashboardLayout>
  );
}
