import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../Styles/visualization.css'
import { Terminal } from '../Components/Terminal';
import './implant.css'
import { TopBar } from '../Components/TopBar';

export const Implant = () => {

  const [implant, setImplant] = useState(undefined);

  const { id } = useParams(); // obtiene el parámetro 'id' de la URL
  const navigate = useNavigate()

   useEffect(() => {
     const socket = new WebSocket('ws://localhost:4000?rol=usuario');
 
     socket.onopen = () => {
       console.log('Conectado al servidor WebSocket');
     };
 
     socket.onmessage = (event) => {
       
      const data = JSON.parse(event.data);

      const found = data.find(e => e.id.toString() === id.toString());

      if(!found || found.status != "active"){
        alert("Inactive")
        navigate("/implants/")
      }
      setImplant(found);
      
     };
 
     socket.onclose = () => {
       console.log('WebSocket cerrado');
     };
 
     
     return () => {
       socket.close();
     };
   }, [id]);

  return !implant ? <h1>cargando</h1>
   :
   <>
   <div className='implant_cpanel'>
    <div className="top_panel">
      <TopBar data={implant}/>
    </div>

    <div className="middle_panel">
      <div className="left_panel">
      </div>
      <Terminal id={implant.id}/>
      <div className="right_panel">
      </div>
    </div>

   <div className="bottom_panel">

   </div>
   </div>
   
   </>
  
};

