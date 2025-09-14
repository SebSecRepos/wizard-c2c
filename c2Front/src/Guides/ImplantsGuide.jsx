import React from 'react';
import './GuidesStyle.css';
import panel from './Images/Implants/1.png'
import data from './Images/Implants/2.png'
import data2 from './Images/Implants/3.png'



export const ImplantsGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Implants guide</h1>

            <div className="guide-text-block">
                <h3>Create implant</h3>
                <img src={panel} alt="panel" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Data</h3>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={data} alt="attacks" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>data2</h3>
                <img src={data2} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>

        </div>
    );
};
