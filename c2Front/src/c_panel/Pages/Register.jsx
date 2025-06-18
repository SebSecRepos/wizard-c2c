import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '../../hooks';
import { useNavigate } from 'react-router-dom';

// Esquema de validación con Yup
const schema = yup.object().shape({
  user_name: yup
    .string()
    .required('El usuario es obligatorio')
    .min(2, 'El usuario debe tener entre 2 y 20 caracteres')
    .max(20, 'El usuario debe tener entre 2 y 20 caracteres'),

  role: yup
    .string()
    .required('El rol es obligatorio'),

  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener entre 6 y 20 caracteres')
    .max(20, 'La contraseña debe tener entre 6 y 20 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .matches(/[a-z]/, 'Debe contener al menos una minúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[\W_]/, 'Debe contener al menos un carácter especial'),

  password_repeat: yup
  .string()
  .required('La contraseña es obligatoria')
  .oneOf([yup.ref('password'), null], 'Las contraseñas deben coincidir'),
 
});



export const Register = () => {

  const { startRegister, user } = useAuthStore();

  const navigate = useNavigate();

  if (user.role != "admin") navigate('/');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  
  const submit=(data)=>{
    console.log(data);
    
    startRegister(data);
  }
  
  return (
    <div className="login-container">
      <div className="login-form-1">
        <h3>Registro</h3>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="form-group">
            <input placeholder="Usuario" {...register('user_name')} className="form-control" />
            <p className="text-danger">{errors.user_name?.message}</p>
          </div>


          <div className="form-group">
            <input type="password" placeholder="Contraseña" {...register('password')} className="form-control" />
            <p className="text-danger">{errors.password?.message}</p>
          </div>

          <div className="form-group">
            <input type="password" placeholder="Repita su contraseña" {...register('password_repeat')} className="form-control" />
            <p className="text-danger">{errors.password_repeat?.message}</p>
          </div>
          
          <div className="form-group">
            <p>Rol de usuario</p>
             <select className="form-control" {...register(`role`)} defaultValue="hacker">
                <option value="hacker" >Hacker</option>
                <option value="admin" >Admin</option>
              </select>
            <p className="text-danger">{errors.password_repeat?.message}</p>
          </div>

          <div className="form-group d-flex justify-content-center">
            <input type="submit" className="btnSubmit" value="Enviar" />
          </div>
        </form>
      </div>
    </div>
  );
};
