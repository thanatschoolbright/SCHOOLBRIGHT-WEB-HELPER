import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestVersionControl } from "@stores/type";
import { CallAPI } from "@stores/actions/health-check/version-control/action";

const initialState: RequestVersionControl = {
  draftValues: {},
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      data: [],
    },
  },
};

const Reducer = createSlice({
  name: "CallVersionControlAction",
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
