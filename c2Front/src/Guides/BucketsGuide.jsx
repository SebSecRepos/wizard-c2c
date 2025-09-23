import React from 'react';
import './GuidesStyle.css';
import one from './Images/Buckets/1.png'
import two from './Images/Buckets/1.png'




export const BucketsGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Buckets guide</h1>

            <div className="guide-text-block">
                <h3>Public buckets allow c2 to upload files and distribute them to any place, by default runs in port 80 </h3>
                <img src={one} alt="panel" srcset="" />
                <p>This buckets are also usefull for fetching payloads </p>
            </div>

        </div>
    );
};
