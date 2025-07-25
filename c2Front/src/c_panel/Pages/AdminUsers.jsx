// src/components/Register.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AlertModal from '../../util-components/AlertModal';
import { ToastContainer, toast } from "react-toastify";
import './AdminUsers.css';

const getValidationSchema = (isEdit) => {
  return yup.object().shape({
    user_name: yup
      .string()
      .required('El usuario es obligatorio')
      .min(2, 'El usuario debe tener entre 2 y 20 caracteres')
      .max(20, 'El usuario debe tener entre 2 y 20 caracteres'),

    role: yup
      .string()
      .required('El rol es obligatorio'),

    password: isEdit ? yup.string().when(['password_repeat'],{
          is: (val)=> val && val.length > 0,
          then: (schema)=>schema
            .required('La contraseña es obligatoria')
            .min(6, 'La contraseña debe tener entre 6 y 20 caracteres')
            .max(20, 'La contraseña debe tener entre 6 y 20 caracteres')
            .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
            .matches(/[a-z]/, 'Debe contener al menos una minúscula')
            .matches(/[0-9]/, 'Debe contener al menos un número')
            .matches(/[\W_]/, 'Debe contener al menos un carácter especial'),
          otherwise: (schema)=> schema.notRequired(),
      })
      : yup.string().required('La contraseña es obligatoria')
            .min(6, 'La contraseña debe tener entre 6 y 20 caracteres')
            .max(20, 'La contraseña debe tener entre 6 y 20 caracteres')
            .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
            .matches(/[a-z]/, 'Debe contener al menos una minúscula')
            .matches(/[0-9]/, 'Debe contener al menos un número')
            .matches(/[\W_]/, 'Debe contener al menos un carácter especial'),

    password_repeat: isEdit ? yup.string().when(['password'],{
          is: (val)=> val && val.length > 0,
          then: (schema)=>schema.oneOf([yup.ref('password')], 'Las contraseñas deben coincidir' )
                                .required('Confirmar contraseña'),
          otherwise: (schema)=> schema.notRequired(),})

          :

          yup.string().when(['password'],{
          is: (val)=> val && val.length > 0,
          then: (schema)=>schema.oneOf([yup.ref('password')], 'Las contraseñas deben coincidir' )
                                .required('Confirmar contraseña'),
          otherwise: (schema)=> schema.notRequired(),})
}, [['password', 'password_repeat']]);

}

export const AdminUsers = () => {
  const { startRegister, user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [alert, setAlert] = useState(false);
  const [onSending, setOnSending] = useState(false);


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(getValidationSchema(editMode)),
    defaultValues: {
      isEdit: editMode,
      password:undefined,
      password_repeat:undefined
    }
  });



  const fetchUsers = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/get_users`, {
      headers: { 'x-token': Cookies.get('x-token') },
    });
    const data = await res.json();
    setUsers(data.users);
  };

  useEffect(() => {
    if (user?.role !== "admin") navigate('/');
    fetchUsers();
  }, []);
 

  const onSubmit = async (data) => {
    setOnSending(true);

    if (editMode) {
      const sendData={};
      for (const obj in data){
        if(data[obj].length === 0 || obj === 'isEdit') continue;
        sendData[obj]= data[obj];
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

      const response= await res.json();
      if (response.ok) {
        toast.success("Usuario actualizado");
        fetchUsers();
      }else{
        toast.error(response.errors);
      }
    } else {
      startRegister(data);
      fetchUsers();
    }
    
    reset();
    setOnSending(false);
    fetchUsers();
    setEditUserId(null);
    setEditMode(false);

  };

  const handleEditClick = (user) => {
    setValue('user_name', user.user_name);
    setValue('role', user.role);
    setValue('password', '');
    setValue('password_repeat', '');
    setEditUserId(user._id);
    setEditMode(true);
  };

  const handleRegisterClick = () => {
    setValue('user_name', '');
    setValue('role', 'hacker');
    setValue('password', '');
    setValue('password_repeat', '');
    setEditUserId('');
    setEditMode(false);
  };


  const delete_user=async()=>{

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/delete/${editUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
      });

      const response= await res.json();
      if (response.ok) {
        toast.success("Usuario eliminado");
        reset();
        setEditMode(false);
        setEditUserId(null);
        fetchUsers();
      }else{
        toast.error(response.errors);
      }
    
  }

  return (
    <div className="register-container">
      <div className="form-section">
        <h3>{editMode ? 'Editar Usuario' : 'Registrar Usuario'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input placeholder="Usuario" {...register('user_name')} />
          <p className="error">{errors.user_name?.message}</p>

          <input type="password" placeholder="Contraseña" {...register('password')} />
          <p className="error">{errors.password?.message}</p>

          <input type="password" placeholder="Repetir contraseña" {...register('password_repeat')} />
          <p className="error">{errors.password_repeat?.message}</p>

          <select {...register('role')}>
            <option value="hacker">Hacker</option>
            <option value="admin">Admin</option>
          </select>
          <p className="error">{errors.role?.message}</p>

          { !onSending &&

            <div className="edit-btns">

              <input type="submit" value={editMode ? 'Actualizar' : 'Registrar'} />

              {
                editMode && 
                <button className='delete-user' type='button' onClick={(e)=> setAlert(true)}> Eliminar</button> 
              }

            </div>
          }

        </form>
      </div>

      <div className="user-list">
      <h4>Usuarios registrados (Click para editar o eliminar)</h4>
      <ul>
      { users.length > 0 ?
          <>
              {users.map(u => (
                
                <li key={u._id} onClick={() => handleEditClick(u)}  className={getValues().user_name === u.user_name ? 'selected-user' : ''}>
                  {u.user_name} ({u.role})
                </li>

              ))}
          </>
            :
            <h4>No hay usuarios</h4>
          }

          <hr />
        <li onClick={() => handleRegisterClick()} className={ editMode ? 'create-user-btn' : 'selected-user'}>
          Crear usuario
        </li>
      </ul>
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
