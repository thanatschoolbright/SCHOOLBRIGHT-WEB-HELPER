import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestNotificationReadMessage } from "@stores/type";
import { CallAPI } from "@stores/actions/mobile/call-get-read-notification";

const initialState: RequestNotificationReadMessage = {
  draftValues: {
    message_id: "",
    user_id: "",
  },
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      sMessage: "",
      sTitle: "",
      nMessageID: 0,
      dSend: "",
      nStatus: 0,
      nType: 0,
      push_id: null,
      scheduled_id: "",
      homework_id: null,
      homework: {
        dayend: null,
        daynotification: null,
        daystart: null,
        detail: null,
        planename: null,
        teachername: null,
        SchoolID: 0,
      },
      sell_id: null,
      file: false,
      letter_id: null,
      school_id: 0,
      logo: null,
      letter_status: null,
      LogStatus: 0,
      replyButtons: undefined,
      replyResult: undefined,
      replyStatus: false,
      fileUploads: undefined,
      NewsCreatedBy: undefined,
      ReplyType: "",
    },
    curl: "",
    loading: false,
    error: "",
    success: "",
    response: undefined,
  },
};

const Slice = createSlice({
  name: "callGetReadNotification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(CallAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(CallAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
        state.success = "successfully";
      })
      .addCase(CallAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "An unknown error occurred";
      });
  },
});

export default Slice.reducer;
