import React from 'react';
import './GuidesStyle.css';
import panel from './Images/Listeners/1.png'
import data from './Images/Listeners/2.png'
import ssl from './Images/Listeners/3.png'



export const BucketsGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Buckets guide</h1>

            <div className="guide-text-block">
                <h3>Create listener</h3>
                <img src={panel} alt="panel" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Data</h3>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={data} alt="attacks" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>SSL</h3>
                <img src={ssl} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>

        </div>
    );
};
