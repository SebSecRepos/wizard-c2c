import React, { useEffect } from 'react';
import {  Link } from 'react-router-dom';
import { useAuthStore } from '../hooks';
import Cookies from 'js-cookie';
import './Navbar.css'
import { useState } from 'react';
import Botnet_status from './Components/botnet_status';
import { GrLogout } from "react-icons/gr";
import { CiVirus } from "react-icons/ci";
import { GiRobotAntennas } from "react-icons/gi";
import { RiAdminFill } from "react-icons/ri";
import AlertModal from '../util-components/AlertModal';
import { ToastContainer, toast } from 'react-toastify';
import { TbTruckDelivery } from 'react-icons/tb';
import logo from '../Assets/logo.png';


const Navbar = () => {

  const { startLogOut, user } = useAuthStore();
  const [ botnet, setBotnet ] = useState([]);
  const [ openStatus, setOpenStatus ] = useState(false);
  const [alert, setAlert] = useState(false);

/* 
{
    attack_type: "http_flood",
    duration: "100",
    status: "attack_started",
    target: "http://localhost:80"
  } */


   useEffect(() => {


    try {

        const socket = new WebSocket(`${import.meta.env.VITE_API_WS_URL}?token=${Cookies.get('x-token')}&rol=usuario`);

        socket.onopen = () => {
        };
  
      socket.onmessage = (event) => {

        if (event.data === "invalid") {
          toast.error('Invalid sesion');
          startLogOut();
          return;
        }
        
        const data = JSON.parse(event.data);
        const botnet_data = data.botnet;

<<<<<<< HEAD
=======
    /*     console.log(data); */
        
>>>>>>> parent of 0562887 (C# Malware)
        setBotnet(botnet_data)
        
      };
  
      socket.onclose = () => {
      };
  
      return () => {
        socket.close();
      };
      
    } catch (error) {
      toast.error(error);
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
        <img src={logo} alt="" srcset="" />
        <Link to="/implants/" style={{ textDecoration: 'none' }}><li>Implantes <CiVirus className='nav-icons'/></li></Link>
        <Link to="/botnet/c_panel" style={{ textDecoration: 'none' }}><li> Botnet <GiRobotAntennas className='nav-icons'/></li></Link>
        <Link to="/admin/delivery" style={{ textDecoration: 'none' }}><li> Public buckets  <TbTruckDelivery className='nav-icons'/></li></Link>
        {
          user.role === "admin" &&  <Link to="/admin/" style={{ textDecoration: 'none' }}><li>Admin panel <RiAdminFill className='nav-icons'/></li></Link>
        }

        { botnet.length > 0 && <li className='botnet_status_btn' onClick={()=> setOpenStatus(!openStatus)}> ☠ Botnet running</li> }
        
        <button onClick={()=>setAlert(true)} className='logout-btn'><GrLogout /></button>
      </ul>
        {
          openStatus && botnet.length > 0 && <Botnet_status botnet={botnet}/>
        }

        <AlertModal 
        visible={alert}
        onClose={() => setAlert(false)}
        onConfirm={() => startLogOut()}  
        title="¿Desea salir?"
        description="Se cerrará la sesión"
        confirmText="Confirmar"
        cancelText="Cancelar"
      
      />
        <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
  />

    </>
  );
};

export default Navbar;
