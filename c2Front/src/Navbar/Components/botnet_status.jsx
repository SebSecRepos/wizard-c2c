import React, { useEffect, useState } from 'react';
import {  Link } from 'react-router-dom';
import './botnet-status.css'

const Botnet_status = ({botnet}) => {


  return (
    <>
        <div className='botnet-nabvar-info'>
          <li className='botnet-nabvar-info-li-1'><span>Attack</span><span>Target</span><span>Status</span></li>

          {
          botnet.map((a)=><li  className='botnet-nabvar-info-li' key={a.attack_type}>
                  <span>{a.attack_type}</span>
                  <span>{a.target}</span>
                  <span>running</span>
              </li>
          )
          }
        
        </div>
    </>
  );
};

export default Botnet_status;


