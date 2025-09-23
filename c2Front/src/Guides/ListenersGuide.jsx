import React from 'react';
import './GuidesStyle.css';
import panel from './Images/Listeners/1.png'
import data from './Images/Listeners/2.png'
import ssl from './Images/Listeners/3.png'



export const ListenersGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Listeners guide</h1>

            <div className="guide-text-block">
                <h3>Create listener</h3>
                <img src={panel} alt="panel" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Data</h3>
                <p>Listener form, only x64 architectures are available for now, you should specify: </p>
                <ul>
                    <li>Your c2c domain</li>
                    <li>Interface bind address</li>
                    <li>Port</li>
                    <li>If you want an ssl conection you must upload cert.pem and key.pem</li>
                </ul>
                <img src={data} alt="attacks" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>SSL</h3>
                <img src={ssl} alt="" srcset="" />
            </div>

        </div>
    );
};
