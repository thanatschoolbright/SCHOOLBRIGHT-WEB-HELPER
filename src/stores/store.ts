import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
// #region : reducer
import newmanReducer from "@stores/reducers/call-newman";
import formCardNfcReducer from "@stores/reducers/form-card-nfc";
import callSchoolListReducer from "@stores/reducers/call-school-list";
import callCancelSalesReducer from "@stores/reducers/call-cancel-sales";
import callGetRegisterDeviceReducer from "@stores/reducers/hardware/call-get-register-device";
import callPostOnlineDeviceReducer from "@stores/reducers/hardware/call-post-online-device";
import callPostOfflineDeviceReducer from "@stores/reducers/hardware/call-post-offline-device";
import callGetOnlineDeviceReducer from "@stores/reducers/hardware/call-get-online-device";
import callGetServerStatusReducer from "@stores/reducers/server/call-get-server-status";
import callGetServerStatusV2Reducer from "@stores/reducers/server/call-get-server-status.v2";
import callGetuserBySchoolIdReducer from "@stores/reducers/school/call-get-user";
import callRefreshTokenReducer from "@stores/reducers/authentication/call-refresh-token";
import callGetNotificationTodayListReducer from "@/stores/reducers/mobile/call-get-notification-today-list";
import callGetNotificationWeekListReducer from "@/stores/reducers/mobile/call-get-notification-week-list";
import callAdminLoginReducer from "@stores/reducers/authentication/call-get-login-admin";
import callGetNotificationMessageReducer from "@stores/reducers/mobile/call-get-read-notification";
import callGetLeaveLetterListReducer from "@stores/reducers/mobile/call-get-leave-letter";
import callGetSchooListDetailReducer from "@stores/reducers/support/call-get-school-list-detail";
import callGetHardwareApplicationReducer from "@stores/reducers/hardware/canteen/call-get-application";
import callGetHardwareApplicationByAppIdReducer from "@stores/reducers/hardware/canteen/call-get-application-by-appId";
import callPostCreateApplicationVersionReducer from "@stores/reducers/hardware/canteen/call-post-create-application-version";
import callPostUpdateApplicationVersionReducer from "@stores/reducers/hardware/canteen/call-post-update-application-version";
import callPostStatisticReducer from "@stores/reducers/mobile/call-post-statistic";
import callVersionControlReducer from "@stores/reducers/health-check/version-control/reducer";
import callQRCodeHealthCheckReducer from "@stores/reducers/mobile/qrcode-health-check/reducer";
import loginReucerV2 from "@stores/reducers/authentication/sign-in/reducer";
// #endregion

export const store = configureStore({
  reducer: {
    newman: newmanReducer,
    formCardNfc: formCardNfcReducer,
    callCancelSales: callCancelSalesReducer,
    callSchoolList: callSchoolListReducer,
    callGetRegisterDevice: callGetRegisterDeviceReducer,
    callPostOnlineDevice: callPostOnlineDeviceReducer,
    callPostOfflineDevice: callPostOfflineDeviceReducer,
    callGetOnlineDevice: callGetOnlineDeviceReducer,
    callGetServerStatus: callGetServerStatusReducer,
    callGetServerStatusV2: callGetServerStatusV2Reducer,
    callGetuserBySchoolId: callGetuserBySchoolIdReducer,
    callRefreshToken: callRefreshTokenReducer,
    callGetNotificationWeekList: callGetNotificationWeekListReducer,
    callGetNotificationTodayList: callGetNotificationTodayListReducer,
    callAdminLogin: callAdminLoginReducer,
    callGetNotificationMessage: callGetNotificationMessageReducer,
    callGetLeaveLetterList: callGetLeaveLetterListReducer,
    callGetSchooListDetail: callGetSchooListDetailReducer,
    callGetHardwareApplication: callGetHardwareApplicationReducer,
    callGetHardwareApplicationByAppId: callGetHardwareApplicationByAppIdReducer,
    callPostCreateApplicationVersion: callPostCreateApplicationVersionReducer,
    callPostUpdateApplicationVersion: callPostUpdateApplicationVersionReducer,
    callPostStatistic: callPostStatisticReducer,
    callVersionControlReducer,
    callQRCodeHealthCheckReducer,
    loginReucerV2,
  },
});

// ? : อธิบาย : store และ configureStore ใน redux toolkit
export type RootState = ReturnType<typeof store.getState>;
// ? : อธิบาย : AppDispatch ใน redux toolkit
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
