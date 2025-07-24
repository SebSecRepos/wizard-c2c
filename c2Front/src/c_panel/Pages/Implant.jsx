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
import { toast, ToastContainer } from 'react-toastify';

export const Implant = () => {

  const [implant, setImplant] = useState(undefined);
  const [externalCmd, setExternalCmd] = useState("");
  const [openExplorer, setOpenExplorer] = useState(false);
  const [openSideBar, setOpenSidebar] = useState(false);

  const { id } = useParams(); // obtiene el parámetro 'id' de la URL
  const navigate = useNavigate()
  const { startLogOut } = useAuthStore();

   useEffect(() => {


    try {

        const socket = new WebSocket(`${import.meta.env.VITE_API_WS_URL}?token=${Cookies.get('x-token')}&rol=usuario`);

        socket.onopen = () => {
          /*    console.log('Conectado al servidor WebSocket'); */
        };
  
      socket.onmessage = (event) => {

        if (event.data === "invalid") {
          toast.error("Sesión inválida");
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

  return !implant ? <h1>cargando</h1>
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
        <button className='btn-filesystem' onClick={()=> setOpenExplorer(!openExplorer)}>Sistema de archivos</button>
      </div>
      }

      {
        implant.operating_system.toLowerCase().trim().includes("windows") &&
        <WindowsTerminal id={implant.id} externalCmd={externalCmd} setExternalCmd={setExternalCmd}  />
      }
      {
        implant.operating_system.toLowerCase().trim().includes("linux") &&
        <LinuxTerminal id={implant.id} externalCmd={externalCmd} setExternalCmd={setExternalCmd}  />
      }
    </div>

   <div className="bottom_panel">
    {
      implant.operating_system.toLowerCase().trim().includes("windows") &&
      <BottomBar id={id}  setExternalCmd={setExternalCmd} externalCmd={externalCmd} operations={windowsOperationsArray}/>
    }
    {
      implant.operating_system.toLowerCase().trim().includes("linux") &&
      <BottomBar id={id}  setExternalCmd={setExternalCmd} externalCmd={externalCmd} operations={linuxOperationsArray}/>
    }
   </div>
   </div>
   
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
  
};

