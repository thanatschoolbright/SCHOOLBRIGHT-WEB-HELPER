"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { AppDispatch, useAppSelector } from "@stores/store";
import { useDispatch } from "react-redux";
import InputComponent from "@components/input-field/input-component";
import { RequestQRCodeGenerator } from "@stores/type";
import DropdownSchoolComponent from "@/components/input-field/school_id/reuse-dropdown-school-component";
import { FiShoppingCart, FiCheckCircle } from "react-icons/fi";
import { FaBahtSign } from "react-icons/fa6";
import RoundedButton from "@/components/button/rounded-button-component";
import { toast } from "sonner";

// Call API
import { CallAPI as POST_QRCODE_HEALTH_CHECK } from "@stores/actions/mobile/qrcode-health-check/action";

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const QR_CODE_HEALTH_CHECK_STATE = useAppSelector(
    (state) => state.callQRCodeHealthCheckReducer
  );

  // filter by selected school
  const isLoading = [SCHOOL_LIST_STATE.loading].some(Boolean);

  const [form, setForm] = useState<RequestQRCodeGenerator["draftValues"]>({
    amount: 0,
    school_id: 0,
    shop_id: 0,
  });

  const handleSubmit = async () => {
    try {
      const response = await dispatch(POST_QRCODE_HEALTH_CHECK(form)).unwrap();
      console.log("response", response?.data);
    } catch (error: any) {
      console.error("ERROR CATCHING : ", error.message);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ", { description: error.message });
    }
  };

  useEffect(() => {
    if (QR_CODE_HEALTH_CHECK_STATE.success) {
      toast.success("ตรวจสอบสำเร็จ", {
        description: JSON.stringify(
          QR_CODE_HEALTH_CHECK_STATE.response?.data?.data,
          null,
          2
        ),
      });
    }
    if (QR_CODE_HEALTH_CHECK_STATE.error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: JSON.stringify(QR_CODE_HEALTH_CHECK_STATE.error, null, 2),
      });
    }
  }, [QR_CODE_HEALTH_CHECK_STATE.success, QR_CODE_HEALTH_CHECK_STATE.error]);

  const getStatusLabel = (status: string | null) => {
    if (status === "success") return "สำเร็จ";
    if (status === "failed") return "ล้มเหลว";
    return status || "-";
  };

  const renderResultContent = () => {
    if (QR_CODE_HEALTH_CHECK_STATE.loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    if (QR_CODE_HEALTH_CHECK_STATE?.response?.data?.data?.results?.length > 0) {
      const result = QR_CODE_HEALTH_CHECK_STATE.response.data.data.results[0];
      return (
        <div className="flex flex-col items-center space-y-4">
          <table className="min-w-full text-sm text-left border">
            <thead>
              <tr>
                <th className="px-4 py-2 font-semibold border">หัวข้อ</th>
                <th className="px-4 py-2 font-semibold border">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 font-medium border">สถานะ</td>
                <td className="px-4 py-2 border">
                  {getStatusLabel(result.status)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">จำนวนเงิน</td>
                <td className="px-4 py-2 border">
                  {result.request_body.txnAmount || form.amount} บาท
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">รหัสโรงเรียน</td>
                <td className="px-4 py-2 border">
                  {result.request_body.reference1}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">รหัสร้านค้า</td>
                <td className="px-4 py-2 border">
                  {result.request_body.merchantId}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">ธนาคาร</td>
                <td className="px-4 py-2 border">{result.bank}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">
                  ระยะเวลาในการรอคำตอบจากธนาคาร
                </td>
                <td className="px-4 py-2 border">
                  {result.response_time} วินาที
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    if (QR_CODE_HEALTH_CHECK_STATE.error) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <table className="min-w-full text-sm text-left border">
            <thead>
              <tr>
                <th className="px-4 py-2 font-semibold border">หัวข้อ</th>
                <th className="px-4 py-2 font-semibold border">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 font-medium border">สถานะ</td>
                <td className="px-4 py-2 border">เกิดข้อผิดพลาด</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">ข้อความ</td>
                <td className="px-4 py-2 border">
                  {QR_CODE_HEALTH_CHECK_STATE.response?.message ||
                    (typeof QR_CODE_HEALTH_CHECK_STATE.error === "string"
                      ? QR_CODE_HEALTH_CHECK_STATE.error
                      : "ไม่สามารถแสดงข้อความข้อผิดพลาดได้")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">รายละเอียด</td>
                <td className="px-4 py-2 border">
                  {QR_CODE_HEALTH_CHECK_STATE.response?.raw?.ExceptionMessage ||
                    "ทางโรงเรียนยังไม่ได้เปิดใช้งานระบบธนาคาร"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium border">ประเภท</td>
                <td className="px-4 py-2 border">
                  {QR_CODE_HEALTH_CHECK_STATE.response?.raw?.ExceptionType ||
                    "ไม่ระบุประเภทข้อผิดพลาด"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    return <p className="text-center text-gray-500">ยังไม่มีผลการตรวจสอบ</p>;
  };

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* Input Field */}
        <ContentCard title="ทดสอบระบบ QR Code" className="xl:col-span-4 w-full">
          {/* Input section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
            {/* School Dropdown */}
            <div className="mb-5">
              <DropdownSchoolComponent
                onChange={(value) => setForm({ ...form, school_id: value })}
                defaultValue={form.school_id}
              />
            </div>
          </div>

          {/* Input section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 relative z-0">
            {/* Shop ID */}
            <InputComponent
              label="รหัสร้านค้า (id)"
              id="shop_id"
              name="shop_id"
              disabled
              value={form.shop_id || 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, shop_id: Number(e.target.value) })
              }
              type="number"
              placeholder="เช่น 1.0.0"
              leftIcon={<FiShoppingCart className="text-gray-400" />}
            />

            {/* Amount */}
            <InputComponent
              label="จำนวนเงิน (บาท)"
              id="amount"
              name="amount"
              value={form.amount || 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              type="number"
              placeholder="กรอกจำนวนเงิน"
              leftIcon={<FaBahtSign className="text-gray-400" />}
            />
          </div>

          <RoundedButton
            type="button"
            className="bg-gray-400 hover:bg-green-500 text-white group transition-all duration-300 mt-5 mx-auto"
            onClick={handleSubmit}
          >
            <span className="flex items-center overflow-hidden">
              <span className="max-w-xs transition-all duration-300 ml-2 whitespace-nowrap">
                ตรวจสอบระบบ QR Code
              </span>
              <span className="opacity-0 max-w-0 -translate-x-2 group-hover:opacity-100 group-hover:max-w-xs group-hover:translate-x-0 transition-all duration-300 flex-shrink-0 me-3">
                <FiCheckCircle className="w-4 h-4 ml-3" />
              </span>
            </span>
          </RoundedButton>
        </ContentCard>

        {QR_CODE_HEALTH_CHECK_STATE?.response?.data?.data?.results?.length >
          0 &&
          (() => {
            const result =
              QR_CODE_HEALTH_CHECK_STATE.response.data.data.results[0];
            return (
              <ContentCard
                title="QR Code จากธนาคาร"
                className="w-1/2 justify-center mx-auto"
              >
                <div className="flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      result.response_body.qrCode
                    )}`}
                    alt="QR Code"
                    className="w-40 h-40 border rounded-lg shadow-md"
                  />
                </div>
              </ContentCard>
            );
          })()}

        <ContentCard
          title="ผลการตรวจสอบ"
          className="w-1/2 justify-center mx-auto"
        >
          {renderResultContent()}
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
