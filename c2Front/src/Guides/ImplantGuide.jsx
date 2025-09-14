import React from 'react';
import './GuidesStyle.css';
import list from './Images/Implant/1.png'
import terminal from './Images/Implant/2.png'
import lef_panel from './Images/Implant/3.png'
import file_explorer from './Images/Implant/4.png'
import operations from './Images/Implant/5.png'
import operations2 from './Images/Implant/6.png'
import operations3 from './Images/Implant/7.png'



export const ImplantGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Implant guide</h1>

            <div className="guide-text-block">
                <h3>Implant list</h3>
                <img src={list} alt="panel" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Implant terminal</h3>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={terminal} alt="attacks" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Left panel </h3>
                <img src={lef_panel} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Victim file explorer </h3>
                <img src={file_explorer} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Custom operations </h3>
                <img src={operations} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={operations2} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={operations3} alt="" srcset="" />
            </div>

        </div>
    );
};
