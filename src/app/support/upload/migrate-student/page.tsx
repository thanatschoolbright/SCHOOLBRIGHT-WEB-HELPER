"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import MinimalButton from "@/components/button/minimal-button-component";
import { CallAPI } from "@/stores/actions/form-card-nfc-action";
import Swal from "sweetalert2";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";
import UploadFileComponent from "@/components/upload/upload-file-component";

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const NFCstate = useAppSelector((state) => state.formCardNfc);
  const SCHOOLstate = useAppSelector((state) => state.callSchoolList);
  const [show, setShow] = useState<string | string[]>("");
  const [formState, setFormState] = useState<any>({
    nfc_card: NFCstate.draftValues.nfc_card,
    school_id: NFCstate.draftValues.school_id,
  });
  const isLoading = NFCstate.loading;
  const [modal, setModal] = useState<string>("");
  const [schoolList, setSchoolList] = useState<any[]>([]);

  useEffect(() => {
    switch (modal) {
      case "error":
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "กรุณากรอกข้อมูลให้ครบถ้วน",
          confirmButtonText: "OK",
        });
        setModal("");
        break;
      case "success":
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "ยิง API สำเร็จ",
          confirmButtonText: "ยืนยัน",
        });
        setModal("");
        break;
      default:
        break;
    }
  }, [modal]);

  useEffect(() => {
    setSchoolList(
      SCHOOLstate?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName,
        value: item.SchoolID,
      })) || []
    );
  }, [SCHOOLstate?.response]);

  useEffect(() => {
    console.log("schoolList", schoolList);
  }, [schoolList]);

  // #region : State
  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formState.nfc_card || !formState.school_id) {
      return setModal("error");
    }
    try {
      await dispatch(
        CallAPI({
          draftValues: formState,
        })
      ).unwrap(); // <== ดึงผลลัพธ์ออก หรือ throw error
      setModal("success");
    } catch (error: any) {
      console.error("API error:", error);

      // คุณสามารถแสดง error จาก response จริงได้ เช่น message
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถดำเนินการได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // #endregion

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* บังคับให้ card แรกอยู่เต็มความกว้างใน md และ xl */}

        <ContentCard
          title="อัปโหลดการย้ายข้อมูลนักเรียน (User Balance)"
          fullWidth
          className="w-full"
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 mt-[2rem]">
              <div className=" flex flex-col gap-4">
                <UploadFileComponent />
              </div>
            </div>
            <div className="">
              <SearchableSelectComponent
                label="เลือกโรงเรียน"
                options={[
                  { label: "Select Option", value: "" },
                  ...schoolList.map((school) => ({
                    label: school.label + " (" + school.value + ")",
                    value: school.value,
                  })),
                ]}
                value={show}
                onChange={(val) => {
                  setFormState({ ...formState, school_id: val });
                  setShow(val);
                }}
                placeholder="เลือกโรงเรียน"
              />
            </div>

            {/* ปุ่ม ยืนยัน / ยกเลิก */}
            <div className="flex items-center gap-4">
              <MinimalButton
                type="submit"
                textSize="base"
                className="bg-green-500 hover:bg-green-600"
                isLoading={isLoading}
              >
                ยืนยัน
              </MinimalButton>

              <MinimalButton
                type="button"
                textSize="base"
                className="bg-red-500 hover:bg-red-600"
                isLoading={false}
              >
                ยกเลิก
              </MinimalButton>
            </div>
          </form>
        </ContentCard>

        {/* Reponse From Server */}
        <ContentCard
          title="Response"
          fullWidth
          className={`md:col-span-2 xl:col-span-4 w-full overflow-hidden ${
            NFCstate.response.data ? "block" : "hidden"
          }`}
        >
          <div className="space-y-4 overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              <code>
                {JSON.stringify(NFCstate.response.data?.data, null, 2)}
              </code>
            </pre>
            <div className="flex flex-col md:flex-row gap-4">
              {/* COPY RESPONSE */}
              <MinimalButton
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(NFCstate.response.data?.data, null, 2)
                  );
                  Swal.fire({
                    icon: "success",
                    title: "Copied!",
                    text: "Response copied to clipboard.",
                    confirmButtonText: "OK",
                  });
                }}
              >
                Copy Response
              </MinimalButton>

              {/* CURL */}
              <MinimalButton
                className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={() => {
                  const curlCommand = NFCstate.response.data?.curl;
                  navigator.clipboard.writeText(curlCommand.toString());
                  Swal.fire({
                    icon: "success",
                    title: "Copied!",
                    text: "Copy CURL to clipboard.",
                    confirmButtonText: "OK",
                  });
                }}
              >
                Copy CURL
              </MinimalButton>
            </div>
          </div>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
