import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestNotification } from "@stores/type";
import { CallAPI } from "@/stores/actions/mobile/call-get-notification-today-list";

const initialState: RequestNotification = {
  draftValues: {
    page: "",
    user_id: "",
  },
  loading: false,
  error: "",
  success: "",
  response: {},
};

const Slice = createSlice({
  name: "callGetNotificationWeekList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(CallAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(CallAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.response.data = action.payload;
        state.success = "successfully";
      })
      .addCase(CallAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "An unknown error occurred";
      });
  },
});

export default Slice.reducer;
