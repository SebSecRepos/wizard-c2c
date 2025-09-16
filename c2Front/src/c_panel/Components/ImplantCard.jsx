import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ImplantCard.css'
import { FcLinux } from "react-icons/fc";
import { FaWindows } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import Cookies from 'js-cookie'
import AlertModal from '../../util-components/AlertModal';


const ImplantCard = ({ impl_mac, group, public_ip, local_ip, operating_system, id, status, style, root}) => {
  
  const navigate = useNavigate(); 
  const [ alert, setAlert ] = useState(false);

  const visit_service = () => {
    navigate(`/implants/${id}`); 
  };
  
  const inactive = () => {
    toast.error("Implant inactive");
    console.log("Implant inactive");
    
  };


  const delete_impl=async(id)=>{

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/cmd/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-token':`${Cookies.get('x-token')}`},
        body: JSON.stringify({ finish: '' })
      });


      if (!response.ok) throw new Error(`Server error ${response.status}`);
      
      const data = await response.json();

      if (data.msg === "Invalid auth") {
        toast.error("Invalid auth");
        startLogOut();
      }
    } catch (error) {
      console.error('Error in customCommand:', error);
    }
  }


  

  useEffect(()=>{console.log(status);
  },[status])


   switch (style) {
    case 'card':
      return  <div className={status === "active" ? "card" : "card-in"} onClick={status === "active" ? visit_service : inactive  }>
      <p>Implant id: <span>{id}</span></p>
      <p>Implant mac: </p>
      <ul>{impl_mac.map(m=><><li>{m}</li>,</>)}</ul>
      <p>Local ips: </p>
      <ul>{local_ip.map(m=><><li>{m}</li>,</>)}</ul>
      <p>Group: <span>{group}</span></p>
      <p>public_ip: <span>{public_ip}</span></p>
      <p>Operating system:<span> {operating_system} <span className='sys-op-icon'>{operating_system.toLowerCase().includes('linux')? <FcLinux/> : <FaWindows/>}</span></span></p>
      <p>Status:<span>{status}</span></p>
      <p>Root?: <span className={root ? "root-indicator-t" : "root-indicator-f"} >{root ? "True" : "False"}</span></p>
    </div>;
    case 'list':
      return<div className='list-container'>
        <div className={status === "active" ? "list" : "list-in"} onClick={status === "active" ? visit_service : inactive  }>
          <p><span>{group}</span></p>
          <p><span>{operating_system.substring(0,15)}.. <span className='sys-op-icon'>{operating_system.toLowerCase().includes('linux')? <FcLinux/> : <FaWindows/>}</span>  </span></p>
          <p><span>{status}</span></p>
          <p><span className={root ? "root-indicator-t" : "root-indicator-f"} >{root ? "True" : "False"}</span></p>
        </div>
        <button className='delete-impl' onClick={()=> setAlert(true)}>X</button>
        <AlertModal
            visible={alert}
            onClose={() => setAlert(false)}
            onConfirm={() => delete_impl(id)}
            title="Warning! Implant will be deleted"
            description="Implant connection'll be closed and deleted from database"
            confirmText="Confirm"
            cancelText="Cancel"
        />
      </div> 
      

    default:
      return    <div className={status === "active" ? "list" : "list-in"} onClick={status === "active" ? visit_service : inactive  }>
      <p><span>{group}</span></p>
      <p><span>{operating_system} <span className='sys-op-icon'>{operating_system.toLowerCase().includes('linux')? <FcLinux/> : <FaWindows/>}</span></span></p>
      <p><span>{status}</span></p>
      
    </div>;
  }
  

  
};

export default ImplantCard;