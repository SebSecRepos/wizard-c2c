import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';
import Cookies from 'js-cookie';
import { useAuthStore } from '../../hooks';
import { ToastContainer, toast } from 'react-toastify';

export const WindowsTerminal = ({ id = "", externalCmd = "", setExternalCmd }) => {
  const [input, setInput] = useState('');
  const [visibleHistory, setVisibleHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const [currentDir, setCurrentDir] = useState('C:\\');
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

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const customCommand = async (input) => {


    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/cmd/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-token':`${Cookies.get('x-token')}`},
        body: JSON.stringify({ cmd: input })
      });


      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      
      const data = await response.json();

      if (data.msg === "Autenticación inválida") {
        toast.error("Autenticación inválida");
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
    let newDir = currentDir;

    switch (command) {
      case 'help':
        response = 'Comandos disponibles: help, about, clear, history';
        break;
      case 'about':
        response = 'Administración remota de equipos';
        break;
      case 'clear':
        setVisibleHistory([]);
        setInput('');
        return;
      case 'history':
        response = fullHistory.map((h, i) => `${i + 1}: ${h.command}`).join('\n');
        break;
      default: {
        const data = await customCommand(command);
        response = data.result;
        if (data.cwd) newDir = data.cwd;
        break;
      }
    }

    const newEntry = { command, response };
    setFullHistory([...fullHistory, newEntry]);
    setVisibleHistory([...visibleHistory, newEntry]);
    setInput('');
    setHistoryIndex(null);
    setCurrentDir(newDir);
    setExternalCmd('');
    inputRef.current?.focus();
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    await executeCommand(input);
  };

  useEffect(() => {
    if (externalCmd.trim()) {
      setInput(externalCmd);      // Opcional, solo para mostrar en input
      executeCommand(externalCmd);
    }
  }, [externalCmd]);

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
              <span className="prompt">PS {currentDir}&gt;</span>
              <span>{entry.command}</span>
            </div>
            <div className="terminal-response">{entry.response}</div>
          </div>
        ))}
        <form onSubmit={handleCommand}>
          <div className="terminal-line">
            <span className="prompt">PS {currentDir}&gt;</span>
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
