import React, { useEffect, useState } from 'react';
import {  Link } from 'react-router-dom';
import './botnet-status.css'

const Botnet_status = ({botnet}) => {


  return (
    <>
        <div className='botnet-nabvar-info'>
        {
        botnet.map((a)=><li  className='botnet-nabvar-info-li' key={a.attack_type}>
                <span>Ataque: {a.attack_type}</span>
                <span>Ataque: {a.attack_type}</span>
            </li>
        )
        }
        
        </div>
    </>
  );
};

export default Botnet_status;


