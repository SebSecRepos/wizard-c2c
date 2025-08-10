// src/components/Register.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../hooks';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AlertModal from '../../util-components/AlertModal';
import { ToastContainer, toast } from "react-toastify";
import './AdminUsers.css';
import './AdminDelivery.css';


export const AdminDelivery = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [page, setPage] = useState('/api/arts/js');
  const [alert, setAlert] = useState(false);
  const [onSending, setOnSending] = useState(false);




  const fetchArtifacts = async () => {

    const artifact = page.split('/',4)[3];
    
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/get/${artifact}`, {
      headers: { 'x-token': Cookies.get('x-token') },
    });
    const data = await res.json();
    setArtifacts(data.files);
    
    //setUsers(data.users);
  };

 
  const handleEditClick = (page) => {
    setPage(page);
  };

  
  useEffect(()=>{fetchArtifacts()},[page])

  const handleUpload = async () => {
    if (!file) return;

    try {
      setOnSending(true);
      const artifact = page.split('/',4)[3];
      
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/upload/${artifact}`, {
        method: 'POST',
        body: formData,
        headers: {
          "x-token": `${Cookies.get('x-token')}`
        }
      });
      
      const result = await response.json();
      
      if(result.ok){
        toast.success(result.msg)
        fetchArtifacts();
      }else{
        toast.error(result.msg)
      }
      
    } catch (error) {
      
      toast.error(error)
    }
    setOnSending(false);
  };



  const delete_artifact = async (filename) => {

    try {

      const artifact = page.split('/',4)[3];
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/delete/${artifact}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
        body:JSON.stringify({filename})
      });
      
      const response = await res.json();
      if (response.ok) {
        toast.success("Archivo eliminado");
        fetchArtifacts();
      } else {
        toast.error(response.msg);
      }
    } catch (error) {
      toast.error(response.error);
    }


  }

  return (
    <div className="delivery-register-container">
      <h3>Bucket</h3>
      <h4>{import.meta.env.VITE_API_URL}{page}/</h4>
      <p>
        Subir recursos al c2c para ser consumidos desde un objetivo infectado, la url que se visualiza es el bucket de archivos estáticos
        <tr></tr> Estos archivos pueden ser vistos desde cualquier sitio, no colocar información sensible.
      </p>
      <div className="delivery-form-section">
        

        {user?.role === "admin" &&
          <form className='delivery-form' onSubmit={(e)=>e.preventDefault()} noValidate>

            {!onSending &&

              <div className="delivery-edit-btns">
                <h4>Upload file</h4>
                <input className="file-upload " type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={handleUpload}>Subir archivo</button>
              </div>
            }

          </form>

        }
        <ul className="delivery-files-container">
          {  !artifacts || artifacts.length === 0 ? <p>No hay archivos</p>
          :
          
          artifacts.map((ar)=><li className='art-file-li'>
            <Link target='blank' style={{ textDecoration: 'none', backgroundColor:'transparent', height:'100%'}} to={`${import.meta.env.VITE_API_URL}${page}/${ar}`}>📄{ar}</Link> 
            
            {user?.role === "admin" &&
              <button className='delivery-delete-art' onClick={()=> delete_artifact(ar)}>Eliminar</button>
            }
            </li>
            )
        
        }

        </ul>

        <div className="delivery-artifact-list">
          <h4>Bucket list </h4>
          <ul>
            <li onClick={() => handleEditClick('/api/arts/js')}  >
              📁 XSS
            </li>
            <li onClick={() => handleEditClick('/api/arts/power')}  >
              📁 Powershell
            </li>
            <li onClick={() => handleEditClick('/api/arts/sh')}  >
              📁 Bash
            </li>
            <li onClick={() => handleEditClick('/api/arts/bin')}  >
              📁 Binarios
            </li>
            <li onClick={() => handleEditClick('/api/arts/web')}  >
              📁 Webshells
            </li>
          </ul>
        </div>
      </div>


      <AlertModal
        visible={alert}
        onClose={() => setAlert(false)}
        onConfirm={() => delete_user()}
        title="¡Atención!"
        description="¿Desea eliminar el usuario?"
        confirmText="Confirmar"
        cancelText="Cancelar"

      />
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
