import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRouter = ({ children, status }) => {


    return status === "auth" ? 
        <Navigate to="/implants" replace />
        :
        children
};


export default PublicRouter;