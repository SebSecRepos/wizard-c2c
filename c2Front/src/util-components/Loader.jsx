import React from "react";
import Runa from '../Assets/Runa_out.png';
import Runa_in from '../Assets/Runa_in.png';
import './Runa.css';


export const Loader=()=>{

    return(
        <>
            <div class="loader">
                <img className="out" src={Runa} alt="Cargando..." />
                <img className="in" src={Runa_in} alt="Cargando..." />
            </div>
        </>
    );


}