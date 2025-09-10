import React, { useEffect, useState } from 'react';
import ImplantCard from '../Components/ImplantCard';
import Cookies from 'js-cookie';
import { BsCardList } from "react-icons/bs";
import { FaList } from "react-icons/fa6";
import { useAuthStore } from '../../hooks';
import './implants.css'

//import Cookies from 'js-cookie';
import './implants.css'
import C2Status from '../Components/C2Status';
import { Loader } from '../../util-components/Loader';
import { Listeners } from '../Components/Listeners';


export const Implants = () => {

  const { startLogOut } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [implants, setImplants] = useState([]);
  const [style, setStyle] = useState("list");
  const [filteredImplants, setFilteredImplants] = useState(implants);
  const [filters, setFilters] = useState({
    group: "",
    os: "",
    publicIp: ""
  });





/*  */


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

        console.log(data);
        
        setImplants(data.data);
        setLoading(false);
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


/*  */







  useEffect(() => {

    try {

      const socket = new WebSocket(`${import.meta.env.VITE_API_TEAM_SERVER}?token=${Cookies.get('x-token')}&rol=user`);

      socket.onopen = () => {
        /*    console.log('Conectado al servidor WebSocket'); */
      };

      socket.onmessage = (event) => {

        if (event.data === "invalid") {
          toast.error("Invalid session");
          startLogOut();
          return;
        }

        const data = JSON.parse(event.data);

        setImplants(data.data);
        setLoading(false);
        
      };

      socket.onclose = () => {
        /* console.log('WebSocket cerrado'); */
      };

      return () => {
        socket.close();
      };

    } catch (error) {
      toast.error(error);
      startLogOut();
    }
    setLoading(false);


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

    <div className='implant-container'>

      {
        implants.length === 0 && loading ?
          <Loader />
        :

          <>
            <div className="filter-container">

              <div className="filter-controls">
                <select name="group" value={filters.group} onChange={handleChange} className="filter-select">
                  <option value="">All groups</option>
                  {unique(implants, "group").map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>

                <select name="os" value={filters.os} onChange={handleChange} className="filter-select">
                  <option value="">All operating systems</option>
                  {unique(implants, "operating_system").map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>

                <select name="publicIp" value={filters.publicIp} onChange={handleChange} className="filter-select">
                  <option value="">All public ip</option>
                  {unique(implants, "public_ip").map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>

                <button className='list-button' onClick={() => {
                  setStyle(style === 'list' ? 'card' : 'list')
                }}>
                  {style === 'card' ? (
                    <FaList />
                  ) : (
                    <BsCardList />
                  )}
                </button>
              </div>
            </div>

          <div className='c2c-status'>
          {filteredImplants && filteredImplants.length === 0 ? (
              <h1>No implants</h1>

          )
          :

          <>
        
            <ul className={"card-container"} style={ style === "card" ? { paddingTop:'200px'} : {paddingTop:'0'}}>

              { style === "list" &&
                <li className="implants-desc">
                    <p><span>Group</span></p>
                    <p><span>Operating system</span></p>
                    <p><span>Status</span></p>
                    <p><span>Root</span></p>
                </li>

              }
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
                      root={implant.root}
                    /> 
                )
              }
              
              )} 
        
            </ul>

          </>
        }
          <div className='event-container'>
            <h1>Event logs</h1>
            <C2Status />
          </div>
      </div>

          <Listeners />
          </>
      }


    </div>
  );
};
