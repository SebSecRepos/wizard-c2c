import React, { useEffect } from 'react';
import {  Link } from 'react-router-dom';
import { useAuthStore } from '../hooks';
import Cookies from 'js-cookie';
import './Navbar.css'
import { useState } from 'react';
import Botnet_status from './Components/botnet_status';

const Navbar = () => {

  const { startLogOut, user } = useAuthStore();
  const [ botnet, setBotnet ] = useState([]);
  const [ openStatus, setOpenStatus ] = useState(false);


   useEffect(() => {


    try {

        const socket = new WebSocket(`ws://localhost:4000?token=${Cookies.get('x-token')}&rol=usuario`);

        socket.onopen = () => {
          /*    console.log('Conectado al servidor WebSocket'); */
        };
  
      socket.onmessage = (event) => {

        if (event.data === "invalid") {
          alert("Sesión inválida");
          startLogOut();
          return;
        }
        
        const data = JSON.parse(event.data);
        const botnet_data = data.botnet;

        setBotnet(botnet_data)
      
        
      };
  
      socket.onclose = () => {
      };
  
      return () => {
        socket.close();
      };
      
    } catch (error) {
      alert(error);
      startLogOut();
    }
     
     
   }, []);


  return (
    <>
      <ul className="navbar">
        <Link to="/implants/" style={{ textDecoration: 'none' }}><li>Implantes</li></Link>
        <Link to="/botnet/c_panel" style={{ textDecoration: 'none' }}><li>Botnet</li></Link>
        {
          user.role === "admin" &&  <Link to="/create_user/" style={{ textDecoration: 'none' }}><li>Crear usuario</li></Link>
        }
        {
          openStatus &&  <Botnet_status botnet={botnet}/>
        }

        { botnet.length > 0 &&<div className='botnet_status_btn' onClick={()=> setOpenStatus(!openStatus)}> ☠ Botnet running</div> }
        
        <button onClick={startLogOut}>►</button>
      </ul>
    </>
  );
};

export default Navbar;
