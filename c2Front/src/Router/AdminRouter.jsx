import React from 'react';
import { Route, Routes } from 'react-router-dom';
import {AdminUsers, AdminDelivery}  from "../c_panel/Pages";


const AdminRouter = () => {
    return (
        <Routes>
          <Route path="/" element={<AdminUsers />} />
          <Route path="/users/" element={<AdminUsers />} />
          <Route path="/delivery/" element={<AdminDelivery />} />
        </Routes>
    );
};

export default AdminRouter;