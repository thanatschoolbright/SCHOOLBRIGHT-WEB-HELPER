import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CallAPI } from "@stores/actions/hardware/canteen/call-post-create-application-version";
import { RequestCreateApplicationVersion } from "@stores/type";

const initialState: RequestCreateApplicationVersion = {
  draftValues: {
    schoolID: [],
    appID: "",
    versionName: "",
    versionID: "",
    env: "",
    note: "",
    file: null,
    isLatestVersion: 0,
    forceUpdate: "",
  },
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      status: "",
      message: "",
      version_id: "",
    },
  },
};

const Slice = createSlice({
  name: "CallPostCreateApplicationVersionSlice",
  initialState,
  reducers: {
    setDraftValues: (
      state,
      action: PayloadAction<RequestCreateApplicationVersion["draftValues"]>
    ) => {
      return {
        ...state,
        draftValues: {
          ...state.draftValues,
          ...action.payload,
        },
      };
    },
  },
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

export const { setDraftValues } = Slice.actions;
export default Slice.reducer;
