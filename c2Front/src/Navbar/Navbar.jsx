import React, { useEffect } from 'react';
import {  Link, useNavigate } from 'react-router-dom';
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
import { BsBucketFill } from 'react-icons/bs';
import logo from '../Assets/logo.png';
import { IoSkullOutline } from 'react-icons/io5';
import { RxHamburgerMenu } from "react-icons/rx";

const Navbar = () => {

  const { startLogOut, user } = useAuthStore();
  const [ botnet, setBotnet ] = useState([]);
  const [ openStatus, setOpenStatus ] = useState(false);
  const [ open, setOpen ] = useState(true);
  const [alert, setAlert] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);


/* 
{
    attack_type: "http_flood",
    duration: "100",
    status: "attack_started",
    target: "http://localhost:80"
  } */
useEffect(() => {
  let socket;
  let reconnectInterval;
  const maxRetries = 5;
  let retryCount = 0;
  let manuallyClosed = false;

  const connectWebSocket = () => {
    socket = new WebSocket(`${import.meta.env.VITE_API_TEAM_SERVER}?token=${Cookies.get('x-token')}&rol=user`);

    socket.onopen = () => {
      console.log("WebSocket connected");
      retryCount = 0;
    };

    socket.onmessage = (event) => {
      if (event.data === "invalid") {
        toast.error('Invalid session');
        startLogOut();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        const botnet_data = data.botnet;
        setBotnet(botnet_data);
      } catch (err) {
        console.error("Error parsing WebSocket message", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
      socket.close();
    };

    socket.onclose = (event) => {
      if (!manuallyClosed) {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // exponential backoff
          console.warn(`WebSocket closed. Reconnecting in ${delay / 1000}s...`);
          reconnectInterval = setTimeout(connectWebSocket, delay);
          retryCount++;
        } else {
          toast.error("Unable to reconnect to WebSocket.");
        }
      }
    };
  };

  connectWebSocket();

  return () => {
    manuallyClosed = true;
    if (socket) socket.close();
    if (reconnectInterval) clearTimeout(reconnectInterval);
  };
}, []);



  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if(width > 1500) setOpen(true)
  }, [width]);


  const navigate = useNavigate()

  return (
    <>
      <ul className={ "navbar"}>



          <div className={ width > 1500 ? "navbar-content" : `sidebar ${open ? "open" : ""}`}>
              <img src={logo} alt="" srcset="" onClick={()=> navigate("/")}/>
              
              <Link to="/agents/" style={{ textDecoration: 'none' }}><li>agents <CiVirus className='nav-icons'/></li></Link>
              <Link to="/botnet/c_panel" style={{ textDecoration: 'none' }}><li> Botnet <GiRobotAntennas className='nav-icons'/></li></Link>
              <Link to="/admin/delivery" style={{ textDecoration: 'none' }}><li> Public buckets  <BsBucketFill className='nav-icons'/></li></Link>
              
              <Link to="/guides/" style={{ textDecoration: 'none' }}><li> Guides</li></Link>
              {
                user.role === "admin" &&  <Link to="/admin/" style={{ textDecoration: 'none' }}><li>Admin panel <RiAdminFill className='nav-icons'/></li></Link>
              }

              { botnet.length > 0 && <li className='botnet_status_btn' onClick={()=> setOpenStatus(!openStatus)}> ☠ Botnet ON</li> }

              <span className='exit-span'>Welcome: {user.user_name}  <button onClick={()=>setAlert(true)} className='logout-btn'><GrLogout /></button></span>

            </div>


        { width < 1500 &&
          <RxHamburgerMenu className='burger-btn' onClick={()=> setOpen(!open)}/>
        }
          
      </ul>
        {
          openStatus && botnet.length > 0 && <Botnet_status botnet={botnet}/>
        }

        <AlertModal 
        visible={alert}
        onClose={() => setAlert(false)}
        onConfirm={() => startLogOut()}  
        title="Exit?"
        description="Session will be closed"
        confirmText="Confirm"
        cancelText="Cancel"
      
      />


    </>
  );
};

export default Navbar;















