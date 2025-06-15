import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './BottomBar.css'
import { useAuthStore } from '../../hooks';




export const BottomBar=({ id="", setExternalCmd, externalCmd, operations=[] })=> {

  const {startLogOut} = useAuthStore()

    const [activeDropdown, setActiveDropdown] = useState(null);
    const categories = [...new Set(operations.map(op => op.category))];

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

/*     const handleUpload = async () => {
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
    }; */


  const cmd = async (input, type="") => {

    if (type === "external") {
        setExternalCmd(input);
        return;
    }


    try {
      const response = await fetch(`http://localhost:4000/api/rcv/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-token':`${Cookies.get('x-token')}`},
        body: JSON.stringify({ cmd: input })
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

      const data = await response.json();

      if (data.msg === "Autenticación inválida") {
        alert("Autenticación inválida");
        startLogOut();
      }

      if (type==="download" ) {
          download("creds.txt", data.result)
      }

      
    } catch (error) {
      console.error('Error en customCommand:', error);
    }
  };



  const getOperationsByCategory = (category) =>
    operations.filter(op => op.category === category);

  const toggleDropdown = (category) => {
    setActiveDropdown(activeDropdown === category ? null : category);
  };



   return (
    <nav className="BottomBar">
      {categories.map((category) => (
        <div className="dropdown" key={category}>
          <button className="dropdown-button-bottom-bar" onClick={() => toggleDropdown(category)}>
            {category}
          </button>
          {activeDropdown === category && (
            <div className="dropdown-content floating-box">
              <span className="close" onClick={ () => toggleDropdown(null) }>x</span>
              {getOperationsByCategory(category).map(({ name, command, type }) => (
                <div className="dropdown-item" key={name}>
                  <strong>{name}</strong>
                  <pre className="command">
                    <button className="launch-btn" onClick={() =>{
                      toggleDropdown(null);
                      cmd(command, type);
                    } }>Run</button> {command}
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

