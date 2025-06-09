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
import callGetuserBySchoolIdReducer from "@stores/reducers/school/call-get-user";
import callRefreshTokenReducer from "@stores/reducers/authentication/call-refresh-token";
import callGetNotificationReducer from "@stores/reducers/mobile/call-get-notification";
import callAdminLoginReducer from "@stores/reducers/authentication/call-get-login-admin";
import callGetNotificationMessageReducer from "@stores/reducers/mobile/call-get-read-notification";
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
    callGetuserBySchoolId: callGetuserBySchoolIdReducer,
    callRefreshToken: callRefreshTokenReducer,
    callGetNotification: callGetNotificationReducer,
    callAdminLogin: callAdminLoginReducer,
    callGetNotificationMessage: callGetNotificationMessageReducer,
  },
});

// ? : อธิบาย : store และ configureStore ใน redux toolkit
export type RootState = ReturnType<typeof store.getState>;
// ? : อธิบาย : AppDispatch ใน redux toolkit
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
