import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
    name: 'auth',
    initialState:{
        status: 'checking',   //auth, no-auth
        user: {},
        errorMessage: undefined
    },
    reducers: {
        onChecking: ( state ) => {
            state.status        = 'checking',
            state.user          = {},
            state.errorMessage  = undefined
        },
        onLogin: ( state, {payload} ) => {
            state.status        = 'auth',
            state.user          = payload,
            state.errorMessage  = undefined
        },
        onLogout: ( state, {payload} ) => {
            state.status        = 'no-auth',
            state.user          = '',
            state.errorMessage  = payload
        },
        clearErrorMessage: ( state )=>{
            state.errorMessage = undefined;
        }
    }
})

export const { onChecking, onLogin, onLogout, clearErrorMessage } = authSlice.actions;