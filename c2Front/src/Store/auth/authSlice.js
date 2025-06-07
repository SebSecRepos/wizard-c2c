import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
    name: 'auth',
    initialState:{
        status: 'checking',   //auth, no-auth
        user_name: {},
        errorMessage: undefined
    },
    reducers: {
        onChecking: ( state ) => {
            state.status        = 'checking',
            state.user_name          = {},
            state.errorMessage  = undefined
        },
        onLogin: ( state, {payload} ) => {
            state.status        = 'auth',
            state.user_name          = payload,
            state.errorMessage  = undefined
        },
        onLogout: ( state, {payload} ) => {
            state.status        = 'no-auth',
            state.user_name          = '',
            state.errorMessage  = payload
        },
        clearErrorMessage: ( state )=>{
            state.errorMessage = undefined;
        }
    }
})

export const { onChecking, onLogin, onLogout, clearErrorMessage } = authSlice.actions;