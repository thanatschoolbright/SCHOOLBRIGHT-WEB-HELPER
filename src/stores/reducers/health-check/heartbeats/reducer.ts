import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestHeartbeats } from "@stores/type";
import { CallAPI } from "@stores/actions/health-check/heartbeats/action";

const initialState: RequestHeartbeats = {
  draftValues: {},
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      status: 0,
      message_th: "",
      message_en: "",
      data: []
    }
  },
};

const Reducer = createSlice({
  name: "CallGetHeartBeatsAction",
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

export default Reducer.reducer;
