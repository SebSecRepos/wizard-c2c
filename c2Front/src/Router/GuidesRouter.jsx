import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { BotnetGuide, ListenersGuide, ImplantsGuide, ImplantGuide, StagerGuide, BucketsGuide, UsersGuide } from '../Guides/';
import {  Link, useNavigate } from 'react-router-dom';
import './style.css'

const GuidesRouter = () => {
    return (

        <>
        <nav className='guide-nav'>
            <Link to="/guides/botnet" style={{ textDecoration: 'none' }} className='guide-link' >Botnet</Link>
            <Link to="/guides/listeners" style={{ textDecoration: 'none' }} className='guide-link' >listeners</Link>
            <Link to="/guides/implants" style={{ textDecoration: 'none' }} className='guide-link' >implants</Link>
            <Link to="/guides/implant" style={{ textDecoration: 'none' }} className='guide-link' >implant</Link>
            <Link to="/guides/stagers" style={{ textDecoration: 'none' }} className='guide-link' >stagers</Link>
            <Link to="/guides/buckets" style={{ textDecoration: 'none' }} className='guide-link' >buckets</Link>
            <Link to="/guides/users" style={{ textDecoration: 'none' }} className='guide-link' >users</Link>
        </nav>
        <Routes>
          <Route path="/" element={<BotnetGuide />} />
          <Route path="/botnet/" element={<BotnetGuide />} />
          <Route path="/listeners/" element={<ListenersGuide />} />
          <Route path="/implants/" element={<ImplantsGuide />} />
          <Route path="/implant/" element={<ImplantGuide />} />
          <Route path="/stagers/" element={<StagerGuide />} />
          <Route path="/buckets/" element={<BucketsGuide />} />
          <Route path="/users/" element={<UsersGuide />} />
        </Routes>
        
        </>
    );
};

export default GuidesRouter;