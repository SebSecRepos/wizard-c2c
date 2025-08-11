import React, { useEffect, useState, useRef } from 'react';
import './C2Status.css'
import { toast } from 'react-toastify';
import Cookies from 'js-cookie'

const C2Status = () => {
  const [events, setEvents] = useState([]);
  
  const containerRef = useRef(null);

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
        const event_data = data.events;

        setEvents(event_data)

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


    
  useEffect(() => {
    // Cuando cambian los mensajes, hacer scroll al final
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [events]);

  const colorClass = (e) => {
    const msg = String(e).toLowerCase().trim();
    const words = msg.split(/\s+/)
    if (words.includes("failed") || words.includes("desconectado")) return "red-text";
    if (words.includes("successful") || words.includes("conectado")) return "green-text";
    if (words.includes("registered") || words.includes("logged")) return "yellow-text";
    return "blue-text";
  };


  return (
    <ul className="c2c-events" ref={containerRef}>
      {events && events.length > 0 ? events.map((e, i) => (
        <li key={i} className={colorClass(e)} >
          {e}
        </li>
      )) :
        <li>Loading events..</li>
      }
    </ul>
  )


};

export default C2Status;