import React from 'react';
import './GuidesStyle.css';
import panel from './Images/Implants/1.png'
import data from './Images/Implants/2.png'
import data2 from './Images/Implants/3.png'
import data4 from './Images/Implants/4.png'



export const ImplantsGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Implants guide</h1>

            <div className="guide-text-block">
                <p>Before create an implant you must create an session key, session keys authorize implants to connect with c2 server.</p>
                <img src={data4} alt="panel" srcset="" />
                <h3>Create implant</h3>
                <img src={panel} alt="panel" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Data</h3>
                <p>You must specify: </p>
                <ul>
                    <li>Listener</li>
                    <li>Operating system</li>
                    <li>Type (Executable or python script)</li>
                    <li>x64 Architectures are only available</li>
                    <li>Session key</li>
                    <li>Group</li>
                </ul>
                <img src={data} alt="attacks" srcset="" />
            </div>
            <div className="guide-text-block">
                <img src={data2} alt="" srcset="" />
                <p>Raw binary implants are only available for Windows systems, you can read about it in stagers section.</p>
            </div>

        </div>
    );
};
