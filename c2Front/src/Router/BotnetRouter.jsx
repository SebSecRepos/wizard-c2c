import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { BotnetCpanel } from '../c_panel/Pages';


const BotnetRouter = () => {
    return (
        <Routes>
          <Route path="/c_panel/" element={<BotnetCpanel/>} />
        </Routes>
    );
};

export default BotnetRouter;