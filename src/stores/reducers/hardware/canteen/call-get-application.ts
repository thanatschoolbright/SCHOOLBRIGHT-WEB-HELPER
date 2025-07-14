import {createSlice} from "@reduxjs/toolkit";
import {CallAPI} from "@stores/actions/hardware/canteen/call-get-application";
import {RequestApplicationList} from "@stores/type";

const initialState: RequestApplicationList = {
    draftValues: {
        Array: [],
    },
    loading: false,
    error: "",
    success: "",
    response: {
        data: {
            status: "",
            data: [],
        }
    },
};

const Slice = createSlice({
    name: "CallGetHardwareApplicationSlice",
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
