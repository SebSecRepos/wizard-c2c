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


/* 
{
    attack_type: "http_flood",
    duration: "100",
    status: "attack_started",
    target: "http://localhost:80"
  } */


   useEffect(() => {


    try {

        const socket = new WebSocket(`ws://localhost:4000?token=${Cookies.get('x-token')}&rol=usuario`);

        socket.onopen = () => {
        };
  
      socket.onmessage = (event) => {

        if (event.data === "invalid") {
          alert("Sesión inválida");
          startLogOut();
          return;
        }
        
        const data = JSON.parse(event.data);
        const botnet_data = data.botnet;

    /*     console.log(data); */
        
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


/*    useEffect(()=>{
    console.log(botnet);
    
   },[botnet])
 */

  return (
    <>
      <ul className="navbar">
        <Link to="/implants/" style={{ textDecoration: 'none' }}><li>Implantes</li></Link>
        <Link to="/botnet/c_panel" style={{ textDecoration: 'none' }}><li>Botnet</li></Link>
        {
          user.role === "admin" &&  <Link to="/admin/" style={{ textDecoration: 'none' }}><li>Admin panel</li></Link>
        }

        { botnet.length > 0 && <li className='botnet_status_btn' onClick={()=> setOpenStatus(!openStatus)}> ☠ Botnet running</li> }
        
        <button onClick={startLogOut}>►</button>
      </ul>
        {
          openStatus && botnet.length > 0 && <Botnet_status botnet={botnet}/>
        }
    </>
  );
};

export default Navbar;
