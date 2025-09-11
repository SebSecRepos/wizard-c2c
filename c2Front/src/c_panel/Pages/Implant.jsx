import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../Styles/visualization.css'
import { WindowsTerminal } from '../Components/WindowsTerminal';
import { LinuxTerminal } from '../Components/LinuxTerminal';
import './implant.css'
import { TopBar } from '../Components/TopBar';
import { UploadFile } from '../Components/UploadFile';
import { BottomBar } from '../Components/BottomBar';
import FileExplorer from '../Components/FileExplorer';
import { useAuthStore } from '../../hooks';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import { Loader } from '../../util-components/Loader';

export const Implant = () => {

  const [implant, setImplant] = useState(undefined);
  const [externalCmd, setExternalCmd] = useState("");
  const [openExplorer, setOpenExplorer] = useState(false);
  const [openSideBar, setOpenSidebar] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate()
  const { startLogOut } = useAuthStore();

   useEffect(() => {


    try {

        const socket = new WebSocket(`${import.meta.env.VITE_API_WS_URL}?token=${Cookies.get('x-token')}&rol=user`);

        socket.onopen = () => {
        };
  
      socket.onmessage = (event) => {

        if (event.data === "invalid") {
          toast.error("Invalid sesion");
          startLogOut();
          return;
        }
        
        const data = JSON.parse(event.data);

        const found = data.data.find(e => e.id.toString() === id.toString());

        if(!found || found.status != "active"){
          toast.error("Inactive")
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
      
    } catch (error) {
      toast.error(error);
      startLogOut();
    }
     
     
   }, [id]);



  return !implant ? <Loader />
   :
   <>
   {
    openExplorer && <FileExplorer id={id} openExplorer={openExplorer} setOpenExplorer={setOpenExplorer}/>
   }
   <div className='implant_cpanel'>
    <div className="top_panel">
      <button className="burger-button" onClick={() => setOpenSidebar(!openSideBar)}>
        <span>
        ☰
        </span>
      </button>
      <TopBar data={implant}/>
    </div>

    <div className="middle_panel">
      {
        openSideBar &&
      <div className="left_panel" >
        <UploadFile id={id}/>
        <hr />
        <button className='btn-filesystem' onClick={()=> setOpenExplorer(!openExplorer)}>File system</button>
      </div>
      }

      {
        implant.operating_system.toLowerCase().trim().includes("windows") &&
        <WindowsTerminal  wsTerminal id={implant.id} externalCmd={externalCmd} setExternalCmd={setExternalCmd}  />
      }
      {
        implant.operating_system.toLowerCase().trim().includes("linux") &&
        <LinuxTerminal id={implant.id} externalCmd={externalCmd} setExternalCmd={setExternalCmd} user={implant.user}  />
      }
    </div>

   <div className="bottom_panel">
    {
      implant.operating_system.toLowerCase().trim().includes("windows") &&
      <BottomBar id={id}  setExternalCmd={setExternalCmd} externalCmd={externalCmd} sys='windows' />
    }
    {
      implant.operating_system.toLowerCase().trim().includes("linux") &&
      <BottomBar id={id}  setExternalCmd={setExternalCmd} externalCmd={externalCmd} sys='linux' />
    }
   </div>
   </div>

      
   </>
  
};

