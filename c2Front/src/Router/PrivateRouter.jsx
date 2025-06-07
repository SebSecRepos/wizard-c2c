import React from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';

const PrivateRouter = ({ children, status }) => {

    return status === "auth" ? 
    <>
        <Navbar/>
        {children}
    </>
     : <Navigate to="/auth/login" replace />;
};


export default PrivateRouter;