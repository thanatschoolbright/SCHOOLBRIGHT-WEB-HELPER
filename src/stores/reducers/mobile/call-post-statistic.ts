import { createSlice } from "@reduxjs/toolkit";
import { RequestStatistic } from "@stores/type";
import { CallAPI } from "@stores/actions/mobile/call-post-statistic";

const initialState: RequestStatistic = {
  draftValues: {
    user_id: "",
    school_id: "",
    start_date: "",
    end_date: "",
  },
  loading: false,
  error: "",
  success: "",
  response: {
    letterId: function (letterId: any): unknown {
      throw new Error("Function not implemented.");
    },
    letterSubmitDate: function (letterSubmitDate: any): unknown {
      throw new Error("Function not implemented.");
    },
    letterType: function (letterType: any): unknown {
      throw new Error("Function not implemented.");
    },
    senderName: function (senderName: any): unknown {
      throw new Error("Function not implemented.");
    },
    userType: function (userType: any): unknown {
      throw new Error("Function not implemented.");
    },
    status: function (status: any): unknown {
      throw new Error("Function not implemented.");
    },
    ApprovedStatus: undefined,
    leaveLetterId: function (leaveLetterId: any): void {
      throw new Error("Function not implemented.");
    },
    data: {
      SchoolID: 0,
      letterId: 0,
      status: "",
      letterSubmitDate: "",
      leaveLetterId: 0,
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
  name: "callPostStatistic",
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
