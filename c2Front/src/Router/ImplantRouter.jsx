import React from 'react';
import { Route, Routes } from 'react-router-dom';
import {Implants, Implant}  from "../c_panel/Pages";

const ImplantRouter = () => {
    return (
        <Routes>
          <Route path="/" element={<Implants />} />
          <Route path="/implants" element={<Implants />} />
          <Route path="/implants/:id" element={<Implant />} />
        </Routes>
    );
};

export default ImplantRouter;