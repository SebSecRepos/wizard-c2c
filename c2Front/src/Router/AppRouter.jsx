import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom"
import PrivateRouter from './PrivateRouter';
import ImplantRouter from './ImplantRouter';
import PublicRouter from './PublicRouter';
import { Auth } from '../Auth/Pages';
import { useAuthStore } from '../hooks';
import BotnetRouter from './BotnetRouter';
import AdminRouter from './AdminRouter';


const AppRouter = () => {


  const { status, checkAuthToken } = useAuthStore();

  useEffect(()=>{
    checkAuthToken();
  },[])

  if( status === "checking" ) return (<h1>Cargando...</h1>);


  return (

    <>
      <Routes>
        <Route path="/*" element={
          <PublicRouter status={status}>
            <Auth/>
          </PublicRouter>
        } />
        <Route path="/auth/*" element={
          <PublicRouter status={status}>
            <Auth/>
          </PublicRouter>
        } />
        
        <Route path="/implants/*" element={
          <PrivateRouter status={status}>
            <ImplantRouter />
          </PrivateRouter>
        } 
        />
        <Route path="/admin/*" element={
          <PrivateRouter status={status}>
            <AdminRouter />
          </PrivateRouter>
        } 
        />
        <Route path="/botnet/*" element={
          <PrivateRouter status={status}>
            <BotnetRouter />
          </PrivateRouter>
        } 
        />
        
      </Routes>
      </>
    );
};

export default AppRouter