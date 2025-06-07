import React, { useEffect, useState } from 'react';
import ImplantCard from '../Components/ImplantCard';
//import { useAuthStore } from '../../hooks';
//import Cookies from 'js-cookie';



export const Implants = () => {
  
  const [ implants, setImplants ] = useState([]);
  //const { user_name } = useAuthStore();
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:4000?rol=usuario');

    socket.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    socket.onmessage = (event) => {
      console.log(event);
      
      const data = JSON.parse(event.data);

      setImplants(data);
    };

    socket.onclose = () => {
      console.log('WebSocket cerrado');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (

    !implants || implants.length < 1 ?

      <h2>No hay implantes</h2>

    :
    <div className=''>
      <h2>Implantes</h2>
      <ul className='card-container'>
        {implants.map((implant) => (
              <ImplantCard
                impl_mac={implant.impl_mac}
                group={implant.group}
                public_ip={implant.public_ip}
                local_ip={implant.local_ip}
                operating_system={implant.operating_system}
                id={implant.id}
                status={implant.status}
              />
        ))}
      </ul>
    </div>
  );
};
