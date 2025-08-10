import React from "react";
import Runa from '../Assets/Runa.png';
import './Runa.css';


export const Loader=()=>{

    return(

        <div class="runa-loader">
            <img src={Runa} alt="Cargando..." />
        </div>
    );


}