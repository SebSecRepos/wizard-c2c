// UploadFile.jsx
import React, { useState } from "react";
import Cookies from "js-cookie";
import './UploadFile.css'

export const UploadFile =({id=""})=>{
  const [file, setFile] = useState(null);

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

  return (
    <div className="upload-container">
      <input className="file-upload " type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Subir archivo</button>
    </div>
  );
}

