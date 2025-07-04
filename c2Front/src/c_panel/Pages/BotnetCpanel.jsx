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
import { linuxOperationsArray, windowsOperationsArray } from '../../Utils/operations';

import Cookies from 'js-cookie';
import { BotnetTerminal } from '../Components/BotnetTerminal';

export const BotnetCpanel = () => {

  const [implant, setImplant] = useState(undefined);
  const [externalCmd, setExternalCmd] = useState("");
  const [openExplorer, setOpenExplorer] = useState(false);
  const [openSideBar, setOpenSidebar] = useState(false);

  const { id } = useParams(); // obtiene el parámetro 'id' de la URL
  const navigate = useNavigate()
  const { startLogOut } = useAuthStore();

   /* useEffect(() => {


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
      
    } catch (error) {
      alert(error);
      startLogOut();
    }
     
     
   }, [id]); */

/*    {
    openExplorer && <FileExplorer id={id} openExplorer={openExplorer} setOpenExplorer={setOpenExplorer}/>
   } */

  return  <>
   <div className='implant_cpanel'>
    <div className="top_panel">
      <button className="burger-button" onClick={() => setOpenSidebar(!openSideBar)}>
        <span>
        ☰
        </span>
      </button>
    </div>

    <div className="middle_panel">
      {
        openSideBar &&
      <div className="left_panel" >
        <UploadFile />
        <button className='btn-filesystem' onClick={()=> setOpenExplorer(!openExplorer)}>Sistema de archivos</button>
      </div>
      }

      
        <BotnetTerminal />
      
      
    </div>

{/*    <div className="bottom_panel">
      <BottomBar id={id}  setExternalCmd={setExternalCmd} externalCmd={externalCmd} operations={windowsOperationsArray}/>
   </div> */}
   </div>
   
   </>
  
  
};

