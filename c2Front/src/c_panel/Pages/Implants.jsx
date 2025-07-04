import React, { useEffect, useState } from 'react';
import ImplantCard from '../Components/ImplantCard';
import Cookies from 'js-cookie';
import { useAuthStore } from '../../hooks';
//import Cookies from 'js-cookie';
import './implants.css'


export const Implants = () => {

  const { startLogOut } = useAuthStore();
  
  const [ implants, setImplants ] = useState([]);
  const [ style, setStyle ] = useState("list");
  const [ filteredImplants, setFilteredImplants ] = useState(implants);
  const [filters, setFilters] = useState({
    group: "",
    os: "",
    publicIp: ""
  });



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
        
        setImplants(data.data);

      };

      socket.onclose = () => {
        /* console.log('WebSocket cerrado'); */
      };

      return () => {
        socket.close();
      };
      
    } catch (error) {
      alert(error);
      startLogOut();
    }
   
  }, []);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const filtered = implants.filter((implant) => {
      const matchGroup = !filters.group || implant.group === filters.group;
      const matchOS = !filters.os || implant.operating_system === filters.os;
      const matchIP = !filters.publicIp || implant.public_ip === filters.publicIp;
      return matchGroup && matchOS && matchIP;
    });

    setFilteredImplants(filtered);
  }, [filters, implants]);

  const unique = (arr, key) => [...new Set(arr.map((obj) => obj[key]).filter(Boolean))];



  return (

    <div className=''>
      <h2>Implantes</h2>

      <div className="filter-container">

      <div className="filter-controls">
        <select name="group" value={filters.group} onChange={handleChange} className="filter-select">
          <option value="">Todos los grupos</option>
          {unique(implants, "group").map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>

        <select name="os" value={filters.os} onChange={handleChange} className="filter-select">
          <option value="">Todos los sistemas</option>
          {unique(implants, "operating_system").map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>

        <select name="publicIp" value={filters.publicIp} onChange={handleChange} className="filter-select">
          <option value="">Todas las IP públicas</option>
          {unique(implants, "public_ip").map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>

          <button className={style === 'list' ? 'card-button' : 'list-button'} onClick={()=>{
            setStyle(style === 'list' ? 'card' : 'list')
          }}>
            {style === 'card' ? (
              <ul>
                <li>___</li>
                <li>___</li>
                <li>___</li>
              </ul>
            ) : (
              <div className="card-btn-item">
                {/* contenido opcional */}
              </div>
            )}
          </button>
      </div>
    </div>
      {/* Resultado filtrado */}
      <ul className="card-container">
        {filteredImplants.map((implant) =>{

          return(
               <ImplantCard
                style={style}
                impl_mac={implant.impl_mac}
                group={implant.group}
                public_ip={implant.public_ip}
                local_ip={implant.local_ip}
                operating_system={implant.operating_system}
                id={implant.id}
                status={implant.status}
              /> 
          )
        }
        
        )}
        {filteredImplants.length === 0 && (
          <h1 >No se encontraron coincidencias.</h1>
        )}
      </ul>
    </div>
  );
};
