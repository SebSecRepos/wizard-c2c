import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiVirusLine } from "react-icons/ri";
import './ImplantCard.css'
import { FcLinux } from "react-icons/fc";
import { FaWindows } from "react-icons/fa";
import { toast } from 'react-toastify';


const ImplantCard = ({ impl_mac, group, public_ip, local_ip, operating_system, id, status, style}) => {
  
  const navigate = useNavigate(); 

  const visit_service = () => {
    navigate(`/implants/${id}`); 
  };
  
  const inactive = () => {
    toast.error("Implante inactivo");
    console.log("Implante inactivo");
    
  };
  

  useEffect(()=>{console.log(status);
  },[status])

  {


    
  }
   switch (style) {
    case 'card':
      return  <div className={status === "active" ? "card" : "card-in"} onClick={status === "active" ? visit_service : inactive  }>
      <RiVirusLine  />
      <p>Implant id: <span>{id}</span></p>
      <p>Implant mac: </p>
      <ul>{impl_mac.map(m=><><li>{m}</li>,</>)}</ul>
      <p>Local ips: </p>
      <ul>{local_ip.map(m=><><li>{m}</li>,</>)}</ul>
      <p>Grupo: <span>{group}</span></p>
      <p>public_ip: <span>{public_ip}</span></p>
      <p>operating_system: <span>{operating_system} <span className='sys-op-icon'>{operating_system.toLowerCase().includes('linux')? <FcLinux/> : <FaWindows/>}</span></span></p>
      <p>status: <span>{status}</span></p>
    </div>;
    case 'list':
      return    <div className={status === "active" ? "list" : "list-in"} onClick={status === "active" ? visit_service : inactive  }>
      <RiVirusLine className='implant-logo'/>
      <p>Grupo: <span>{group}</span></p>
      <p>operating_system: <span>{operating_system} <span className='sys-op-icon'>{operating_system.toLowerCase().includes('linux')? <FcLinux/> : <FaWindows/>}</span>  </span></p>
      <p>status: <span>{status}</span></p>
    </div>;

    default:
      return    <div className={status === "active" ? "list" : "list-in"} onClick={status === "active" ? visit_service : inactive  }>
      <p>Grupo: <span>{group}</span></p>
      <p>operating_system: <span>{operating_system} <span className='sys-op-icon'>{operating_system.toLowerCase().includes('linux')? <FcLinux/> : <FaWindows/>}</span></span></p>
      <p>status: <span>{status}</span></p>
    </div>;
  }
  

};

export default ImplantCard;