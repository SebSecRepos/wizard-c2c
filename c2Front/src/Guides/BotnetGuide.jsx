import React from 'react';
import './GuidesStyle.css';
import help from './Images/Botnet/1.png'
import attacks from './Images/Botnet/2.png'
import attack from './Images/Botnet/3.png'
import botnet_status from './Images/Botnet/4.png'
import stopping from './Images/Botnet/5.png'


export const BotnetGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Botnet guide</h1>

            <div className="guide-text-block">
                <h3>Help</h3>
                <img src={help} alt="help" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Attacks</h3>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={attacks} alt="attacks" srcset="" />
                <img src={attack} alt="attack" srcset="" />
                <img src={botnet_status} alt="botnet_status" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Stopping attacks</h3>
                <img src={stopping} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>

        </div>
    );
};
