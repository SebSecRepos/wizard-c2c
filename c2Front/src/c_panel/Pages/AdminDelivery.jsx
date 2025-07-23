// src/components/Register.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '../../hooks';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AlertModal from '../../util-components/AlertModal';
import { ToastContainer, toast } from "react-toastify";
import './AdminUsers.css';
import './AdminDelivery.css';


export const AdminDelivery = () => {
  const { startRegister, user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [page, setPage] = useState('/api/arts/js');
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
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

  useEffect(() => {
    if (user?.role !== "admin") navigate('/');
    fetchArtifacts();
  }, [page]);


  const onSubmit = async (data) => {
    setOnSending(true);

    if (editMode) {
      const sendData = {};
      for (const obj in data) {
        if (data[obj].length === 0 || obj === 'isEdit') continue;
        sendData[obj] = data[obj];
        console.log(data[obj]);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update/${editUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
        body: JSON.stringify(data)
      });

      const response = await res.json();
      if (response.ok) {
        toast.success("Usuario actualizado");
      } else {
        toast.error(response.errors);
      }
    } else {
      startRegister(data);
    }

    reset();
    setOnSending(false);
    fetchUsers();
    setEditUserId(null);
    setEditMode(false);

  };

  const handleEditClick = (page) => {
    setPage(page)
  };

  

  const handleUpload = async () => {
    if (!file) return;

    try {
      
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
      }else{
        toast.error(result.msg)
        
      }
      
    } catch (error) {
      
      toast.error(error)
    }
  };



  const delete_user = async () => {

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/delete/${editUserId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-token': Cookies.get('x-token')
      },
    });

    const response = await res.json();
    if (response.ok) {
      toast.success("Usuario eliminado");
      reset();
      setEditMode(false);
      setEditUserId(null);
      fetchUsers();
    } else {
      toast.error(response.errors);
    }

  }

  return (
    <div className="delivery-register-container">
      <h3>Delivery de artifacts, xss, powershell, bash, etc</h3>
      <h4>Ruta: {import.meta.env.VITE_API_URL}{page}/</h4>
      <div className="delivery-form-section">
        <ul className="delivery-files-container">
          {artifacts.length === 0 ? <p>No hay archivos</p>
          :
          
          artifacts.map((ar)=><li> <Link to={`${import.meta.env.VITE_API_URL}${page}/${ar}`}>{ar}</Link> </li>)
        
        }

        </ul>

        <div className="delivery-user-list">
          <h4>Contenedores de artifacts </h4>
          <ul>
            <li onClick={() => handleEditClick('/api/arts/js')}  >
              XSS
            </li>
            <li onClick={() => handleEditClick('/api/arts/power')}  >
              Powershell
            </li>
            <li onClick={() => handleEditClick('/api/arts/sh')}  >
              Bash
            </li>
            <li onClick={() => handleEditClick('/api/arts/bin')}  >
              Binarios
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={(e)=>e.preventDefault()} noValidate>

        {!onSending &&

          <div className="delivery-edit-btns">
            <input className="file-upload " type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload}>Subir archivo</button>
          </div>
        }

      </form>

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
