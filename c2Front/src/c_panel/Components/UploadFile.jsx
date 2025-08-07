// UploadFile.jsx
import React, { useState } from "react";
import Cookies from "js-cookie";
import './UploadFile.css'
import { toast, ToastContainer } from "react-toastify";

export const UploadFile =({id=""})=>{
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleUpload = async () => {

    
    try {
      if (!file){
        toast.error("No file selected!")
        return;
      } 
      
      setIsSending(true);
      let destination=`C:\\Temp\\${file.name}`
      destination = prompt(`Ingrese la ruta, ruta por defecto C:\\Temp\\${file.name}`);
      if(!destination || destination === null || destination==="") destination=`C:\\Temp\\${file.name}`
  
      const formData = new FormData();
      formData.append("file", file);
      formData.append("destination", destination);
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/upload/${id}`, {
          method: 'POST',
          body: formData,
          headers: {
              "x-token": `${Cookies.get('x-token')}`
          }
      });
  
      const result = await response.json();
  
      if(result.ok) toast.success(result.msg)
      if(!result.ok) toast.error(result.msg)
      
    } catch (error) {
      toast.error("Server error")
    }

    setIsSending(false);

  };

  return (
    <div className="upload-container">
    {isSending?
      <h1>Subiendo archivo</h1>
      :
      <>
        <input className="file-upload " type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload}>Subir archivo</button>
      </>
    }
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
}

