"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { InputFieldComponent } from "@/components/input-field/input-field-component";
import MinimalButton from "@/components/button/minimal-button-component";
import { FiCreditCard } from "react-icons/fi";
import { CallAPI } from "@/stores/actions/form-card-nfc-action";
import { Toaster, toast } from "sonner";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";

export default function DashboardPage() {
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
        toast.error("Error", {
          description: "กรุณากรอกข้อมูลให้ครบถ้วน",
          duration: 5000,
          position: "bottom-center",
        });
        setModal("");
        break;
      case "success":
        toast.success("Success", {
          description: "ยิง API สำเร็จ",
          duration: 4000,
          position: "bottom-center",
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
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message || "ไม่สามารถดำเนินการได้",
        duration: 6000,
        position: "bottom-center",
      });
    }
  };

  // #endregion

  return (
    <DashboardLayout>
      <Toaster richColors position="bottom-center" closeButton />
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* บังคับให้ card แรกอยู่เต็มความกว้างใน md และ xl */}

        <ContentCard
          title="ค้นหาบัตร NFC "
          fullWidth
          className="md:col-span-2 xl:col-span-4 w-full"
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
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

            {/* Input NFC Card */}
            <InputFieldComponent
              label="กรอกรหัส NFC Card"
              type="text"
              required
              icon={<FiCreditCard />}
              value={formState.nfc_card}
              onChange={(e) =>
                setFormState({ ...formState, nfc_card: e.target.value })
              }
              error={
                formState.nfc_card.length < 1 ? "กรุณากรอกรหัส NFC Card" : ""
              }
              placeholder="กรุณากรอกรหัส NFC Card"
            />

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
                  toast.success("Copied!", {
                    description: "Response copied to clipboard.",
                    duration: 2000,
                    position: "bottom-center",
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
                  toast.success("Copied!", {
                    description: "Copy CURL to clipboard.",
                    duration: 2000,
                    position: "bottom-center",
                  });
                }}
              >
                Copy CURL
              </MinimalButton>
            </div>
          </div>
        </ContentCard>

        {/* หมายเหตุ */}
        <div className="grid grid-cols-2 gap-3">
          <ContentCard
            title="หมายเหตุ (1)"
            className="col-span-1 row-span-1 w-full"
          >
            <p className="text-sm text-red-500">
              {t(
                "กรณีที่บัตร NFC ไม่ถูกต้อง หรือไม่พบข้อมูลในระบบ จะมีการแสดงผลลัพธ์เป็น JSON ที่มี status เป็น 'not have number id'"
              )}
            </p>
          </ContentCard>
          <ContentCard
            title="หมายเหตุ (2)"
            className="col-span-1 row-span-1 w-full"
          >
            <p className="text-sm text-red-500">
              {t(
                "กรณีที่ไม่พบข้อมูลใน https://www.canteen.schoolbright.co แต่พบข้อมูลที่นี่ แปลว่าเป็นปัญหาที่ Memory Sharing ของระบบ Canteen Web ให้แจ้ง Vimal"
              )}
            </p>
          </ContentCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
