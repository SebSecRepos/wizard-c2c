import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom"
import PrivateRouter from './PrivateRouter';
import ImplantRouter from './ImplantRouter';
import PublicRouter from './PublicRouter';
import { Auth } from '../Auth/Pages';
import { useAuthStore } from '../hooks';
import BotnetRouter from './BotnetRouter';


const AppRouter = () => {


  const { status, checkAuthToken } = useAuthStore();

  useEffect(()=>{
    checkAuthToken();
  },[])

  if( status === "checking" ) return (<h1>Cargando...</h1>);


  return (

    <>
      <Routes>
        <Route path="/auth/*" element={
          <PublicRouter status={status}>
            <Auth/>
          </PublicRouter>
        } />
        
        <Route path="/*" element={
          <PrivateRouter status={status}>
            <ImplantRouter />
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