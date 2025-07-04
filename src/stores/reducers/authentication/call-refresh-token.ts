import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {RequestRefreshToken} from "@stores/type";
import {CallAPI} from "@stores/actions/authentication/call-post-refresh-token";

const initialState: RequestRefreshToken = {
    draftValues: {
        school_id: "849",
        user_id: "1230332",
        token: "",
    },
    loading: false,
    error: "",
    success: "",
    response: {},
};

const Slice = createSlice({
    name: "callRefreshToken",
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
