import React from 'react';
import { Route, Routes } from 'react-router-dom';
import {Implants, Implant, Admin}  from "../c_panel/Pages";


const ImplantRouter = () => {
    return (
        <Routes>
          <Route path="/" element={<Implants />} />
          <Route path="/implants" element={<Implants />} />
          <Route path="/implants/:id" element={<Implant />} />
          <Route path="/Admin/" element={<Admin />} />
        </Routes>
    );
};

export default ImplantRouter;