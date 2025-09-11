import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
// Reducers
import newman from "@stores/reducers/call-newman";
import formCardNfc from "@stores/reducers/form-card-nfc";
import callSchoolList from "@stores/reducers/call-school-list";
import callCancelSales from "@stores/reducers/call-cancel-sales";
import callGetRegisterDevice from "@stores/reducers/hardware/call-get-register-device";
import callPostOnlineDevice from "@stores/reducers/hardware/call-post-online-device";
import callPostOfflineDevice from "@stores/reducers/hardware/call-post-offline-device";
import callGetOnlineDevice from "@stores/reducers/hardware/call-get-online-device";
import callGetServerStatus from "@stores/reducers/server/call-get-server-status";
import callGetServerStatusV2 from "@stores/reducers/server/call-get-server-status.v2";
import callGetuserBySchoolId from "@stores/reducers/school/call-get-user";
import callRefreshToken from "@stores/reducers/authentication/call-refresh-token";
import callGetNotificationTodayList from "@stores/reducers/mobile/call-get-notification-today-list";
import callGetNotificationWeekList from "@stores/reducers/mobile/call-get-notification-week-list";
import callAdminLogin from "@stores/reducers/authentication/call-get-login-admin";
import callGetNotificationMessage from "@stores/reducers/mobile/call-get-read-notification";
import callGetLeaveLetterList from "@stores/reducers/mobile/call-get-leave-letter";
import callGetSchooListDetail from "@stores/reducers/support/call-get-school-list-detail";
import callGetHardwareApplication from "@stores/reducers/hardware/canteen/call-get-application";
import callGetHardwareApplicationByAppId from "@stores/reducers/hardware/canteen/call-get-application-by-appId";
import callPostCreateApplicationVersion from "@stores/reducers/hardware/canteen/call-post-create-application-version";
import callPostUpdateApplicationVersion from "@stores/reducers/hardware/canteen/call-post-update-application-version";
import callPostStatistic from "@stores/reducers/mobile/call-post-statistic";
import callVersionControlReducer from "@stores/reducers/health-check/version-control/reducer";
import callQRCodeHealthCheckReducer from "@stores/reducers/mobile/qrcode-health-check/reducer";
import loginReucerV2 from "@stores/reducers/authentication/sign-in/reducer";
import heartbeatReducer from "@stores/reducers/health-check/heartbeats/reducer";

export const store = configureStore({
  reducer: {
    newman,
    formCardNfc,
    callCancelSales,
    callSchoolList,
    callGetRegisterDevice,
    callPostOnlineDevice,
    callPostOfflineDevice,
    callGetOnlineDevice,
    callGetServerStatus,
    callGetServerStatusV2,
    callGetuserBySchoolId,
    callRefreshToken,
    callGetNotificationWeekList,
    callGetNotificationTodayList,
    callAdminLogin,
    callGetNotificationMessage,
    callGetLeaveLetterList,
    callGetSchooListDetail,
    callGetHardwareApplication,
    callGetHardwareApplicationByAppId,
    callPostCreateApplicationVersion,
    callPostUpdateApplicationVersion,
    callPostStatistic,
    callVersionControlReducer,
    callQRCodeHealthCheckReducer,
    loginReucerV2,
    heartbeatReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

// RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
