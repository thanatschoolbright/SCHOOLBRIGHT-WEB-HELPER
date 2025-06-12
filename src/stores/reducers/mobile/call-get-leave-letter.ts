import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestLeaveLetter } from "@stores/type";
import { CallAPI } from "@stores/actions/mobile/call-get-leave-letter";

const initialState: RequestLeaveLetter = {
  draftValues: {
    user_id: "",
    page: "1",
  },
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      SchoolID: 0,
      letterId: 0,
      status: "",
      letterSubmitDate: "",
      letterType: "",
      letterTypeEN: "",
      senderName: "",
      senderNameEN: "",
      userType: "",
      ApprovedStatus: {
        StatusCode: 0,
        TextEN: "",
        TextTH: "",
        ApprovalAmount: 0,
      },
    },
    curl: "",
  },
};

const Slice = createSlice({
  name: "callGetLeaveLetterList",
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
